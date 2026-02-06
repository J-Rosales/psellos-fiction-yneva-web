import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ArtifactRepository } from '../src/lib/repository';
import { createApp } from '../src/app';

function makeGraphFixtureDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'psellos-m4-'));
  fs.writeFileSync(
    path.join(dir, 'persons.json'),
    JSON.stringify(
      {
        p1: { id: 'p1', label: 'Alpha' },
        p2: { id: 'p2', label: 'Beta' },
        p3: { id: 'p3', label: 'Gamma' },
      },
      null,
      2,
    ),
    'utf-8',
  );
  fs.writeFileSync(
    path.join(dir, 'assertions_by_id.json'),
    JSON.stringify(
      {
        a1: {
          id: 'a1',
          subject: 'p1',
          object: 'p2',
          predicate: 'parent_of',
          extensions: { psellos: { rel: 'dynasty', confidence: 0.9 } },
        },
        a2: {
          id: 'a2',
          subject: 'p2',
          object: 'p3',
          predicate: 'mentor_of',
          extensions: { psellos: { rel: 'workplace', confidence: 0.4 } },
        },
      },
      null,
      2,
    ),
    'utf-8',
  );
  fs.writeFileSync(path.join(dir, 'assertions_by_layer.json'), JSON.stringify({ canon: ['a1', 'a2'] }, null, 2), 'utf-8');
  return dir;
}

describe('Milestone 4 verification', () => {
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

  it('filters graph neighborhood by depth and seed entity', async () => {
    const dir = makeGraphFixtureDir();
    dirs.push(dir);
    const app = await createApp({ repository: new ArtifactRepository(dir) });
    apps.push(app);

    const depth1 = await app.inject({ method: 'GET', url: '/api/graph/neighborhood?entity_id=p1&depth=1' });
    expect(depth1.statusCode).toBe(200);
    const depth1Body = depth1.json();
    expect(depth1Body.edges.map((item: { id: string }) => item.id)).toEqual(['a1']);

    const depth2 = await app.inject({ method: 'GET', url: '/api/graph/neighborhood?entity_id=p1&depth=2' });
    expect(depth2.statusCode).toBe(200);
    const depth2Body = depth2.json();
    expect(depth2Body.edges.map((item: { id: string }) => item.id)).toEqual(['a1', 'a2']);
  });

  it('orders graph expansion edges by confidence desc and applies rel_type hard filter', async () => {
    const dir = makeGraphFixtureDir();
    dirs.push(dir);
    const app = await createApp({ repository: new ArtifactRepository(dir) });
    apps.push(app);

    const response = await app.inject({ method: 'GET', url: '/api/graph/neighborhood?entity_id=p1&depth=3' });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.edges.map((item: { id: string }) => item.id)).toEqual(['a1', 'a2']);

    const filtered = await app.inject({
      method: 'GET',
      url: '/api/graph/neighborhood?entity_id=p1&depth=3&rel_type=workplace',
    });
    expect(filtered.statusCode).toBe(200);
    const filteredBody = filtered.json();
    expect(filteredBody.edges.map((item: { id: string }) => item.id)).toEqual([]);
  });
});

