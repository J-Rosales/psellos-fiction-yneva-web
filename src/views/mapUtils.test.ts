import { describe, expect, it } from 'vitest';
import { extractRenderableMarkers } from './mapUtils';

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

