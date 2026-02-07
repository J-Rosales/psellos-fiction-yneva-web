import { describe, expect, it } from 'vitest';
import { buildEntitiesPaginationParams } from './entitiesPagination';

describe('entities pagination params', () => {
  it('updates page while preserving existing query params', () => {
    const params = buildEntitiesPaginationParams({
      currentSearch: '?layer=canon&q=alexios&page=0&page_size=25',
      currentModel: { page: 0, pageSize: 25 },
      nextModel: { page: 1, pageSize: 25 },
    });

    expect(params.get('layer')).toBe('canon');
    expect(params.get('q')).toBe('alexios');
    expect(params.get('page')).toBe('1');
    expect(params.get('page_size')).toBe('25');
  });

  it('resets page to 0 when page size changes', () => {
    const params = buildEntitiesPaginationParams({
      currentSearch: '?layer=canon&page=3&page_size=25',
      currentModel: { page: 3, pageSize: 25 },
      nextModel: { page: 3, pageSize: 50 },
    });

    expect(params.get('page')).toBe('0');
    expect(params.get('page_size')).toBe('50');
  });
});
