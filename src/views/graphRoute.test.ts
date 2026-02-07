import { describe, expect, it } from 'vitest';
import { inferClusters, mergeGraphData } from './graphRoute';

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

  it('merges graph data without duplicating nodes and edges', () => {
    const merged = mergeGraphData(
      {
        nodes: [{ id: 'p1', label: 'A' }],
        edges: [{ id: 'e1', subject: 'p1', object: 'p2', predicate: 'ally_of' }],
      },
      {
        nodes: [{ id: 'p1', label: 'A2' }, { id: 'p2', label: 'B' }],
        edges: [
          { id: 'e1', subject: 'p1', object: 'p2', predicate: 'ally_of' },
          { id: 'e2', subject: 'p2', object: 'p3', predicate: 'mentor_of' },
        ],
      },
    );
    expect(merged.nodes).toHaveLength(2);
    expect(merged.edges).toHaveLength(2);
  });
});

