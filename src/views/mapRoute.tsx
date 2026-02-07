import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from '@tanstack/react-router';
import maplibregl from 'maplibre-gl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchMapFeatures } from '../api/client';
import { parseCoreFilters } from '../routing/coreFilters';
import { extractRenderableMarkers } from './mapUtils';
import { computeViewportHeightPx } from './viewportLayout';

type ScalePreset = 'earth' | 'yneva' | 'custom';
type DensityMode = 'points' | 'clusters' | 'heatmap';

const SOURCE_ID = 'psellos-map-points';
const POINT_LAYER_ID = 'psellos-map-points-layer';
const CLUSTER_LAYER_ID = 'psellos-map-clusters-layer';
const CLUSTER_COUNT_LAYER_ID = 'psellos-map-clusters-count-layer';
const HEATMAP_LAYER_ID = 'psellos-map-heatmap-layer';

export function MapRouteView() {
  const location = useLocation();
  const filters = useMemo(() => parseCoreFilters(window.location.search), [location.href]);
  const [selectedPlaceKey, setSelectedPlaceKey] = useState<string>('');
  const [expanded, setExpanded] = useState(false);
  const [scalePreset, setScalePreset] = useState<ScalePreset>('earth');
  const [customRadiusKm, setCustomRadiusKm] = useState('6371');
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [viewportHeight, setViewportHeight] = useState(620);
  const [cameraInfo, setCameraInfo] = useState({ zoom: 2, center: [23.7, 37.97] as [number, number] });
  const [densityMode, setDensityMode] = useState<DensityMode>('clusters');

  const query = useQuery({
    queryKey: ['map-features', filters.layer, filters.rel_type, filters.q],
    queryFn: () => fetchMapFeatures({ filters }),
  });

  const scaleRadiusKm = useMemo(() => {
    if (scalePreset === 'earth') return 6371;
    if (scalePreset === 'yneva') return 7020;
    const parsed = Number(customRadiusKm);
    return Number.isFinite(parsed) && parsed > 100 ? parsed : 6371;
  }, [scalePreset, customRadiusKm]);

  useEffect(() => {
    if (!mapContainerRef.current || !query.data) {
      return;
    }
    if (!mapRef.current) {
      mapRef.current = new maplibregl.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          sources: {},
          layers: [
            {
              id: 'psellos-map-background',
              type: 'background',
              paint: {
                'background-color': '#dbe3f2',
              },
            },
          ],
        },
        center: [23.7, 37.97],
        zoom: 2,
      });
      mapRef.current.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true }), 'top-right');
      mapRef.current.on('load', () => {
        const map = mapRef.current;
        if (!map || map.getSource(SOURCE_ID)) return;
        map.addSource(SOURCE_ID, {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
          cluster: true,
          clusterRadius: 42,
          clusterMaxZoom: 11,
        });
        map.addLayer({
          id: CLUSTER_LAYER_ID,
          type: 'circle',
          source: SOURCE_ID,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#60a5fa',
              8,
              '#3b82f6',
              20,
              '#1d4ed8',
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              12,
              8,
              16,
              20,
              22,
            ],
            'circle-opacity': 0.9,
          },
        });
        map.addLayer({
          id: CLUSTER_COUNT_LAYER_ID,
          type: 'symbol',
          source: SOURCE_ID,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': ['get', 'point_count_abbreviated'],
            'text-size': 11,
          },
          paint: {
            'text-color': '#ffffff',
          },
        });
        map.addLayer({
          id: POINT_LAYER_ID,
          type: 'circle',
          source: SOURCE_ID,
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': '#d97706',
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 4, 8, 7, 12, 9],
            'circle-stroke-color': '#1f2937',
            'circle-stroke-width': 1,
          },
        });
        map.addLayer({
          id: HEATMAP_LAYER_ID,
          type: 'heatmap',
          source: SOURCE_ID,
          paint: {
            'heatmap-weight': ['interpolate', ['linear'], ['coalesce', ['get', 'assertion_count'], 1], 1, 0.2, 15, 1],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 2.1],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 3, 9, 20],
            'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 4, 0.75, 11, 0.1],
          },
          layout: { visibility: 'none' },
        });
        map.on('click', POINT_LAYER_ID, (event) => {
          const first = event.features?.[0];
          const placeKey = first?.properties?.place_key;
          if (typeof placeKey === 'string') {
            setExpanded(false);
            setSelectedPlaceKey(placeKey);
          }
        });
        map.on('click', CLUSTER_LAYER_ID, async (event) => {
          const feature = event.features?.[0];
          if (!feature || !map.getSource(SOURCE_ID)) return;
          const clusterId = feature.properties?.cluster_id;
          if (typeof clusterId !== 'number') return;
          const zoom = await (map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource).getClusterExpansionZoom(clusterId);
          const lngLat = feature.geometry && feature.geometry.type === 'Point' ? feature.geometry.coordinates : null;
          if (!lngLat || !Array.isArray(lngLat)) return;
          map.easeTo({ center: [lngLat[0], lngLat[1]], zoom: zoom + 0.2, duration: 320 });
        });
        [POINT_LAYER_ID, CLUSTER_LAYER_ID].forEach((layerId) => {
          map.on('mouseenter', layerId, () => {
            map.getCanvas().style.cursor = 'pointer';
          });
          map.on('mouseleave', layerId, () => {
            map.getCanvas().style.cursor = '';
          });
        });
      });
      mapRef.current.on('moveend', () => {
        if (!mapRef.current) return;
        const center = mapRef.current.getCenter();
        setCameraInfo({
          zoom: Number(mapRef.current.getZoom().toFixed(2)),
          center: [Number(center.lng.toFixed(4)), Number(center.lat.toFixed(4))],
        });
      });
    }

    const markers = extractRenderableMarkers(query.data.features as Array<{
      geometry: { type?: string; coordinates?: [number, number] } | null;
      properties?: { place_key?: string; place_label?: string; assertion_count?: number };
    }>);
    const sourcePayload = {
      type: 'FeatureCollection' as const,
      features: markers.map((item) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [item.lng, item.lat],
        },
        properties: {
          place_key: item.placeKey,
          place_label: item.placeLabel,
          assertion_count: item.assertionCount,
        },
      })),
    };
    const map = mapRef.current;
    const pushSourceData = () => {
      if (!map?.getSource(SOURCE_ID)) {
        window.setTimeout(pushSourceData, 40);
        return;
      }
      (map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource).setData(sourcePayload);
    };
    pushSourceData();
    if (markers.length > 0 && mapRef.current) {
      const bounds = new maplibregl.LngLatBounds();
      markers.forEach((item) => bounds.extend([item.lng, item.lat]));
      mapRef.current.fitBounds(bounds, { padding: 64, maxZoom: 7, duration: 500 });
    }

  }, [query.data, scaleRadiusKm]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const pointsVisible = densityMode === 'points' ? 'visible' : 'none';
    const clustersVisible = densityMode === 'clusters' ? 'visible' : 'none';
    const heatmapVisible = densityMode === 'heatmap' ? 'visible' : 'none';
    if (map.getLayer(POINT_LAYER_ID)) {
      map.setLayoutProperty(POINT_LAYER_ID, 'visibility', pointsVisible);
    }
    if (map.getLayer(CLUSTER_LAYER_ID)) {
      map.setLayoutProperty(CLUSTER_LAYER_ID, 'visibility', clustersVisible);
    }
    if (map.getLayer(CLUSTER_COUNT_LAYER_ID)) {
      map.setLayoutProperty(CLUSTER_COUNT_LAYER_ID, 'visibility', clustersVisible);
    }
    if (map.getLayer(HEATMAP_LAYER_ID)) {
      map.setLayoutProperty(HEATMAP_LAYER_ID, 'visibility', heatmapVisible);
    }
  }, [densityMode, query.data]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const syncViewportHeight = () => {
      const topOffset = viewportRef.current?.getBoundingClientRect().top ?? 220;
      setViewportHeight(computeViewportHeightPx(window.innerHeight, topOffset, 360));
      mapRef.current?.resize();
    };
    syncViewportHeight();
    window.addEventListener('resize', syncViewportHeight);
    return () => window.removeEventListener('resize', syncViewportHeight);
  }, []);

  const selectedGroup = query.data?.groups.find((group) => group.place_key === selectedPlaceKey) ?? null;

  useEffect(() => {
    if (!selectedGroup || !selectedGroup.coordinates || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [selectedGroup.coordinates[0], selectedGroup.coordinates[1]],
      zoom: Math.max(5, mapRef.current.getZoom()),
      duration: 500,
      essential: true,
    });
  }, [selectedGroup]);

  if (query.isLoading) {
    return (
      <Card>
        <CardContent>
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={20} />
            <Typography>Loading map features...</Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }
  if (query.isError) {
    return <Alert severity="error">Map query failed: {query.error.message}</Alert>;
  }
  if (!query.data) {
    return <Alert severity="error">Map query returned no payload.</Alert>;
  }

  const unknownGeoCount = Number(query.data.meta.buckets?.unknown_geo_assertion_count ?? 0);
  const ambiguousPlaceCount = Number(query.data.meta.buckets?.ambiguous_place_group_count ?? 0);

  return (
    <Stack spacing={1.5}>
      {query.data.meta.warnings?.length ? <Alert severity="warning">{query.data.meta.warnings.join(' ')}</Alert> : null}
      <Alert severity="info">
        Unknown geo assertions: {unknownGeoCount} | Ambiguous place groups: {ambiguousPlaceCount}
      </Alert>

      <Box ref={viewportRef} sx={{ position: 'relative', height: viewportHeight, border: '1px solid #e5e7eb', borderRadius: 1, overflow: 'hidden' }}>
        <Box ref={mapContainerRef} sx={{ width: '100%', height: '100%' }} />

        <Card sx={{ position: 'absolute', top: 12, left: 12, zIndex: 5, width: { xs: 'calc(100% - 24px)', md: 540 }, maxHeight: { xs: 220, md: 280 }, overflow: 'auto' }}>
          <CardContent sx={{ py: 1.25 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="h6">Map</Typography>
              <Chip label={`Places ${query.data.groups.length}`} />
              <Chip label={`${Math.round(scaleRadiusKm)} km`} />
              <Chip label={`Zoom ${cameraInfo.zoom.toFixed(2)}`} />
              <FormControl size="small" sx={{ minWidth: 170 }}>
                <InputLabel id="scale-preset-label">Scale preset</InputLabel>
                <Select
                  labelId="scale-preset-label"
                  label="Scale preset"
                  value={scalePreset}
                  onChange={(event) => setScalePreset(event.target.value as ScalePreset)}
                >
                  <MenuItem value="earth">Earth</MenuItem>
                  <MenuItem value="yneva">Yneva-like</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="density-mode-label">Density mode</InputLabel>
                <Select
                  labelId="density-mode-label"
                  label="Density mode"
                  value={densityMode}
                  onChange={(event) => setDensityMode(event.target.value as DensityMode)}
                >
                  <MenuItem value="clusters">Clusters</MenuItem>
                  <MenuItem value="points">Points</MenuItem>
                  <MenuItem value="heatmap">Heatmap</MenuItem>
                </Select>
              </FormControl>
              <TextField
                size="small"
                label="Radius km"
                value={customRadiusKm}
                onChange={(event) => setCustomRadiusKm(event.target.value)}
                disabled={scalePreset !== 'custom'}
              />
              <Tooltip title="Fit map to currently loaded places">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    if (!mapRef.current) return;
                    const markers = extractRenderableMarkers(query.data.features as Array<{
                      geometry: { type?: string; coordinates?: [number, number] } | null;
                      properties?: { place_key?: string; place_label?: string; assertion_count?: number };
                    }>);
                    if (markers.length === 0) {
                      mapRef.current.flyTo({ center: [23.7, 37.97], zoom: 2, duration: 400 });
                      return;
                    }
                    const bounds = new maplibregl.LngLatBounds();
                    markers.forEach((item) => bounds.extend([item.lng, item.lat]));
                    mapRef.current.fitBounds(bounds, { padding: 64, maxZoom: 7, duration: 500 });
                  }}
                >
                  Fit results
                </Button>
              </Tooltip>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  const map = mapRef.current;
                  if (!map) return;
                  map.zoomTo(map.getZoom() + 0.5, { duration: 220 });
                }}
              >
                Zoom +
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  const map = mapRef.current;
                  if (!map) return;
                  map.zoomTo(map.getZoom() - 0.5, { duration: 220 });
                }}
              >
                Zoom -
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  const map = mapRef.current;
                  if (!map) return;
                  map.easeTo({ bearing: 0, pitch: 0, duration: 260 });
                }}
              >
                Reset view
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ position: 'absolute', right: 12, top: { xs: 240, md: 12 }, zIndex: 5, width: { xs: 'calc(100% - 24px)', md: 380 }, maxHeight: { xs: 320, md: viewportHeight - 24 }, overflow: 'auto' }}>
          <CardContent sx={{ py: 1.25 }}>
            <Typography variant="h6" gutterBottom>
              Place-first results
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Select a place marker or list item.
            </Typography>
            <List dense sx={{ maxHeight: 220, overflow: 'auto', border: '1px solid #e5e7eb', borderRadius: 1, mb: 2 }}>
              {query.data.groups.map((group) => (
                <ListItemButton
                  key={group.place_key}
                  selected={group.place_key === selectedPlaceKey}
                  onClick={() => {
                    setExpanded(false);
                    setSelectedPlaceKey(group.place_key);
                  }}
                >
                  <ListItemText
                    primary={group.place_label}
                    secondary={`Entities: ${group.entity_ids.length} | Assertions: ${group.assertion_ids.length}`}
                  />
                </ListItemButton>
              ))}
            </List>
            {!selectedGroup ? (
              <Typography color="text.secondary">No place selected.</Typography>
            ) : (
              <Stack spacing={1}>
                <Typography variant="subtitle1">{selectedGroup.place_label}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Place key: {selectedGroup.place_key}
                </Typography>
                {!expanded ? (
                  <Typography variant="body2">Compact summary mode is active.</Typography>
                ) : (
                  <Typography variant="body2">
                    Full entity ids: {selectedGroup.entity_ids.join(', ') || 'none'} | Assertion ids:{' '}
                    {selectedGroup.assertion_ids.join(', ') || 'none'}
                  </Typography>
                )}
                <Button size="small" onClick={() => setExpanded((value) => !value)}>
                  {expanded ? 'Collapse' : 'Expand details'}
                </Button>
                <Typography variant="subtitle2">Entities</Typography>
                {selectedGroup.entity_ids.length === 0 ? (
                  <Typography color="text.secondary">No linked entities for this place group.</Typography>
                ) : (
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    {selectedGroup.entity_ids.map((entityId) => (
                      <Chip key={entityId} label={entityId} variant="outlined" />
                    ))}
                  </Stack>
                )}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Box>
    </Stack>
  );
}
