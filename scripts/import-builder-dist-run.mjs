#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ENTITY_TYPE_PRECEDENCE = [
  'persons',
  'groups',
  'polities',
  'institutions',
  'offices',
  'places',
  'artifacts',
  'texts',
  'sources',
  'species',
];
const DEFAULT_SCORE_WEIGHTS = {
  scalar_field: 1,
  source: 2,
  layer: 2,
  temporal: 3,
  raw: 3,
};

function fail(message) {
  console.error(message);
  process.exit(1);
}

function parseArgs(argv) {
  const args = {
    distRun: '',
    out: 'public/data',
    strict: false,
    dryRun: false,
    report: '',
    scoreConfig: '',
  };
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--dist-run') {
      args.distRun = argv[++i] ?? '';
    } else if (token === '--out') {
      args.out = argv[++i] ?? '';
    } else if (token === '--strict') {
      args.strict = true;
    } else if (token === '--dry-run') {
      args.dryRun = true;
    } else if (token === '--report') {
      args.report = argv[++i] ?? '';
    } else if (token === '--score-config') {
      args.scoreConfig = argv[++i] ?? '';
    } else {
      fail(`Unknown argument: ${token}`);
    }
  }
  if (!args.distRun) {
    fail('Missing required argument: --dist-run <path>');
  }
  return args;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function listNonHidden(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }
  return fs.readdirSync(dirPath).filter((name) => !name.startsWith('.'));
}

function clearDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return;
  }
  for (const name of fs.readdirSync(dirPath)) {
    fs.rmSync(path.join(dirPath, name), { recursive: true, force: true });
  }
}

function backupDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return null;
  }
  const hasContent = listNonHidden(dirPath).length > 0;
  if (!hasContent) {
    return null;
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${dirPath}.bak.${timestamp}`;
  fs.cpSync(dirPath, backupPath, { recursive: true });
  return backupPath;
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
}

function walkFiles(dirPath, acc = []) {
  if (!fs.existsSync(dirPath)) {
    return acc;
  }
  for (const name of fs.readdirSync(dirPath)) {
    const fullPath = path.join(dirPath, name);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkFiles(fullPath, acc);
    } else {
      acc.push(fullPath);
    }
  }
  return acc;
}

function main() {
  const startedAt = new Date().toISOString();
  const args = parseArgs(process.argv);
  const distRun = path.resolve(process.cwd(), args.distRun);
  const outDir = path.resolve(process.cwd(), args.out);
  const reportPath = path.resolve(process.cwd(), args.report || path.join('docs', 'dist-run-import-report.json'));

  if (!fs.existsSync(distRun)) {
    fail(`Dist-run path not found: ${distRun}`);
  }

  const requiredEntries = ['machine', 'entities'];
  const optionalEntries = ['indexes', 'reports', 'narrative_layer_assertions.yml'];
  const missingRequired = requiredEntries.filter((entry) => !fs.existsSync(path.join(distRun, entry)));
  if (missingRequired.length > 0) {
    fail(`Missing required dist-run entries: ${missingRequired.join(', ')}`);
  }

  const warnings = [];
  const missingOptional = optionalEntries.filter((entry) => !fs.existsSync(path.join(distRun, entry)));
  if (missingOptional.length > 0) {
    const message = `Missing optional dist-run entries: ${missingOptional.join(', ')}`;
    if (args.strict) {
      fail(`${message} (strict mode)`);
    }
    warnings.push(message);
  }

  const scoreWeights = loadScoreWeights(args.scoreConfig);

  const entityDir = path.join(distRun, 'entities');
  const entityFiles = walkFiles(entityDir).filter((filePath) => {
    const lower = filePath.toLowerCase();
    return lower.endsWith('.yml') || lower.endsWith('.yaml');
  });
  if (entityFiles.length === 0) {
    warnings.push('No .yml/.yaml entity files detected under entities/');
  }

  let backupPath = null;
  if (!args.dryRun) {
    ensureDir(outDir);
    backupPath = backupDir(outDir);
    clearDir(outDir);
  }

  const persons = buildPersons(path.join(distRun, 'machine'));
  const assertionsResult = buildAssertionsById(distRun, warnings, scoreWeights);
  const assertionsById = assertionsResult.assertionsById;
  const assertions = Object.keys(assertionsById)
    .sort((a, b) => a.localeCompare(b))
    .map((id) => assertionsById[id]);
  const assertionsByLayer = buildAssertionsByLayer(assertionsById);
  const layers = Object.keys(assertionsByLayer).sort((a, b) => a.localeCompare(b));
  const assertionsByPerson = buildAssertionsByPerson(assertionsById);
  const assertionsByPersonByLayer = buildAssertionsByPersonByLayer(assertionsById);
  const runSummaryPath = path.join(distRun, 'reports', 'run_summary.json');
  const runSummary = fs.existsSync(runSummaryPath) ? parseJsonFile(runSummaryPath, {}) : {};
  const manifest = buildManifest({
    persons,
    assertionsById,
    distRun,
    runSummary,
    importedAt: new Date().toISOString(),
  });

  if (!args.dryRun) {
    writeJson(path.join(outDir, 'persons.json'), persons);
    writeJson(path.join(outDir, 'assertions_by_id.json'), assertionsById);
    writeJson(path.join(outDir, 'assertions.json'), assertions);
    writeJson(path.join(outDir, 'assertions_by_layer.json'), assertionsByLayer);
    writeJson(path.join(outDir, 'layers.json'), layers);
    writeJson(path.join(outDir, 'assertions_by_person.json'), assertionsByPerson);
    writeJson(path.join(outDir, 'assertions_by_person_by_layer.json'), assertionsByPersonByLayer);
    writeJson(path.join(outDir, 'manifest.json'), manifest);
  }

  const conflictReportPath = reportPath.replace(/\.json$/i, '.conflicts.json');
  if (!args.dryRun) {
    writeJson(conflictReportPath, assertionsResult.conflictReport);
  }

  const report = {
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    mode: args.dryRun ? 'dry-run' : 'apply',
    strict: args.strict,
    source: distRun,
    output: outDir,
    score_config: args.scoreConfig ? path.resolve(process.cwd(), args.scoreConfig) : null,
    backup_path: backupPath,
    checks: {
      required_entries: requiredEntries,
      optional_entries: optionalEntries,
      missing_optional: missingOptional,
      entity_yaml_files_count: entityFiles.length,
    },
    counts: {
      persons: Object.keys(persons).length,
      assertions: Object.keys(assertionsById).length,
      layers: layers.length,
      narrative_rows_emitted: assertionsResult.narrativeRowsEmitted,
    },
    duplicate_conflict_summary: {
      total_conflict_ids: assertionsResult.conflictReport.total_conflict_ids,
      discarded_rows: assertionsResult.conflictReport.discarded_rows,
      report_path: conflictReportPath,
    },
    narrative_layer: {
      narrative_layer_yaml_detected: assertionsResult.narrativeLayerDetected,
      narrative_layer_yaml_row_count: assertionsResult.narrativeLayerYamlRowCount,
      narrative_layer_merge_applied: assertionsResult.narrativeLayerDetected,
      narrative_layer_rows_emitted: assertionsResult.narrativeRowsEmitted,
    },
    warnings,
    note: 'D1 scaffold complete. Artifact generation pipeline is implemented in later milestones.',
  };

  writeJson(reportPath, report);
  console.log(`Import scaffold completed. Report written to ${reportPath}`);
}

function parseJsonFile(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return fallback;
  }
}

function normalizeType(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function selectPrimaryType(types) {
  if (types.length === 0) {
    return 'unknown';
  }
  const ranked = [...types].sort((a, b) => {
    const ai = ENTITY_TYPE_PRECEDENCE.indexOf(a);
    const bi = ENTITY_TYPE_PRECEDENCE.indexOf(b);
    const safeAi = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
    const safeBi = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
    if (safeAi !== safeBi) {
      return safeAi - safeBi;
    }
    return a.localeCompare(b);
  });
  return ranked[0];
}

function readCanonicalEntities(machineDir) {
  const files = fs
    .readdirSync(machineDir)
    .filter((name) => name.endsWith('.canonical.json'))
    .filter((name) => name !== 'assertions.canonical.json');

  const rows = [];
  for (const fileName of files) {
    const typeFromFile = normalizeType(fileName.replace('.canonical.json', ''));
    const payload = parseJsonFile(path.join(machineDir, fileName), null);
    if (!payload) continue;
    const items = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.items)
        ? payload.items
        : Array.isArray(payload.entities)
          ? payload.entities
          : Object.values(payload).filter((value) => typeof value === 'object' && value !== null);
    for (const item of items) {
      if (!item || typeof item !== 'object') continue;
      rows.push({ typeFromFile, row: item });
    }
  }
  return rows;
}

function buildPersons(machineDir) {
  const entries = new Map();
  const rows = readCanonicalEntities(machineDir);
  for (const { typeFromFile, row } of rows) {
    const qid = String(row.qid ?? row.id ?? '').trim();
    if (!qid) continue;
    const sourceTypes = new Set([
      typeFromFile,
      normalizeType(row.entity_type),
      ...(Array.isArray(row.entity_types) ? row.entity_types.map((v) => normalizeType(v)) : []),
      normalizeType(row.type),
    ].filter(Boolean));
    const sourceEntityIds = Array.isArray(row.source_entity_ids)
      ? row.source_entity_ids.map((value) => String(value)).filter(Boolean)
      : row.source_entity_id
        ? [String(row.source_entity_id)]
        : row.id
          ? [String(row.id)]
          : [];

    const existing = entries.get(qid) ?? {
      id: qid,
      qid,
      label: String(row.label ?? row.name ?? qid),
      entity_types: [],
      source_entity_ids: [],
    };

    const mergedTypes = new Set([...(existing.entity_types ?? []), ...sourceTypes]);
    const mergedSourceIds = new Set([...(existing.source_entity_ids ?? []), ...sourceEntityIds]);
    existing.entity_types = Array.from(mergedTypes).sort((a, b) => a.localeCompare(b));
    existing.entity_type = selectPrimaryType(existing.entity_types);
    existing.source_entity_ids = Array.from(mergedSourceIds).sort((a, b) => a.localeCompare(b));
    existing.label = String(existing.label ?? row.label ?? row.name ?? qid);
    entries.set(qid, existing);
  }

  return Object.fromEntries(
    Array.from(entries.keys())
      .sort((a, b) => a.localeCompare(b))
      .map((qid) => [qid, entries.get(qid)]),
  );
}

function buildAssertionsById(distRun, warnings, scoreWeights) {
  const indexesPath = path.join(distRun, 'indexes', 'assertions_by_id.json');
  const indexPayload = fs.existsSync(indexesPath) ? parseJsonFile(indexesPath, {}) : {};
  const hasIndexRows = indexPayload && typeof indexPayload === 'object' && Object.keys(indexPayload).length > 0;
  let baseAssertionsById = {};
  const conflicts = [];

  if (hasIndexRows) {
    const normalized = {};
    for (const [id, row] of Object.entries(indexPayload)) {
      const resolved = resolveDuplicateSet(
        String(id),
        [normalizeAssertionRow(String(id), row, { defaultLayer: 'canon', warnings })],
        scoreWeights,
      );
      normalized[String(id)] = resolved.winner;
      if (resolved.discarded.length > 0) {
        conflicts.push(resolved);
      }
    }
    baseAssertionsById = normalized;
  } else {
    const entityFiles = walkFiles(path.join(distRun, 'entities')).filter((filePath) => {
      const lower = filePath.toLowerCase();
      return lower.endsWith('.yml') || lower.endsWith('.yaml');
    });
    const candidatesById = new Map();
    let syntheticCounter = 0;
    for (const filePath of entityFiles) {
      const payload = parseYamlFile(filePath);
      if (payload === null) continue;
      const rows = extractAssertionRows(payload);
      for (const row of rows) {
        syntheticCounter += 1;
        const rawId = String(row.id ?? row.assertion_id ?? row.aid ?? `assertion:${syntheticCounter}`).trim();
        const id = rawId || `assertion:${syntheticCounter}`;
        const normalized = normalizeAssertionRow(id, row, { defaultLayer: 'canon', warnings });
        const existing = candidatesById.get(id) ?? [];
        existing.push(normalized);
        candidatesById.set(id, existing);
      }
    }
    const resolved = {};
    for (const id of Array.from(candidatesById.keys()).sort((a, b) => a.localeCompare(b))) {
      const selection = resolveDuplicateSet(id, candidatesById.get(id), scoreWeights);
      resolved[id] = selection.winner;
      if (selection.discarded.length > 0) {
        conflicts.push(selection);
      }
    }
    baseAssertionsById = resolved;
  }

  const narrativeMerge = mergeNarrativeLayerRows({
    distRun,
    existingById: baseAssertionsById,
    warnings,
    scoreWeights,
    existingConflicts: conflicts,
  });

  return {
    assertionsById: narrativeMerge.assertionsById,
    conflictReport: buildConflictReport(narrativeMerge.conflicts),
    narrativeLayerDetected: narrativeMerge.detected,
    narrativeLayerYamlRowCount: narrativeMerge.rowCount,
    narrativeRowsEmitted: narrativeMerge.rowsEmitted,
  };
}

function parseYamlFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return yaml.load(raw);
  } catch {
    return null;
  }
}

function extractAssertionRows(value) {
  const rows = [];
  walkAssertionCandidates(value, rows);
  return rows;
}

function extractNarrativeRows(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.filter((row) => row && typeof row === 'object');
  }
  if (typeof value !== 'object') {
    return [];
  }
  if (Array.isArray(value.rows)) {
    return value.rows.filter((row) => row && typeof row === 'object');
  }
  if (Array.isArray(value.assertions)) {
    return value.assertions.filter((row) => row && typeof row === 'object');
  }
  const rows = [];
  for (const [layer, entry] of Object.entries(value)) {
    if (!Array.isArray(entry)) continue;
    for (const row of entry) {
      if (!row || typeof row !== 'object') continue;
      rows.push({ layer, ...row });
    }
  }
  return rows;
}

function mergeNarrativeLayerRows({ distRun, existingById, warnings, scoreWeights, existingConflicts }) {
  const narrativePath = path.join(distRun, 'narrative_layer_assertions.yml');
  if (!fs.existsSync(narrativePath)) {
    return {
      assertionsById: existingById,
      conflicts: existingConflicts,
      detected: false,
      rowCount: 0,
      rowsEmitted: 0,
    };
  }

  const payload = parseYamlFile(narrativePath);
  const narrativeRows = extractNarrativeRows(payload);
  const candidatesById = new Map();
  for (const [id, assertion] of Object.entries(existingById)) {
    candidatesById.set(id, [assertion]);
  }

  let emitted = 0;
  for (let i = 0; i < narrativeRows.length; i += 1) {
    const row = narrativeRows[i];
    const linkedId = firstNonEmpty([row.linked_assertion_id, row.linkedAssertionId, row.assertion_ref]);
    const linked = linkedId ? existingById[linkedId] : null;
    const layer = firstNonEmpty([linked?.extensions?.psellos?.layer, row.layer, row.layer_id, row.narrative_layer, 'canon']);
    const id = firstNonEmpty([row.id, row.assertion_id, row.narrative_assertion_id]) || `narrative:${layer}:${linkedId || i + 1}`;
    const subject = firstNonEmpty([row.subject_qid, row.subject, linked?.subject]) || `unknown:subject:${id}`;
    const object = firstNonEmpty([row.object_qid, row.object, linked?.object]) || `unknown:object:${id}`;
    const predicate = firstNonEmpty([row.relation_mapped, row.predicate_pid, row.predicate_hint, row.predicate, linked?.predicate, 'related_to']);
    const source = firstNonEmpty([row.source, row.source_id, row.provenance_source]);
    const normalized = {
      id,
      subject,
      predicate,
      object,
      extensions: {
        psellos: {
          rel: predicate,
          layer,
          assertion_class: 'narrative_layer',
          ...(source ? { source } : {}),
          narrative: row,
          raw: row,
        },
      },
    };
    const existing = candidatesById.get(id) ?? [];
    existing.push(normalized);
    candidatesById.set(id, existing);
    emitted += 1;
  }

  const resolved = {};
  const conflicts = [...existingConflicts];
  for (const id of Array.from(candidatesById.keys()).sort((a, b) => a.localeCompare(b))) {
    const selection = resolveDuplicateSet(id, candidatesById.get(id), scoreWeights);
    resolved[id] = selection.winner;
    if (selection.discarded.length > 0) {
      conflicts.push(selection);
    }
  }

  return {
    assertionsById: resolved,
    conflicts,
    detected: true,
    rowCount: narrativeRows.length,
    rowsEmitted: emitted,
  };
}

function walkAssertionCandidates(node, rows) {
  if (Array.isArray(node)) {
    for (const item of node) {
      walkAssertionCandidates(item, rows);
    }
    return;
  }
  if (!node || typeof node !== 'object') {
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    if (Array.isArray(value) && key.toLowerCase().includes('assertion')) {
      for (const row of value) {
        if (row && typeof row === 'object') {
          rows.push(row);
        }
      }
      continue;
    }
    walkAssertionCandidates(value, rows);
  }
}

function firstNonEmpty(values) {
  for (const value of values) {
    const text = String(value ?? '').trim();
    if (text) return text;
  }
  return '';
}

function normalizeAssertionRow(id, row, context) {
  const source = row && typeof row === 'object' ? row : {};
  const subject = firstNonEmpty([source.subject_qid, source.subject, source.subject_id, source.subjectId]) || `unknown:subject:${id}`;
  const object = firstNonEmpty([source.object_qid, source.object, source.object_id, source.objectId]) || `unknown:object:${id}`;
  const selectedPredicate =
    firstNonEmpty([source.relation_mapped, source.predicate_pid, source.predicate_hint]) || 'related_to';
  const layer = firstNonEmpty([source.layer, source.layer_id, source.narrative_layer, context.defaultLayer]) || 'canon';
  const provenanceSource = firstNonEmpty([
    source.source,
    source.source_id,
    source.source_ref,
    source.provenance,
    source.provenance_source,
  ]);

  if (subject.startsWith('unknown:subject:') || object.startsWith('unknown:object:')) {
    context.warnings.push(`Assertion ${id} has missing subject/object and was kept with placeholders.`);
  }

  const normalized = {
    id,
    subject,
    predicate: selectedPredicate,
    object,
    extensions: {
      psellos: {
        rel: selectedPredicate,
        layer,
        ...(provenanceSource ? { source: provenanceSource } : {}),
        raw: source,
      },
    },
  };

  const directDate = firstNonEmpty([source.date, source.start_date, source.end_date, source.start, source.end]);
  if (directDate) {
    normalized.extensions.psellos.date = directDate;
  }
  return normalized;
}

function loadScoreWeights(scoreConfigArg) {
  if (!scoreConfigArg) {
    return { ...DEFAULT_SCORE_WEIGHTS };
  }
  const configPath = path.resolve(process.cwd(), scoreConfigArg);
  if (!fs.existsSync(configPath)) {
    fail(`Score config not found: ${configPath}`);
  }
  const payload = parseJsonFile(configPath, null);
  if (!payload || typeof payload !== 'object') {
    fail(`Invalid score config JSON: ${configPath}`);
  }
  return {
    scalar_field: Number(payload.scalar_field ?? DEFAULT_SCORE_WEIGHTS.scalar_field),
    source: Number(payload.source ?? DEFAULT_SCORE_WEIGHTS.source),
    layer: Number(payload.layer ?? DEFAULT_SCORE_WEIGHTS.layer),
    temporal: Number(payload.temporal ?? DEFAULT_SCORE_WEIGHTS.temporal),
    raw: Number(payload.raw ?? DEFAULT_SCORE_WEIGHTS.raw),
  };
}

function countScalars(value, pathKey = '') {
  if (pathKey.endsWith('.raw')) {
    return 0;
  }
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === 'string') {
    return value.trim() ? 1 : 0;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return 1;
  }
  if (Array.isArray(value)) {
    return value.reduce((sum, item) => sum + countScalars(item, pathKey), 0);
  }
  if (typeof value === 'object') {
    let sum = 0;
    for (const [key, item] of Object.entries(value)) {
      const nextPath = pathKey ? `${pathKey}.${key}` : key;
      sum += countScalars(item, nextPath);
    }
    return sum;
  }
  return 0;
}

function hasTemporal(assertion) {
  const json = JSON.stringify(assertion).toLowerCase();
  return json.includes('date') || json.includes('start') || json.includes('end') || json.includes('time');
}

function scoreAssertion(assertion, weights) {
  let score = countScalars(assertion) * weights.scalar_field;
  const ps = assertion?.extensions?.psellos ?? {};
  if (ps.source) score += weights.source;
  if (ps.layer) score += weights.layer;
  if (ps.raw) score += weights.raw;
  if (hasTemporal(assertion)) score += weights.temporal;
  return score;
}

function resolveDuplicateSet(id, rows, weights) {
  const list = Array.isArray(rows) ? rows : [];
  if (list.length === 0) {
    return { id, winner: null, discarded: [] };
  }
  let winner = list[0];
  let winnerScore = scoreAssertion(winner, weights);
  const discarded = [];

  for (let i = 1; i < list.length; i += 1) {
    const candidate = list[i];
    const candidateScore = scoreAssertion(candidate, weights);
    if (candidateScore > winnerScore) {
      discarded.push({ row: winner, score: winnerScore });
      winner = candidate;
      winnerScore = candidateScore;
    } else {
      discarded.push({ row: candidate, score: candidateScore });
    }
  }
  return {
    id,
    winner,
    winner_score: winnerScore,
    discarded,
  };
}

function buildConflictReport(conflicts) {
  return {
    total_conflict_ids: conflicts.length,
    discarded_rows: conflicts.reduce((sum, item) => sum + item.discarded.length, 0),
    conflicts: conflicts.map((item) => ({
      id: item.id,
      winner_score: item.winner_score,
      winner: item.winner,
      discarded: item.discarded,
    })),
  };
}

function buildAssertionsByLayer(assertionsById) {
  const mapping = {};
  for (const [id, assertion] of Object.entries(assertionsById)) {
    const layer = firstNonEmpty([assertion?.extensions?.psellos?.layer]) || 'canon';
    const existing = mapping[layer] ?? [];
    existing.push(id);
    mapping[layer] = existing;
  }
  return Object.fromEntries(
    Object.keys(mapping)
      .sort((a, b) => a.localeCompare(b))
      .map((layer) => [layer, Array.from(new Set(mapping[layer])).sort((a, b) => a.localeCompare(b))]),
  );
}

function isNarrativeAssertion(assertion) {
  return firstNonEmpty([assertion?.extensions?.psellos?.assertion_class]) === 'narrative_layer';
}

function buildAssertionsByPerson(assertionsById) {
  const mapping = {};
  for (const [id, assertion] of Object.entries(assertionsById)) {
    if (isNarrativeAssertion(assertion)) continue;
    const subject = firstNonEmpty([assertion.subject]);
    const object = firstNonEmpty([assertion.object]);
    for (const personId of [subject, object]) {
      if (!personId) continue;
      const existing = mapping[personId] ?? [];
      existing.push(id);
      mapping[personId] = existing;
    }
  }
  return Object.fromEntries(
    Object.keys(mapping)
      .sort((a, b) => a.localeCompare(b))
      .map((personId) => [personId, Array.from(new Set(mapping[personId])).sort((a, b) => a.localeCompare(b))]),
  );
}

function buildAssertionsByPersonByLayer(assertionsById) {
  const mapping = {};
  for (const [id, assertion] of Object.entries(assertionsById)) {
    if (isNarrativeAssertion(assertion)) continue;
    const layer = firstNonEmpty([assertion?.extensions?.psellos?.layer]) || 'canon';
    const subject = firstNonEmpty([assertion.subject]);
    const object = firstNonEmpty([assertion.object]);
    for (const personId of [subject, object]) {
      if (!personId) continue;
      const personMap = mapping[personId] ?? {};
      const existing = personMap[layer] ?? [];
      existing.push(id);
      personMap[layer] = existing;
      mapping[personId] = personMap;
    }
  }
  return Object.fromEntries(
    Object.keys(mapping)
      .sort((a, b) => a.localeCompare(b))
      .map((personId) => [
        personId,
        Object.fromEntries(
          Object.keys(mapping[personId])
            .sort((a, b) => a.localeCompare(b))
            .map((layer) => [layer, Array.from(new Set(mapping[personId][layer])).sort((a, b) => a.localeCompare(b))]),
        ),
      ]),
  );
}

function buildManifest({ persons, assertionsById, distRun, runSummary, importedAt }) {
  const personIndex = Object.fromEntries(
    Object.keys(persons)
      .sort((a, b) => a.localeCompare(b))
      .map((id) => [id, String(persons[id]?.label ?? id)]),
  );
  return {
    spec_version: 'compiled-dist-run.v1',
    builder_version: String(runSummary?.builder_version ?? runSummary?.version ?? 'unknown'),
    counts: {
      persons: Object.keys(persons).length,
      assertions: Object.keys(assertionsById).length,
    },
    person_index: personIndex,
    source_dist_run: distRun,
    source_generated_at: String(runSummary?.generated_at ?? runSummary?.timestamp ?? ''),
    imported_at: importedAt,
  };
}

main();
