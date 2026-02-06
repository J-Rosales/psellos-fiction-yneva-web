import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import type { Repository } from '../src/lib/repository';

class MilestoneRepo implements Repository {
  isKnownLayer(layer: string): boolean {
    return ['canon', 'narrative'].includes(layer);
  }
  listLayers(): string[] {
    return ['canon', 'narrative'];
  }
  listEntities(layer: string): Record<string, unknown>[] {
    return layer === 'canon'
      ? [
          { id: 'p1', name: 'Entity One' },
          { id: 'p2', name: 'Entity Two' },
        ]
      : [];
  }
  getEntityById(layer: string, id: string): Record<string, unknown> | null {
    return this.listEntities(layer).find((entity) => entity.id === id) ?? null;
  }
  listAssertions(layer: string): Record<string, unknown>[] {
    return layer === 'canon'
      ? [{ id: 'a1', subject: 'p1', predicate: 'knows', object: 'p2' }]
      : [];
  }
  getGraphNeighborhood(layer: string): { nodes: Record<string, unknown>[]; edges: Record<string, unknown>[] } {
    if (layer !== 'canon') return { nodes: [], edges: [] };
    return {
      nodes: [{ id: 'p1' }, { id: 'p2' }],
      edges: [{ id: 'a1', subject: 'p1', predicate: 'knows', object: 'p2' }],
    };
  }
  getMapFeatures(layer: string): Record<string, unknown>[] {
    if (layer !== 'canon') return [];
    return [{ type: 'Feature', geometry: null, properties: { id: 'a1' } }];
  }
  getLayerChangelog(layer: string, base: string): Record<string, unknown> {
    return { layer, base, added: [], removed: [] };
  }
}

describe('Milestone 2 verification', () => {
  const apps: Array<Awaited<ReturnType<typeof createApp>>> = [];

  afterEach(async () => {
    await Promise.all(apps.map((app) => app.close()));
    apps.length = 0;
  });

  it('exposes all baseline read-only endpoints', async () => {
    const app = await createApp({ repository: new MilestoneRepo() });
    apps.push(app);

    const checks: Array<[string, string]> = [
      ['GET', '/api/entities'],
      ['GET', '/api/entities/p1'],
      ['GET', '/api/assertions'],
      ['GET', '/api/graph/neighborhood'],
      ['GET', '/api/map/features'],
      ['GET', '/api/layers'],
      ['GET', '/api/layers/canon/changelog'],
    ];

    for (const [method, url] of checks) {
      const response = await app.inject({ method, url });
      expect(response.statusCode).toBeLessThan(500);
    }
  });

  it('returns warnings and empty payloads for unknown layers across endpoints', async () => {
    const app = await createApp({ repository: new MilestoneRepo() });
    apps.push(app);

    const endpoints = ['/api/entities', '/api/assertions', '/api/graph/neighborhood', '/api/map/features'];
    for (const endpoint of endpoints) {
      const response = await app.inject({ method: 'GET', url: `${endpoint}?layer=unknown` });
      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.meta.layer).toBe('unknown');
      expect(body.meta.result_count).toBe(0);
      expect(Array.isArray(body.meta.warnings)).toBe(true);
    }
  });

  it('produces consistent error shape for validation failures', async () => {
    const app = await createApp({ repository: new MilestoneRepo() });
    apps.push(app);

    const response = await app.inject({
      method: 'GET',
      url: '/api/graph/neighborhood?depth=999',
    });
    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body).toMatchObject({
      status: 400,
    });
    expect(typeof body.message).toBe('string');
    expect(typeof body.request_id).toBe('string');
  });

  it('keeps milestone 2 assets present (schema and ingest script)', () => {
    expect(fs.existsSync(path.resolve(process.cwd(), 'backend/sql/schema.sql'))).toBe(true);
    expect(fs.existsSync(path.resolve(process.cwd(), 'backend/scripts/ingestCompiledArtifacts.mjs'))).toBe(true);
  });

  it('keeps ingest dry-run report in expected shape', () => {
    const reportPath = path.resolve(process.cwd(), 'docs/m2-ingest-report.json');
    expect(fs.existsSync(reportPath)).toBe(true);
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8')) as {
      counts?: Record<string, number>;
      failures?: unknown[];
    };
    expect(report.counts).toBeTruthy();
    expect(typeof report.counts?.layers).toBe('number');
    expect(typeof report.counts?.persons).toBe('number');
    expect(typeof report.counts?.assertions).toBe('number');
    expect(Array.isArray(report.failures)).toBe(true);
  });
});
