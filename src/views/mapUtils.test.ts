import { describe, expect, it } from 'vitest';
import { buildPointFeatureCollection, extractRenderableMarkers } from './mapUtils';

describe('map marker extraction', () => {
  it('returns only point features with coordinates', () => {
    const markers = extractRenderableMarkers([
      {
        geometry: { type: 'Point', coordinates: [10, 20] },
        properties: { place_key: 'a', place_label: 'Alpha', assertion_count: 2 },
      },
      {
        geometry: null,
        properties: { place_key: 'b', place_label: 'Beta', assertion_count: 1 },
      },
    ]);
    expect(markers).toEqual([{ lng: 10, lat: 20, placeKey: 'a', placeLabel: 'Alpha', assertionCount: 2 }]);
  });
});

describe('map feature collection build', () => {
  it('builds point feature collection from renderable markers', () => {
    const collection = buildPointFeatureCollection([
      { lng: 1, lat: 2, placeKey: 'p.a', placeLabel: 'Alpha', assertionCount: 5 },
    ]);
    expect(collection.type).toBe('FeatureCollection');
    expect(collection.features).toHaveLength(1);
    expect(collection.features[0].geometry.coordinates).toEqual([1, 2]);
    expect(collection.features[0].properties.place_key).toBe('p.a');
  });
});

