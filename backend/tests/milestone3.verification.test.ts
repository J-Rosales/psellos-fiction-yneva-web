import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ArtifactRepository } from '../src/lib/repository';
import { createApp } from '../src/app';

function makeFixtureDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'psellos-m3-'));
  const persons = {
    p1: { id: 'p1', label: 'Alexios Komnenos', entity_type: 'person' },
    p2: { id: 'p2', label: 'Alexios Komnenos', entity_type: 'person' },
    p3: { id: 'p3', label: '', entity_type: 'person' },
    p4: { id: 'p4', label: 'Maria Doukaina', entity_type: 'person' },
  };
  const assertionsById = {
    a1: { id: 'a1', subject: 'p1', object: 'p4', predicate: 'ally_of', extensions: { psellos: { rel: 'ally' } } },
    a2: { id: 'a2', subject: 'p2', object: 'p4', predicate: 'enemy_of', extensions: { psellos: { rel: 'enemy' } } },
    a3: { id: 'a3', subject: 'p4', object: 'p1', predicate: 'mentor_of', extensions: { psellos: { rel: 'mentor' } } },
  };
  const assertionsByLayer = { canon: ['a1', 'a2', 'a3'] };

  fs.writeFileSync(path.join(dir, 'persons.json'), JSON.stringify(persons, null, 2), 'utf-8');
  fs.writeFileSync(path.join(dir, 'assertions_by_id.json'), JSON.stringify(assertionsById, null, 2), 'utf-8');
  fs.writeFileSync(path.join(dir, 'assertions_by_layer.json'), JSON.stringify(assertionsByLayer, null, 2), 'utf-8');
  return dir;
}

describe('Milestone 3 verification', () => {
  const dirs: string[] = [];
  const apps: Array<Awaited<ReturnType<typeof createApp>>> = [];

  afterEach(async () => {
    await Promise.all(apps.map((app) => app.close()));
    for (const dir of dirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    dirs.length = 0;
    apps.length = 0;
  });

  it('supports fuzzy and exact search semantics with deterministic order', () => {
    const dir = makeFixtureDir();
    dirs.push(dir);
    const repo = new ArtifactRepository(dir);

    const fuzzy = repo.listEntities('canon', { q: 'alex', exact: false, page: 0, pageSize: 25 });
    expect(fuzzy.items.map((item) => item.id)).toEqual(['p1', 'p2']);

    const exact = repo.listEntities('canon', { q: 'alexios komnenos', exact: true, page: 0, pageSize: 25 });
    expect(exact.items.map((item) => item.id)).toEqual(['p1', 'p2']);
  });

  it('enforces hard include/exclude rel_type filtering', () => {
    const dir = makeFixtureDir();
    dirs.push(dir);
    const repo = new ArtifactRepository(dir);

    const includeOnly = repo.listEntities('canon', { rel_type: 'ally', page: 0, pageSize: 25 });
    expect(includeOnly.items.map((item) => item.id)).toContain('p1');
    expect(includeOnly.items.map((item) => item.id)).not.toContain('p2');

    const excludeEnemy = repo.listEntities('canon', { rel_type: '!enemy', page: 0, pageSize: 25 });
    expect(excludeEnemy.items.map((item) => item.id)).not.toContain('p2');
  });

  it('surfaces unknown and ambiguous buckets in entities API metadata', async () => {
    const dir = makeFixtureDir();
    dirs.push(dir);
    const app = await createApp({ repository: new ArtifactRepository(dir) });
    apps.push(app);

    const response = await app.inject({ method: 'GET', url: '/api/entities?layer=canon&page=0&page_size=25' });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.meta.total_count).toBe(4);
    expect(body.meta.buckets.unknown_label_count).toBe(1);
    expect(body.meta.buckets.ambiguous_label_count).toBe(2);
  });
});

