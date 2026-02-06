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

