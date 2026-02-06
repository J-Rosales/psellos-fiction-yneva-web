import fs from 'node:fs';
import path from 'node:path';

export interface Repository {
  isKnownLayer(layer: string): boolean;
  listLayers(): string[];
  listEntities(layer: string): Array<Record<string, unknown>>;
  getEntityById(layer: string, id: string): Record<string, unknown> | null;
  listAssertions(layer: string): Array<Record<string, unknown>>;
  getGraphNeighborhood(layer: string): {
    nodes: Array<Record<string, unknown>>;
    edges: Array<Record<string, unknown>>;
  };
  getMapFeatures(layer: string): Array<Record<string, unknown>>;
  getLayerChangelog(layer: string, base: string): Record<string, unknown>;
}

export class ArtifactRepository implements Repository {
  private readonly assertionsByLayer: Record<string, string[]>;
  private readonly assertionsById: Record<string, Record<string, unknown>>;
  private readonly persons: Record<string, Record<string, unknown>>;
  private readonly layers: string[];

  constructor(dataDir = path.resolve(process.cwd(), 'public/data')) {
    this.assertionsByLayer = this.readJson<Record<string, string[]>>(
      path.join(dataDir, 'assertions_by_layer.json'),
      {},
    );
    this.assertionsById = this.readJson<Record<string, Record<string, unknown>>>(
      path.join(dataDir, 'assertions_by_id.json'),
      {},
    );
    this.persons = this.readJson<Record<string, Record<string, unknown>>>(
      path.join(dataDir, 'persons.json'),
      {},
    );

    const fromLayerIndex = Object.keys(this.assertionsByLayer);
    this.layers = fromLayerIndex.length > 0 ? fromLayerIndex : ['canon'];
  }

  private readJson<T>(filePath: string, fallback: T): T {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  isKnownLayer(layer: string): boolean {
    return this.layers.includes(layer);
  }

  listLayers(): string[] {
    return [...this.layers];
  }

  listEntities(_layer: string): Array<Record<string, unknown>> {
    return Object.values(this.persons);
  }

  getEntityById(_layer: string, id: string): Record<string, unknown> | null {
    return this.persons[id] ?? null;
  }

  listAssertions(layer: string): Array<Record<string, unknown>> {
    const ids = this.assertionsByLayer[layer] ?? [];
    return ids
      .map((id) => this.assertionsById[id])
      .filter((item): item is Record<string, unknown> => Boolean(item));
  }

  getGraphNeighborhood(layer: string): { nodes: Record<string, unknown>[]; edges: Record<string, unknown>[] } {
    const assertions = this.listAssertions(layer);
    const nodeIds = new Set<string>();
    assertions.forEach((item) => {
      const subject = this.readId(item, 'subject');
      const object = this.readId(item, 'object');
      if (subject) {
        nodeIds.add(subject);
      }
      if (object) {
        nodeIds.add(object);
      }
    });
    const nodes = Array.from(nodeIds).map((id) => ({
      id,
      ...(this.persons[id] ?? {}),
    }));
    return { nodes, edges: assertions };
  }

  getMapFeatures(layer: string): Record<string, unknown>[] {
    const assertions = this.listAssertions(layer);
    return assertions
      .filter((item) => this.hasLocationHint(item))
      .map((item) => ({
        type: 'Feature',
        geometry: null,
        properties: item,
      }));
  }

  getLayerChangelog(layer: string, base: string): Record<string, unknown> {
    const layerSet = new Set(this.assertionsByLayer[layer] ?? []);
    const baseSet = new Set(this.assertionsByLayer[base] ?? []);
    const added = Array.from(layerSet).filter((id) => !baseSet.has(id));
    const removed = Array.from(baseSet).filter((id) => !layerSet.has(id));
    return { layer, base, added, removed };
  }

  private readId(record: Record<string, unknown>, key: 'subject' | 'object'): string | null {
    const value = record[key];
    if (typeof value === 'string') {
      return value;
    }
    const alt = record[`${key}Id`];
    return typeof alt === 'string' ? alt : null;
  }

  private hasLocationHint(record: Record<string, unknown>): boolean {
    const payload = JSON.stringify(record).toLowerCase();
    return payload.includes('location') || payload.includes('place') || payload.includes('geo');
  }
}
