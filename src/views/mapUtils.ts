export interface MapFeatureRecord {
  geometry: { type?: string; coordinates?: [number, number] } | null;
  properties?: { place_key?: string; place_label?: string; assertion_count?: number };
}

export function extractRenderableMarkers(features: MapFeatureRecord[]): Array<{
  lng: number;
  lat: number;
  placeKey: string;
  placeLabel: string;
  assertionCount: number;
}> {
  return features
    .filter((feature) => Boolean(feature.geometry && feature.geometry.type === 'Point' && feature.geometry.coordinates))
    .map((feature) => ({
      lng: Number(feature.geometry?.coordinates?.[0] ?? 0),
      lat: Number(feature.geometry?.coordinates?.[1] ?? 0),
      placeKey: String(feature.properties?.place_key ?? ''),
      placeLabel: String(feature.properties?.place_label ?? 'Unknown place'),
      assertionCount: Number(feature.properties?.assertion_count ?? 0),
    }));
}

export function buildPointFeatureCollection(
  markers: Array<{ lng: number; lat: number; placeKey: string; placeLabel: string; assertionCount: number }>,
): {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: { type: 'Point'; coordinates: [number, number] };
    properties: { place_key: string; place_label: string; assertion_count: number };
  }>;
} {
  return {
    type: 'FeatureCollection',
    features: markers.map((item) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [item.lng, item.lat],
      },
      properties: {
        place_key: item.placeKey,
        place_label: item.placeLabel,
        assertion_count: item.assertionCount,
      },
    })),
  };
}

