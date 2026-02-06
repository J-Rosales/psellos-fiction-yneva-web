import { DEFAULT_CORE_FILTERS, type CoreFilters } from '../state/filterPinStore';

const ALL_FILTER_KEYS = [
  'layer',
  'q',
  'exact',
  'rel_type',
  'date_from',
  'date_to',
  'entity_type',
  'has_geo',
] as const;

export type CoreFilterKey = (typeof ALL_FILTER_KEYS)[number];

const SUPPORTED_BY_PATH: ReadonlyArray<{
  match: RegExp;
  keys: readonly CoreFilterKey[];
}> = [
  { match: /^\/$/, keys: ['layer', 'q', 'exact'] },
  {
    match: /^\/entities$/,
    keys: ['layer', 'q', 'exact', 'rel_type', 'date_from', 'date_to', 'entity_type', 'has_geo'],
  },
  { match: /^\/entity\/[^/]+$/, keys: ['layer', 'exact', 'rel_type', 'date_from', 'date_to'] },
  {
    match: /^\/graph$/,
    keys: ['layer', 'q', 'exact', 'rel_type', 'date_from', 'date_to', 'entity_type'],
  },
  {
    match: /^\/map$/,
    keys: ['layer', 'q', 'exact', 'rel_type', 'date_from', 'date_to', 'entity_type', 'has_geo'],
  },
  { match: /^\/layers$/, keys: ['layer'] },
  { match: /^\/diagnostics$/, keys: ['layer'] },
  {
    match: /^\/search$/,
    keys: ['layer', 'q', 'exact', 'rel_type', 'date_from', 'date_to', 'entity_type', 'has_geo'],
  },
];

export function getSupportedKeysForPath(pathname: string): readonly CoreFilterKey[] {
  const matched = SUPPORTED_BY_PATH.find(({ match }) => match.test(pathname));
  return matched?.keys ?? ['layer'];
}

export function parseCoreFilters(search: string): CoreFilters {
  const params = new URLSearchParams(search);
  return {
    layer: params.get('layer')?.trim() || DEFAULT_CORE_FILTERS.layer,
    q: params.get('q')?.trim() || DEFAULT_CORE_FILTERS.q,
    exact: params.get('exact') === 'true' ? true : DEFAULT_CORE_FILTERS.exact,
    rel_type: params.get('rel_type')?.trim() || DEFAULT_CORE_FILTERS.rel_type,
    date_from: params.get('date_from')?.trim() || DEFAULT_CORE_FILTERS.date_from,
    date_to: params.get('date_to')?.trim() || DEFAULT_CORE_FILTERS.date_to,
    entity_type: params.get('entity_type')?.trim() || DEFAULT_CORE_FILTERS.entity_type,
    has_geo:
      params.get('has_geo') === 'yes' || params.get('has_geo') === 'no'
        ? (params.get('has_geo') as 'yes' | 'no')
        : DEFAULT_CORE_FILTERS.has_geo,
  };
}

export function toSearchParamsForPath(pathname: string, filters: CoreFilters): URLSearchParams {
  const params = new URLSearchParams();
  const supported = new Set(getSupportedKeysForPath(pathname));
  for (const key of ALL_FILTER_KEYS) {
    if (!supported.has(key)) {
      continue;
    }
    const value = filters[key];
    const isDefault = value === DEFAULT_CORE_FILTERS[key];
    if (!isDefault && value !== '') {
      params.set(key, String(value));
    }
  }
  if (!params.has('layer')) {
    params.set('layer', filters.layer || 'canon');
  }
  return params;
}

export function toSearchObject(params: URLSearchParams): Record<string, string> {
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

export function getIncompatiblePinnedKeys(pathname: string, filters: CoreFilters): CoreFilterKey[] {
  const supported = new Set(getSupportedKeysForPath(pathname));
  return ALL_FILTER_KEYS.filter(
    (key) => !supported.has(key) && filters[key] !== DEFAULT_CORE_FILTERS[key] && filters[key] !== '',
  );
}

export function hasActiveFilters(filters: CoreFilters): boolean {
  return ALL_FILTER_KEYS.some((key) => {
    const value = filters[key];
    return value !== DEFAULT_CORE_FILTERS[key] && value !== '';
  });
}

export function filterLabel(key: CoreFilterKey): string {
  const labels: Record<CoreFilterKey, string> = {
    layer: 'Layer',
    q: 'Search',
    exact: 'Exact',
    rel_type: 'Relation type',
    date_from: 'Date from',
    date_to: 'Date to',
    entity_type: 'Entity type',
    has_geo: 'Has geo',
  };
  return labels[key];
}
