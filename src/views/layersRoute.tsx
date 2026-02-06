import { Alert, Card, CardContent, CircularProgress, FormControl, Grid, InputLabel, MenuItem, Select, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { fetchLayerChangelog, fetchLayers } from '../api/client';
import { parseCoreFilters } from '../routing/coreFilters';

export function LayersRouteView() {
  const location = useLocation();
  const filters = useMemo(() => parseCoreFilters(window.location.search), [location.href]);
  const [compareLayer, setCompareLayer] = useState('canon');

  const layersQuery = useQuery({
    queryKey: ['layers', filters.layer],
    queryFn: () => fetchLayers({ layer: filters.layer }),
  });

  const changelogQuery = useQuery({
    queryKey: ['layer-changelog', filters.layer, compareLayer],
    queryFn: () => fetchLayerChangelog({ layer: filters.layer, base: compareLayer }),
    enabled: Boolean(filters.layer && compareLayer),
  });

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
          <Typography color="text.secondary">Current active layer: {filters.layer}</Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel id="layers-compare-label">Compare against base</InputLabel>
                <Select
                  labelId="layers-compare-label"
                  label="Compare against base"
                  value={compareLayer}
                  onChange={(event) => setCompareLayer(event.target.value)}
                >
                  {layersQuery.data.items.map((layerId) => (
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
            Layer changelog ({filters.layer} vs {compareLayer})
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
            <Stack spacing={1}>
              <Typography>Added assertions: {changelogQuery.data.item.added.length}</Typography>
              <Typography>Removed assertions: {changelogQuery.data.item.removed.length}</Typography>
              <Typography color="text.secondary">
                This reconciles legacy layer-compare functionality into the route shell.
              </Typography>
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}

