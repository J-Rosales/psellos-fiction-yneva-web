import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ArtifactRepository } from '../src/lib/repository';
import { createApp } from '../src/app';

function makeMapFixtureDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'psellos-m5-'));
  fs.writeFileSync(
    path.join(dir, 'persons.json'),
    JSON.stringify(
      {
        p1: { id: 'p1', label: 'A' },
        p2: { id: 'p2', label: 'B' },
        p3: { id: 'p3', label: 'C' },
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
          predicate: 'visited',
          extensions: { psellos: { rel: 'travel', place: 'Kythera', lat: 36.15, lon: 22.99 } },
        },
        a2: {
          id: 'a2',
          subject: 'p2',
          object: 'p3',
          predicate: 'visited',
          extensions: { psellos: { rel: 'travel', place: 'Kythera', lat: 36.15, lon: 22.99 } },
        },
        a3: {
          id: 'a3',
          subject: 'p1',
          object: 'p3',
          predicate: 'allied_with',
          extensions: { psellos: { rel: 'alliance', place: 'Unknown Marsh' } },
        },
      },
      null,
      2,
    ),
    'utf-8',
  );
  fs.writeFileSync(path.join(dir, 'assertions_by_layer.json'), JSON.stringify({ canon: ['a1', 'a2', 'a3'] }, null, 2), 'utf-8');
  return dir;
}

describe('Milestone 5 verification', () => {
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

  it('returns place-first grouped map response with raw features', async () => {
    const dir = makeMapFixtureDir();
    dirs.push(dir);
    const app = await createApp({ repository: new ArtifactRepository(dir) });
    apps.push(app);

    const response = await app.inject({ method: 'GET', url: '/api/map/features?layer=canon' });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.type).toBe('FeatureCollection');
    expect(Array.isArray(body.features)).toBe(true);
    expect(Array.isArray(body.groups)).toBe(true);
    expect(body.groups[0].place_label).toBe('Kythera');
  });

  it('surfaces unknown/ambiguous map buckets and supports rel_type hard filter', async () => {
    const dir = makeMapFixtureDir();
    dirs.push(dir);
    const app = await createApp({ repository: new ArtifactRepository(dir) });
    apps.push(app);

    const response = await app.inject({ method: 'GET', url: '/api/map/features?layer=canon' });
    const body = response.json();
    expect(body.meta.buckets.unknown_geo_assertion_count).toBe(1);
    expect(body.meta.buckets.ambiguous_place_group_count).toBe(1);

    const filtered = await app.inject({ method: 'GET', url: '/api/map/features?layer=canon&rel_type=alliance' });
    expect(filtered.statusCode).toBe(200);
    const filteredBody = filtered.json();
    expect(filteredBody.groups.length).toBe(1);
    expect(filteredBody.groups[0].place_label).toBe('Unknown Marsh');
  });
});

