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
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [viewportHeight, setViewportHeight] = useState(620);

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
        style: 'https://demotiles.maplibre.org/style.json',
        center: [23.7, 37.97],
        zoom: 2,
      });
    }

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const markers = extractRenderableMarkers(query.data.features as Array<{
      geometry: { type?: string; coordinates?: [number, number] } | null;
      properties?: { place_key?: string; place_label?: string; assertion_count?: number };
    }>);
    markers.forEach((item) => {
      const marker = new maplibregl.Marker({ color: '#d97706' })
        .setLngLat([item.lng, item.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 16 }).setHTML(
            `<strong>${item.placeLabel}</strong><br/>Assertions: ${String(item.assertionCount)}`,
          ),
        )
        .addTo(mapRef.current as maplibregl.Map);
      const element = marker.getElement();
      element.addEventListener('click', () => {
        setExpanded(false);
        setSelectedPlaceKey(item.placeKey);
      });
      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
    };
  }, [query.data, scaleRadiusKm]);

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

  const selectedGroup = query.data.groups.find((group) => group.place_key === selectedPlaceKey) ?? null;
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
              <TextField
                size="small"
                label="Radius km"
                value={customRadiusKm}
                onChange={(event) => setCustomRadiusKm(event.target.value)}
                disabled={scalePreset !== 'custom'}
              />
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
