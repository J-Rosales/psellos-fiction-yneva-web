import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import type { Repository } from '../src/lib/repository';

class MockRepository implements Repository {
  isKnownLayer(layer: string): boolean {
    return layer === 'canon' || layer === 'narrative';
  }
  listLayers(): string[] {
    return ['canon', 'narrative'];
  }
  listEntities(layer: string): Record<string, unknown>[] {
    return layer === 'canon' ? [{ id: 'p1', name: 'Entity One' }] : [];
  }
  getEntityById(layer: string, id: string): Record<string, unknown> | null {
    if (layer === 'canon' && id === 'p1') return { id: 'p1', name: 'Entity One' };
    return null;
  }
  listAssertions(layer: string): Record<string, unknown>[] {
    return layer === 'canon' ? [{ id: 'a1', subject: 'p1', predicate: 'knows', object: 'p2' }] : [];
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

describe('API integration', () => {
  const apps: Array<Awaited<ReturnType<typeof createApp>>> = [];

  afterEach(async () => {
    await Promise.all(apps.map((app) => app.close()));
    apps.length = 0;
  });

  it('defaults missing layer to canon', async () => {
    const app = await createApp({ repository: new MockRepository() });
    apps.push(app);
    const response = await app.inject({
      method: 'GET',
      url: '/api/entities',
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.meta.layer).toBe('canon');
    expect(body.meta.result_count).toBe(1);
  });

  it('returns empty + warning for unknown layer', async () => {
    const app = await createApp({ repository: new MockRepository() });
    apps.push(app);
    const response = await app.inject({
      method: 'GET',
      url: '/api/assertions?layer=unknown-layer',
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.meta.layer).toBe('unknown-layer');
    expect(body.meta.result_count).toBe(0);
    expect(Array.isArray(body.meta.warnings)).toBe(true);
    expect(body.meta.warnings[0]).toContain('Unknown layer');
  });

  it('returns consistent error shape on bad query', async () => {
    const app = await createApp({ repository: new MockRepository() });
    apps.push(app);
    const response = await app.inject({
      method: 'GET',
      url: '/api/graph/neighborhood?depth=999',
    });
    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.status).toBe(400);
    expect(typeof body.message).toBe('string');
    expect(typeof body.request_id).toBe('string');
  });
});
