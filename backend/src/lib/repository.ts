import fs from 'node:fs';
import path from 'node:path';

export interface Repository {
  isKnownLayer(layer: string): boolean;
  listLayers(): string[];
  listEntities(
    layer: string,
    options?: {
      q?: string;
      exact?: boolean;
      rel_type?: string;
      entity_type?: string;
      page?: number;
      pageSize?: number;
    },
  ): {
    items: Array<Record<string, unknown>>;
    totalCount: number;
    buckets: Record<string, unknown>;
  };
  getEntityById(layer: string, id: string): Record<string, unknown> | null;
  listAssertions(
    layer: string,
    options?: { rel_type?: string; entity_id?: string },
  ): Array<Record<string, unknown>>;
  getGraphNeighborhood(
    layer: string,
    options?: { entityId?: string; depth?: number; relType?: string },
  ): {
    nodes: Array<Record<string, unknown>>;
    edges: Array<Record<string, unknown>>;
  };
  getMapFeatures(
    layer: string,
    options?: { rel_type?: string; q?: string },
  ): {
    features: Array<Record<string, unknown>>;
    groups: Array<Record<string, unknown>>;
    buckets: Record<string, unknown>;
  };
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

  listEntities(
    layer: string,
    options?: {
      q?: string;
      exact?: boolean;
      rel_type?: string;
      entity_type?: string;
      page?: number;
      pageSize?: number;
    },
  ): {
    items: Array<Record<string, unknown>>;
    totalCount: number;
    buckets: Record<string, unknown>;
  } {
    const query = (options?.q ?? '').trim().toLowerCase();
    const exact = options?.exact ?? false;
    const entityType = (options?.entity_type ?? '').trim().toLowerCase();
    const relFilter = this.parseRelTypeFilter(options?.rel_type);
    const page = options?.page ?? 0;
    const pageSize = options?.pageSize ?? 25;
    const allAssertions = this.listAssertions(layer);

    const ranked = Object.values(this.persons)
      .map((entity) => ({ entity, score: this.scoreEntity(entity, query, exact) }))
      .filter(({ entity, score }) => {
        if (query && score < 0) {
          return false;
        }
        if (entityType) {
          const value = String(entity.entity_type ?? '').toLowerCase();
          if (value !== entityType) {
            return false;
          }
        }
        return this.matchesEntityRelationFilter(entity, allAssertions, relFilter);
      })
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }
        const leftLabel = String(left.entity.label ?? left.entity.id ?? '');
        const rightLabel = String(right.entity.label ?? right.entity.id ?? '');
        const byLabel = leftLabel.localeCompare(rightLabel, undefined, { sensitivity: 'base' });
        if (byLabel !== 0) {
          return byLabel;
        }
        return String(left.entity.id ?? '').localeCompare(String(right.entity.id ?? ''), undefined, {
          sensitivity: 'base',
        });
      })
      .map(({ entity }) => entity);

    const totalCount = ranked.length;
    const items = ranked.slice(page * pageSize, page * pageSize + pageSize);
    const buckets = this.buildEntityBuckets(ranked);
    return { items, totalCount, buckets };
  }

  getEntityById(_layer: string, id: string): Record<string, unknown> | null {
    return this.persons[id] ?? null;
  }

  listAssertions(layer: string, options?: { rel_type?: string; entity_id?: string }): Array<Record<string, unknown>> {
    const ids = this.assertionsByLayer[layer] ?? [];
    const relFilter = this.parseRelTypeFilter(options?.rel_type);
    const entityId = (options?.entity_id ?? '').trim();
    return ids
      .map((id) => this.assertionsById[id])
      .filter((item): item is Record<string, unknown> => Boolean(item))
      .filter((item) => this.matchesRelTypeFilter(item, relFilter))
      .filter((item) => {
        if (!entityId) {
          return true;
        }
        return this.readId(item, 'subject') === entityId || this.readId(item, 'object') === entityId;
      });
  }

  getGraphNeighborhood(
    layer: string,
    options?: { entityId?: string; depth?: number; relType?: string },
  ): { nodes: Record<string, unknown>[]; edges: Record<string, unknown>[] } {
    const assertions = this.listAssertions(layer, { rel_type: options?.relType });
    const depth = options?.depth ?? 2;
    const seed = (options?.entityId ?? '').trim();
    let edges = assertions;
    let nodeIds = new Set<string>();

    if (seed) {
      const traversal = this.traverseNeighborhood(seed, assertions, depth);
      edges = traversal.edges;
      nodeIds = traversal.nodeIds;
    } else {
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
    }

    edges = [...edges].sort((left, right) => this.readConfidence(right) - this.readConfidence(left));
    const nodes = Array.from(nodeIds).map((id) => ({
      id,
      ...(this.persons[id] ?? {}),
    }));
    return { nodes, edges };
  }

  getMapFeatures(
    layer: string,
    options?: { rel_type?: string; q?: string },
  ): {
    features: Array<Record<string, unknown>>;
    groups: Array<Record<string, unknown>>;
    buckets: Record<string, unknown>;
  } {
    const assertions = this.listAssertions(layer, { rel_type: options?.rel_type });
    const query = String(options?.q ?? '').trim().toLowerCase();
    const groups = new Map<
      string,
      {
        place_key: string;
        place_label: string;
        coordinates: [number, number] | null;
        assertion_ids: string[];
        entity_ids: string[];
      }
    >();
    let unknownGeoCount = 0;

    assertions.forEach((item) => {
      const placeLabel = this.extractPlaceLabel(item);
      const coords = this.extractCoordinates(item);
      const placeKey = placeLabel.toLowerCase() || 'unknown_place';
      const subject = this.readId(item, 'subject');
      const object = this.readId(item, 'object');
      const entityIds = [subject, object].filter((id): id is string => Boolean(id));

      if (query) {
        const searchable = `${placeLabel} ${entityIds.join(' ')} ${JSON.stringify(item).toLowerCase()}`;
        if (!searchable.includes(query)) {
          return;
        }
      }

      const existing = groups.get(placeKey) ?? {
        place_key: placeKey,
        place_label: placeLabel || 'Unknown place',
        coordinates: coords,
        assertion_ids: [],
        entity_ids: [],
      };
      existing.assertion_ids.push(String(item.id ?? 'unknown-assertion'));
      entityIds.forEach((entityId) => {
        if (!existing.entity_ids.includes(entityId)) {
          existing.entity_ids.push(entityId);
        }
      });
      if (!existing.coordinates && coords) {
        existing.coordinates = coords;
      }
      if (!coords) {
        unknownGeoCount += 1;
      }
      groups.set(placeKey, existing);
    });

    const orderedGroups = Array.from(groups.values()).sort((left, right) =>
      left.place_label.localeCompare(right.place_label, undefined, { sensitivity: 'base' }),
    );
    const features = orderedGroups.map((group) => ({
      type: 'Feature',
      geometry: group.coordinates
        ? { type: 'Point', coordinates: [group.coordinates[1], group.coordinates[0]] }
        : null,
      properties: {
        place_key: group.place_key,
        place_label: group.place_label,
        assertion_count: group.assertion_ids.length,
        entity_ids: group.entity_ids,
      },
    }));

    const ambiguousPlaceCount = orderedGroups.filter((group) => group.assertion_ids.length > 1).length;
    return {
      features,
      groups: orderedGroups,
      buckets: {
        unknown_geo_assertion_count: unknownGeoCount,
        ambiguous_place_group_count: ambiguousPlaceCount,
      },
    };
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

  private extractPlaceLabel(record: Record<string, unknown>): string {
    const candidates = [
      this.readNestedString(record, ['extensions', 'psellos', 'place']),
      this.readNestedString(record, ['extensions', 'psellos', 'location']),
      this.readNestedString(record, ['location', 'name']),
      this.readNestedString(record, ['place', 'name']),
      this.readNestedString(record, ['place']),
      this.readNestedString(record, ['location']),
    ].filter(Boolean);
    return candidates[0] ? this.toTitle(candidates[0]) : '';
  }

  private extractCoordinates(record: Record<string, unknown>): [number, number] | null {
    const latCandidates = [
      this.readNestedNumber(record, ['extensions', 'psellos', 'lat']),
      this.readNestedNumber(record, ['location', 'lat']),
      this.readNestedNumber(record, ['lat']),
      this.readNestedNumber(record, ['latitude']),
    ];
    const lonCandidates = [
      this.readNestedNumber(record, ['extensions', 'psellos', 'lon']),
      this.readNestedNumber(record, ['extensions', 'psellos', 'lng']),
      this.readNestedNumber(record, ['location', 'lon']),
      this.readNestedNumber(record, ['location', 'lng']),
      this.readNestedNumber(record, ['lon']),
      this.readNestedNumber(record, ['lng']),
      this.readNestedNumber(record, ['longitude']),
    ];
    const lat = latCandidates.find((value): value is number => typeof value === 'number');
    const lon = lonCandidates.find((value): value is number => typeof value === 'number');
    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return null;
    }
    return [lat, lon];
  }

  private toTitle(value: string): string {
    return value
      .split(' ')
      .filter(Boolean)
      .map((token) => token.slice(0, 1).toUpperCase() + token.slice(1))
      .join(' ');
  }

  private traverseNeighborhood(
    seed: string,
    edges: Array<Record<string, unknown>>,
    maxDepth: number,
  ): { nodeIds: Set<string>; edges: Array<Record<string, unknown>> } {
    const nodeIds = new Set<string>([seed]);
    const selected: Array<Record<string, unknown>> = [];
    const selectedEdgeIds = new Set<string>();
    const frontier = new Set<string>([seed]);
    for (let depth = 0; depth < maxDepth; depth += 1) {
      const nextFrontier = new Set<string>();
      edges.forEach((edge) => {
        const subject = this.readId(edge, 'subject');
        const object = this.readId(edge, 'object');
        if (!subject || !object) {
          return;
        }
        if (frontier.has(subject) || frontier.has(object)) {
          const edgeId = String(edge.id ?? `${subject}-${object}-${String(edge.predicate ?? '')}`);
          if (!selectedEdgeIds.has(edgeId)) {
            selected.push(edge);
            selectedEdgeIds.add(edgeId);
          }
          if (!nodeIds.has(subject)) {
            nodeIds.add(subject);
            nextFrontier.add(subject);
          }
          if (!nodeIds.has(object)) {
            nodeIds.add(object);
            nextFrontier.add(object);
          }
        }
      });
      frontier.clear();
      nextFrontier.forEach((id) => frontier.add(id));
      if (frontier.size === 0) {
        break;
      }
    }
    return { nodeIds, edges: selected };
  }

  private readConfidence(record: Record<string, unknown>): number {
    const raw = this.readNestedNumber(record, ['extensions', 'psellos', 'confidence']);
    if (typeof raw === 'number') {
      return raw;
    }
    return 0.5;
  }

  private readNestedNumber(record: Record<string, unknown>, pathParts: string[]): number | null {
    let current: unknown = record;
    for (const key of pathParts) {
      if (typeof current !== 'object' || current === null || !(key in current)) {
        return null;
      }
      current = (current as Record<string, unknown>)[key];
    }
    return typeof current === 'number' ? current : null;
  }

  private scoreEntity(entity: Record<string, unknown>, query: string, exact: boolean): number {
    if (!query) {
      return 0;
    }
    const id = String(entity.id ?? '').toLowerCase();
    const label = String(entity.label ?? '').toLowerCase();
    if (exact) {
      if (label === query) {
        return 1000;
      }
      if (id === query) {
        return 900;
      }
      if (label.includes(query)) {
        return 500;
      }
      if (id.includes(query)) {
        return 400;
      }
      return -1;
    }
    const tokens = query.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) {
      return 0;
    }
    let score = 0;
    for (const token of tokens) {
      if (label.startsWith(token)) {
        score += 80;
      } else if (label.includes(token)) {
        score += 40;
      } else if (id.startsWith(token)) {
        score += 30;
      } else if (id.includes(token)) {
        score += 20;
      } else {
        score -= 15;
      }
    }
    return score > 0 ? score : -1;
  }

  private parseRelTypeFilter(raw: string | undefined): { include: Set<string>; exclude: Set<string> } {
    const include = new Set<string>();
    const exclude = new Set<string>();
    const tokens = String(raw ?? '')
      .split(',')
      .map((token) => token.trim().toLowerCase())
      .filter(Boolean);
    for (const token of tokens) {
      if (token.startsWith('!') || token.startsWith('-')) {
        const value = token.slice(1).trim();
        if (value) {
          exclude.add(value);
        }
      } else {
        include.add(token);
      }
    }
    return { include, exclude };
  }

  private readRelType(record: Record<string, unknown>): string {
    const direct = String(record.predicate ?? '').trim().toLowerCase();
    const rel = this.readNestedString(record, ['extensions', 'psellos', 'rel']);
    return rel || direct;
  }

  private matchesRelTypeFilter(
    record: Record<string, unknown>,
    relFilter: { include: Set<string>; exclude: Set<string> },
  ): boolean {
    const rel = this.readRelType(record);
    if (relFilter.exclude.size > 0 && relFilter.exclude.has(rel)) {
      return false;
    }
    if (relFilter.include.size > 0) {
      return relFilter.include.has(rel);
    }
    return true;
  }

  private matchesEntityRelationFilter(
    entity: Record<string, unknown>,
    assertions: Array<Record<string, unknown>>,
    relFilter: { include: Set<string>; exclude: Set<string> },
  ): boolean {
    if (relFilter.include.size === 0 && relFilter.exclude.size === 0) {
      return true;
    }
    const entityId = String(entity.id ?? '');
    const linked = assertions.filter((assertion) => {
      const subject = this.readId(assertion, 'subject');
      const object = this.readId(assertion, 'object');
      return subject === entityId || object === entityId;
    });
    if (relFilter.include.size > 0 && linked.length === 0) {
      return false;
    }
    if (relFilter.include.size > 0) {
      const hasIncluded = linked.some((assertion) => relFilter.include.has(this.readRelType(assertion)));
      if (!hasIncluded) {
        return false;
      }
    }
    if (relFilter.exclude.size > 0) {
      const hasExcluded = linked.some((assertion) => relFilter.exclude.has(this.readRelType(assertion)));
      if (hasExcluded) {
        return false;
      }
    }
    return true;
  }

  private readNestedString(record: Record<string, unknown>, pathParts: string[]): string {
    let current: unknown = record;
    for (const key of pathParts) {
      if (typeof current !== 'object' || current === null || !(key in current)) {
        return '';
      }
      current = (current as Record<string, unknown>)[key];
    }
    return typeof current === 'string' ? current.toLowerCase() : '';
  }

  private buildEntityBuckets(entities: Array<Record<string, unknown>>): Record<string, unknown> {
    const unknown = entities.filter((entity) => String(entity.label ?? '').trim() === '').length;
    const labelCounts = new Map<string, number>();
    for (const entity of entities) {
      const label = String(entity.label ?? '').trim().toLowerCase();
      if (!label) {
        continue;
      }
      labelCounts.set(label, (labelCounts.get(label) ?? 0) + 1);
    }
    let ambiguous = 0;
    labelCounts.forEach((count) => {
      if (count > 1) {
        ambiguous += count;
      }
    });
    return {
      unknown_label_count: unknown,
      ambiguous_label_count: ambiguous,
    };
  }
}
