import { describe, expect, it } from 'vitest';
import { inferClusters } from './graphRoute';

describe('graph cluster inference', () => {
  it('infers dynasty clusters from relation keywords', () => {
    const clusters = inferClusters(
      [{ id: 'p1' }, { id: 'p2' }],
      [{ subject: 'p1', object: 'p2', predicate: 'parent_of' }],
      'dynasty',
    );
    expect(clusters.get('p1')?.length).toBe(1);
    expect(clusters.get('p1')?.[0].value).toBe('parent_of');
  });

  it('does not assign unrelated edges to workplace mode', () => {
    const clusters = inferClusters(
      [{ id: 'p1' }, { id: 'p2' }],
      [{ subject: 'p1', object: 'p2', predicate: 'spouse_of' }],
      'workplace',
    );
    expect(clusters.get('p1')).toEqual([]);
  });
});

