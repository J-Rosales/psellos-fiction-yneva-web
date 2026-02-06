import { describe, expect, it } from 'vitest';
import {
  getIncompatiblePinnedKeys,
  getSupportedKeysForPath,
  parseCoreFilters,
  toSearchParamsForPath,
} from './coreFilters';
import { DEFAULT_CORE_FILTERS } from '../state/filterPinStore';

describe('coreFilters', () => {
  it('parses defaults when query is empty', () => {
    const parsed = parseCoreFilters('');
    expect(parsed).toEqual(DEFAULT_CORE_FILTERS);
  });

  it('parses known params and normalizes has_geo', () => {
    const parsed = parseCoreFilters('?layer=narrative&q=alpha&has_geo=yes');
    expect(parsed.layer).toBe('narrative');
    expect(parsed.q).toBe('alpha');
    expect(parsed.has_geo).toBe('yes');
  });

  it('serializes only supported keys for route and keeps layer default', () => {
    const params = toSearchParamsForPath('/layers', {
      ...DEFAULT_CORE_FILTERS,
      q: 'ignored',
      layer: 'canon',
    });
    expect(params.get('q')).toBeNull();
    expect(params.get('layer')).toBe('canon');
  });

  it('reports incompatible pinned keys for a narrow route', () => {
    const incompatible = getIncompatiblePinnedKeys('/layers', {
      ...DEFAULT_CORE_FILTERS,
      q: 'active',
      rel_type: 'friend',
      layer: 'canon',
    });
    expect(incompatible).toContain('q');
    expect(incompatible).toContain('rel_type');
  });

  it('defines route-specific key support', () => {
    expect(getSupportedKeysForPath('/graph')).toContain('rel_type');
    expect(getSupportedKeysForPath('/graph')).not.toContain('has_geo');
    expect(getSupportedKeysForPath('/map')).toContain('has_geo');
  });
});
