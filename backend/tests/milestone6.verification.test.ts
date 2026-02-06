import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import type { Repository } from '../src/lib/repository';

class Milestone6Repo implements Repository {
  isKnownLayer(layer: string): boolean {
    return ['canon', 'narrative'].includes(layer);
  }
  listLayers(): string[] {
    return ['canon', 'narrative'];
  }
  listEntities(layer: string): { items: Record<string, unknown>[]; totalCount: number; buckets: Record<string, unknown> } {
    const items = layer === 'canon' ? [{ id: 'c1' }, { id: 'c2' }] : [{ id: 'n1' }];
    return { items, totalCount: items.length, buckets: { unknown_label_count: 0, ambiguous_label_count: 0 } };
  }
  getEntityById(layer: string, id: string): Record<string, unknown> | null {
    return this.listEntities(layer).items.find((item) => item.id === id) ?? null;
  }
  listAssertions(layer: string): Record<string, unknown>[] {
    return layer === 'canon'
      ? [{ id: 'a1', subject: 'c1', predicate: 'knows', object: 'c2' }]
      : [{ id: 'a2', subject: 'n1', predicate: 'knows', object: 'n1' }];
  }
  getGraphNeighborhood(layer: string): { nodes: Record<string, unknown>[]; edges: Record<string, unknown>[] } {
    const assertions = this.listAssertions(layer);
    return { nodes: [{ id: 'c1' }, { id: 'c2' }], edges: assertions };
  }
  getMapFeatures(layer: string): { features: Record<string, unknown>[]; groups: Record<string, unknown>[]; buckets: Record<string, unknown> } {
    const assertions = this.listAssertions(layer);
    return {
      features: assertions.map((item) => ({ type: 'Feature', geometry: null, properties: { id: item.id } })),
      groups: [{ place_key: 'unknown_place', place_label: 'Unknown place', coordinates: null, assertion_ids: assertions.map((item) => String(item.id)), entity_ids: [] }],
      buckets: { unknown_geo_assertion_count: assertions.length, ambiguous_place_group_count: 0 },
    };
  }
  getLayerChangelog(layer: string, base: string): Record<string, unknown> {
    return { layer, base, added: [], removed: [] };
  }
}

describe('Milestone 6 verification', () => {
  const apps: Array<Awaited<ReturnType<typeof createApp>>> = [];

  afterEach(async () => {
    await Promise.all(apps.map((app) => app.close()));
    apps.length = 0;
  });

  it('keeps layer filtering consistent across entities, graph, and map', async () => {
    const app = await createApp({ repository: new Milestone6Repo() });
    apps.push(app);

    const entities = await app.inject({ method: 'GET', url: '/api/entities?layer=narrative' });
    const graph = await app.inject({ method: 'GET', url: '/api/graph/neighborhood?layer=narrative' });
    const map = await app.inject({ method: 'GET', url: '/api/map/features?layer=narrative' });

    expect(entities.statusCode).toBe(200);
    expect(graph.statusCode).toBe(200);
    expect(map.statusCode).toBe(200);

    expect(entities.json().meta.layer).toBe('narrative');
    expect(graph.json().meta.layer).toBe('narrative');
    expect(map.json().meta.layer).toBe('narrative');
  });

  it('exposes diagnostics consistency and metrics endpoints', async () => {
    const app = await createApp({ repository: new Milestone6Repo() });
    apps.push(app);

    await app.inject({ method: 'GET', url: '/api/entities?layer=canon' });
    await app.inject({ method: 'GET', url: '/api/graph/neighborhood?layer=canon' });

    const consistency = await app.inject({ method: 'GET', url: '/api/diagnostics/layer-consistency?layer=canon' });
    expect(consistency.statusCode).toBe(200);
    const consistencyBody = consistency.json();
    expect(consistencyBody.item.layer).toBe('canon');
    expect(typeof consistencyBody.item.checks.graph_edges_within_assertions).toBe('boolean');
    expect(typeof consistencyBody.item.checks.map_features_within_assertions).toBe('boolean');

    const metrics = await app.inject({ method: 'GET', url: '/api/diagnostics/metrics' });
    expect(metrics.statusCode).toBe(200);
    const metricsBody = metrics.json();
    expect(metricsBody.item.total_requests).toBeGreaterThan(0);
    expect(Object.keys(metricsBody.item.routes).length).toBeGreaterThan(0);
  });
});

