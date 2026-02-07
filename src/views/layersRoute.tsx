import { Alert, Box, Card, CardContent, CircularProgress, FormControl, Grid, InputLabel, MenuItem, Select, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { fetchLayerChangelog, fetchLayers } from '../api/client';
import { parseCoreFilters } from '../routing/coreFilters';

export function LayersRouteView() {
  const location = useLocation();
  const filters = useMemo(() => parseCoreFilters(window.location.search), [location.href]);
  const defaultLayer = 'narrative.tentative.consensus';
  const [leftLayer, setLeftLayer] = useState(defaultLayer);
  const [rightLayer, setRightLayer] = useState(defaultLayer);

  const layersQuery = useQuery({
    queryKey: ['layers', filters.layer],
    queryFn: () => fetchLayers({ layer: filters.layer }),
  });
  const localLayersQuery = useQuery({
    queryKey: ['layers-local-json'],
    queryFn: async () => {
      const response = await fetch('/data/layers.json');
      if (!response.ok) return [] as string[];
      const payload = (await response.json()) as unknown;
      return Array.isArray(payload) ? payload.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];
    },
    staleTime: 60_000,
  });
  const localLayerIndexQuery = useQuery({
    queryKey: ['assertions-by-layer-local-index'],
    queryFn: async () => {
      const response = await fetch('/data/assertions_by_layer.json');
      if (!response.ok) return {} as Record<string, string[]>;
      const payload = (await response.json()) as unknown;
      if (!payload || typeof payload !== 'object') return {} as Record<string, string[]>;
      return payload as Record<string, string[]>;
    },
    staleTime: 60_000,
  });
  const layerOptions = useMemo(() => {
    const fromApi = layersQuery.data?.items ?? [];
    const fromLocal = localLayersQuery.data ?? [];
    const merged = Array.from(new Set([...fromApi, ...fromLocal, filters.layer, leftLayer, rightLayer, defaultLayer].filter(Boolean)));
    return merged.sort((a, b) => a.localeCompare(b));
  }, [layersQuery.data, localLayersQuery.data, filters.layer, leftLayer, rightLayer]);

  useEffect(() => {
    if (!layerOptions.includes(leftLayer) && layerOptions.length > 0) {
      setLeftLayer(layerOptions[0]);
    }
    if (!layerOptions.includes(rightLayer) && layerOptions.length > 0) {
      setRightLayer(layerOptions[0]);
    }
  }, [leftLayer, rightLayer, layerOptions]);

  const changelogQuery = useQuery({
    queryKey: ['layer-changelog', leftLayer, rightLayer],
    queryFn: () => fetchLayerChangelog({ layer: leftLayer, base: rightLayer }),
    enabled: Boolean(leftLayer && rightLayer),
  });
  const localDiff = useMemo(() => {
    const index = localLayerIndexQuery.data ?? {};
    const left = new Set(index[leftLayer] ?? []);
    const right = new Set(index[rightLayer] ?? []);
    const added = Array.from(left).filter((id) => !right.has(id));
    const removed = Array.from(right).filter((id) => !left.has(id));
    return { added, removed };
  }, [localLayerIndexQuery.data, leftLayer, rightLayer]);
  const apiItem = changelogQuery.data?.item;
  const apiLooksEmptyButLocalHasData =
    Boolean(apiItem) &&
    (apiItem?.added.length ?? 0) === 0 &&
    (apiItem?.removed.length ?? 0) === 0 &&
    (localDiff.added.length > 0 || localDiff.removed.length > 0);

  if (layersQuery.isLoading) {
    return (
      <Card>
        <CardContent>
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={20} />
            <Typography>Loading layer controls...</Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }
  if (layersQuery.isError) {
    return <Alert severity="error">Failed to load layers: {layersQuery.error.message}</Alert>;
  }
  if (!layersQuery.data) {
    return <Alert severity="error">Layers query returned no payload.</Alert>;
  }

  return (
    <Stack spacing={2}>
      {layersQuery.data.meta.warnings?.length ? <Alert severity="warning">{layersQuery.data.meta.warnings.join(' ')}</Alert> : null}
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Layers
          </Typography>
          <Typography color="text.secondary">Compare any two layers directly.</Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel id="layers-left-label">Layer A</InputLabel>
                <Select
                  labelId="layers-left-label"
                  label="Layer A"
                  value={leftLayer}
                  onChange={(event) => setLeftLayer(event.target.value)}
                >
                  {layerOptions.map((layerId) => (
                    <MenuItem key={layerId} value={layerId}>
                      {layerId}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel id="layers-right-label">Layer B (base)</InputLabel>
                <Select
                  labelId="layers-right-label"
                  label="Layer B (base)"
                  value={rightLayer}
                  onChange={(event) => setRightLayer(event.target.value)}
                >
                  {layerOptions.map((layerId) => (
                    <MenuItem key={layerId} value={layerId}>
                      {layerId}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Layer changelog ({leftLayer} vs {rightLayer})
          </Typography>
          {changelogQuery.isLoading ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={18} />
              <Typography>Loading changelog...</Typography>
            </Stack>
          ) : changelogQuery.isError ? (
            <Alert severity="error">Failed to load changelog: {changelogQuery.error.message}</Alert>
          ) : !changelogQuery.data ? (
            <Typography color="text.secondary">No changelog data.</Typography>
          ) : (
            <Stack spacing={1} sx={{ minHeight: { xs: 220, md: 'calc(100vh - 420px)' } }}>
              {(() => {
                const added = apiLooksEmptyButLocalHasData ? localDiff.added : apiItem?.added ?? [];
                const removed = apiLooksEmptyButLocalHasData ? localDiff.removed : apiItem?.removed ?? [];
                return (
                  <>
              {apiLooksEmptyButLocalHasData ? (
                <Alert severity="warning">
                  API diff returned empty, but local compiled index shows differences. Displaying local fallback diff.
                </Alert>
              ) : null}
              <Typography>
                Added assertions:{' '}
                {added.length}
              </Typography>
              <Typography>
                Removed assertions:{' '}
                {removed.length}
              </Typography>
                    <Grid container spacing={1.25} sx={{ mt: 0.25 }}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Box
                          sx={{
                            border: '1px solid',
                            borderColor: 'success.light',
                            bgcolor: 'success.lighter',
                            borderRadius: 1,
                            p: 1,
                            maxHeight: { xs: 240, md: 360 },
                            overflow: 'auto',
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ color: 'success.dark', mb: 0.75 }}>
                            + Added
                          </Typography>
                          {added.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              none
                            </Typography>
                          ) : (
                            <Stack spacing={0.5}>
                              {added.map((id) => (
                                <Typography
                                  key={`added-${id}`}
                                  variant="body2"
                                  sx={{
                                    fontFamily: 'monospace',
                                    px: 0.75,
                                    py: 0.35,
                                    borderRadius: 0.75,
                                    bgcolor: 'rgba(22, 163, 74, 0.12)',
                                    color: 'success.dark',
                                    border: '1px solid',
                                    borderColor: 'rgba(22, 163, 74, 0.25)',
                                  }}
                                >
                                  + {id}
                                </Typography>
                              ))}
                            </Stack>
                          )}
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Box
                          sx={{
                            border: '1px solid',
                            borderColor: 'error.light',
                            bgcolor: 'error.lighter',
                            borderRadius: 1,
                            p: 1,
                            maxHeight: { xs: 240, md: 360 },
                            overflow: 'auto',
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ color: 'error.dark', mb: 0.75 }}>
                            - Removed
                          </Typography>
                          {removed.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              none
                            </Typography>
                          ) : (
                            <Stack spacing={0.5}>
                              {removed.map((id) => (
                                <Typography
                                  key={`removed-${id}`}
                                  variant="body2"
                                  sx={{
                                    fontFamily: 'monospace',
                                    px: 0.75,
                                    py: 0.35,
                                    borderRadius: 0.75,
                                    bgcolor: 'rgba(220, 38, 38, 0.12)',
                                    color: 'error.dark',
                                    border: '1px solid',
                                    borderColor: 'rgba(220, 38, 38, 0.25)',
                                  }}
                                >
                                  - {id}
                                </Typography>
                              ))}
                            </Stack>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </>
                );
              })()}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}

