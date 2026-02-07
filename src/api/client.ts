import type { CoreFilters } from '../state/filterPinStore';

export interface ApiMeta {
  layer: string;
  result_count: number;
  total_count?: number;
  warnings?: string[];
  buckets?: Record<string, unknown>;
}

export interface EntityRecord {
  id: string;
  label?: string;
  entity_type?: string;
  [key: string]: unknown;
}

export interface AssertionRecord {
  id?: string;
  subject?: string;
  object?: string;
  predicate?: string;
  [key: string]: unknown;
}

interface EntitiesResponse {
  meta: ApiMeta;
  items: EntityRecord[];
}

interface EntityByIdResponse {
  meta: ApiMeta;
  item: EntityRecord | null;
}

interface AssertionsResponse {
  meta: ApiMeta;
  items: AssertionRecord[];
}

interface GraphResponse {
  meta: ApiMeta;
  nodes: Array<Record<string, unknown>>;
  edges: AssertionRecord[];
}

interface MapResponse {
  meta: ApiMeta;
  type: 'FeatureCollection';
  features: Array<Record<string, unknown>>;
  groups: Array<{
    place_key: string;
    place_label: string;
    coordinates: [number, number] | null;
    assertion_ids: string[];
    entity_ids: string[];
  }>;
}

interface LayersResponse {
  meta: ApiMeta;
  items: string[];
}

interface LayerChangelogResponse {
  meta: ApiMeta;
  item: {
    layer: string;
    base: string;
    added: string[];
    removed: string[];
  };
}

interface LayerConsistencyResponse {
  meta: ApiMeta;
  item: {
    layer: string;
    entities_count: number;
    assertions_count: number;
    graph_edges_count: number;
    map_features_count: number;
    checks: Record<string, boolean>;
  };
}

interface MetricsResponse {
  meta: ApiMeta;
  item: {
    total_requests: number;
    routes: Record<string, { count: number; avg_ms: number; max_ms: number }>;
  };
}

interface DiagnosticsAggregateResponse {
  meta: ApiMeta;
  item: {
    layer: string;
    assertion_quality: {
      entity_total: number;
      unknown_label_count: number;
      ambiguous_label_count: number;
      unknown_entity_type_count: number;
      unknown_label_sample_ids: string[];
      unknown_entity_type_sample_ids: string[];
      sample_limited: boolean;
    };
    geo_coverage: {
      place_groups: number;
      unknown_geo_assertion_count: number;
      ambiguous_place_group_count: number;
    };
  };
}

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '' || value === 'any') {
      return;
    }
    query.set(key, String(value));
  });
  return query.toString();
}

async function requestJson<T>(path: string, params: Record<string, string | number | boolean | undefined>): Promise<T> {
  const query = buildQuery(params);
  const url = query ? `${path}?${query}` : path;
  const response = await fetch(url);
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body?.message ?? `Request failed (${response.status})`);
  }
  return body as T;
}

export async function fetchEntities(input: {
  filters: CoreFilters;
  page: number;
  pageSize: number;
}): Promise<EntitiesResponse> {
  return requestJson<EntitiesResponse>('/api/entities', {
    layer: input.filters.layer,
    q: input.filters.q,
    exact: input.filters.exact,
    rel_type: input.filters.rel_type,
    entity_type: input.filters.entity_type,
    has_geo: input.filters.has_geo,
    date_from: input.filters.date_from,
    date_to: input.filters.date_to,
    page: input.page,
    page_size: input.pageSize,
  });
}

export async function fetchEntityById(input: {
  entityId: string;
  filters: CoreFilters;
}): Promise<EntityByIdResponse> {
  return requestJson<EntityByIdResponse>(`/api/entities/${encodeURIComponent(input.entityId)}`, {
    layer: input.filters.layer,
  });
}

export async function fetchAssertionsForEntity(input: {
  entityId: string;
  filters: CoreFilters;
}): Promise<AssertionsResponse> {
  return requestJson<AssertionsResponse>('/api/assertions', {
    layer: input.filters.layer,
    entity_id: input.entityId,
    rel_type: input.filters.rel_type,
  });
}

export async function fetchGraphNeighborhood(input: {
  entityId?: string;
  depth?: number;
  filters: CoreFilters;
}): Promise<GraphResponse> {
  return requestJson<GraphResponse>('/api/graph/neighborhood', {
    layer: input.filters.layer,
    rel_type: input.filters.rel_type,
    entity_id: input.entityId,
    depth: input.depth ?? 2,
  });
}

export async function fetchMapFeatures(input: { filters: CoreFilters }): Promise<MapResponse> {
  return requestJson<MapResponse>('/api/map/features', {
    layer: input.filters.layer,
    rel_type: input.filters.rel_type,
    q: input.filters.q,
  });
}

export async function fetchLayers(input: { layer: string }): Promise<LayersResponse> {
  return requestJson<LayersResponse>('/api/layers', { layer: input.layer });
}

export async function fetchLayerChangelog(input: {
  layer: string;
  base: string;
}): Promise<LayerChangelogResponse> {
  return requestJson<LayerChangelogResponse>(`/api/layers/${encodeURIComponent(input.layer)}/changelog`, {
    base: input.base,
    layer: input.layer,
  });
}

export async function fetchLayerConsistency(input: {
  layer: string;
}): Promise<LayerConsistencyResponse> {
  return requestJson<LayerConsistencyResponse>('/api/diagnostics/layer-consistency', {
    layer: input.layer,
  });
}

export async function fetchApiMetrics(): Promise<MetricsResponse> {
  return requestJson<MetricsResponse>('/api/diagnostics/metrics', {});
}

export async function fetchDiagnosticsAggregate(input: {
  layer: string;
}): Promise<DiagnosticsAggregateResponse> {
  return requestJson<DiagnosticsAggregateResponse>('/api/diagnostics/aggregate', {
    layer: input.layer,
  });
}

