import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';
import { ArtifactRepository } from '../src/lib/repository';

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
}

function writeYaml(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content.trimStart(), 'utf-8');
}

function makeTempRoot(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'psellos-importer-test-'));
}

function runImporter(distRunDir: string, outDir: string, reportPath: string, extraArgs: string[] = []): void {
  execFileSync(
    process.execPath,
    ['scripts/import-builder-dist-run.mjs', '--dist-run', distRunDir, '--out', outDir, '--report', reportPath, ...extraArgs],
    { cwd: path.resolve(process.cwd()), stdio: 'pipe' },
  );
}

function makeDistRunFixture(root: string): { distRunDir: string; scoreConfigPath: string } {
  const distRunDir = path.join(root, 'dist-run');
  const machineDir = path.join(distRunDir, 'machine');
  const entitiesDir = path.join(distRunDir, 'entities');
  const reportsDir = path.join(distRunDir, 'reports');
  const indexesDir = path.join(distRunDir, 'indexes');

  fs.mkdirSync(machineDir, { recursive: true });
  fs.mkdirSync(entitiesDir, { recursive: true });
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.mkdirSync(indexesDir, { recursive: true });

  writeJson(path.join(machineDir, 'persons.canonical.json'), [
    { qid: 'p1', label: 'Alpha' },
    { qid: 'p2', label: 'Beta' },
    { qid: 'p3', label: 'Gamma' },
  ]);
  writeJson(path.join(machineDir, 'groups.canonical.json'), [{ qid: 'g1', label: 'Circle' }]);
  writeJson(path.join(reportsDir, 'run_summary.json'), {
    builder_version: 'test-builder-1',
    generated_at: '2026-02-01T00:00:00Z',
  });
  writeJson(path.join(indexesDir, 'assertions_by_id.json'), {});

  writeYaml(
    path.join(entitiesDir, 'sample.yml'),
    `
entity:
  assertions:
    - id: a1
      subject_qid: p1
      object_qid: p2
      relation_mapped: allied_with
      layer: canon
      confidence: 0.6
    - id: a1
      subject_qid: p1
      object_qid: p2
      relation_mapped: allied_with
      layer: canon
      source: source-canon
      confidence: 0.8
      date: 1001
      note: richer
    - id: a2
      subject_qid: p2
      object_qid: p3
      predicate_pid: governs
      layer: canon
`,
  );

  writeYaml(
    path.join(distRunDir, 'narrative_layer_assertions.yml'),
    `
rows:
  - id: n1
    linked_assertion_id: a1
    note: "narrative expansion"
`,
  );

  const scoreConfigPath = path.join(root, 'score-config.json');
  writeJson(scoreConfigPath, {
    scalar_field: 1,
    source: 2,
    layer: 2,
    temporal: 3,
    raw: 3,
  });

  return { distRunDir, scoreConfigPath };
}

describe('Importer verification (D9)', () => {
  const cleanup: string[] = [];

  afterEach(() => {
    for (const dir of cleanup) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    cleanup.length = 0;
  });

  it('covers import success, YAML fallback normalization, duplicate scoring, and narrative layer mapping', () => {
    const root = makeTempRoot();
    cleanup.push(root);
    const { distRunDir, scoreConfigPath } = makeDistRunFixture(root);
    const outDir = path.join(root, 'out');
    const reportPath = path.join(root, 'report.json');

    runImporter(distRunDir, outDir, reportPath, ['--score-config', scoreConfigPath]);

    const persons = JSON.parse(fs.readFileSync(path.join(outDir, 'persons.json'), 'utf-8')) as Record<string, unknown>;
    const byId = JSON.parse(fs.readFileSync(path.join(outDir, 'assertions_by_id.json'), 'utf-8')) as Record<
      string,
      Record<string, unknown>
    >;
    const byLayer = JSON.parse(fs.readFileSync(path.join(outDir, 'assertions_by_layer.json'), 'utf-8')) as Record<
      string,
      string[]
    >;
    const byPerson = JSON.parse(fs.readFileSync(path.join(outDir, 'assertions_by_person.json'), 'utf-8')) as Record<
      string,
      string[]
    >;
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8')) as Record<string, unknown>;
    const conflicts = JSON.parse(fs.readFileSync(reportPath.replace('.json', '.conflicts.json'), 'utf-8')) as {
      total_conflict_ids: number;
      discarded_rows: number;
      conflicts: Array<{ id: string; winner: Record<string, unknown>; discarded: Array<Record<string, unknown>> }>;
    };

    expect(Object.keys(persons).length).toBeGreaterThanOrEqual(4);
    expect(byId.a2?.predicate).toBe('governs');
    expect(byId.a1?.extensions?.psellos?.raw?.note).toBe('richer');
    expect(conflicts.total_conflict_ids).toBeGreaterThan(0);
    expect(conflicts.conflicts.some((item) => item.id === 'a1')).toBe(true);
    expect(byId.n1?.extensions?.psellos?.assertion_class).toBe('narrative_layer');
    expect(byLayer.canon).toContain('n1');
    expect(Object.values(byPerson).flat()).not.toContain('n1');
    expect((report.critical_hashes as Record<string, string>)['assertions_by_id.json']).toMatch(/^[a-f0-9]{64}$/);
  });

  it('produces artifacts readable by ArtifactRepository and deterministic critical hashes for fixed fixture', () => {
    const root = makeTempRoot();
    cleanup.push(root);
    const { distRunDir, scoreConfigPath } = makeDistRunFixture(root);

    const outA = path.join(root, 'out-a');
    const outB = path.join(root, 'out-b');
    const reportA = path.join(root, 'report-a.json');
    const reportB = path.join(root, 'report-b.json');

    runImporter(distRunDir, outA, reportA, ['--score-config', scoreConfigPath]);
    runImporter(distRunDir, outB, reportB, ['--score-config', scoreConfigPath]);

    const repo = new ArtifactRepository(outA);
    expect(repo.listLayers()).toContain('canon');
    expect(repo.listAssertions('canon').length).toBeGreaterThan(0);

    const parsedA = JSON.parse(fs.readFileSync(reportA, 'utf-8')) as Record<string, unknown>;
    const parsedB = JSON.parse(fs.readFileSync(reportB, 'utf-8')) as Record<string, unknown>;
    const hashesA = parsedA.critical_hashes as Record<string, string>;
    const hashesB = parsedB.critical_hashes as Record<string, string>;

    expect(hashesA['persons.json']).toBe(hashesB['persons.json']);
    expect(hashesA['assertions_by_id.json']).toBe(hashesB['assertions_by_id.json']);
    expect(hashesA['assertions_by_layer.json']).toBe(hashesB['assertions_by_layer.json']);
    expect(hashesA['layers.json']).toBe(hashesB['layers.json']);
  });
});
