import { Alert, Card, CardContent, CircularProgress, Grid, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from '@tanstack/react-router';
import { useMemo } from 'react';
import { fetchApiMetrics, fetchLayerConsistency } from '../api/client';
import { parseCoreFilters } from '../routing/coreFilters';

export function DiagnosticsRouteView() {
  const location = useLocation();
  const filters = useMemo(() => parseCoreFilters(window.location.search), [location.href]);

  const consistencyQuery = useQuery({
    queryKey: ['diagnostics-layer-consistency', filters.layer],
    queryFn: () => fetchLayerConsistency({ layer: filters.layer }),
  });
  const metricsQuery = useQuery({
    queryKey: ['diagnostics-metrics'],
    queryFn: () => fetchApiMetrics(),
  });

  if (consistencyQuery.isLoading || metricsQuery.isLoading) {
    return (
      <Card>
        <CardContent>
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={20} />
            <Typography>Loading diagnostics...</Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (consistencyQuery.isError) {
    return <Alert severity="error">Failed to load layer diagnostics: {consistencyQuery.error.message}</Alert>;
  }
  if (metricsQuery.isError) {
    return <Alert severity="error">Failed to load API metrics: {metricsQuery.error.message}</Alert>;
  }
  if (!consistencyQuery.data || !metricsQuery.data) {
    return <Alert severity="error">Diagnostics payload missing.</Alert>;
  }

  return (
    <Stack spacing={2}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Diagnostics
          </Typography>
          <Typography color="text.secondary">
            Narrative-layer consistency and API observability checks.
          </Typography>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Layer consistency ({consistencyQuery.data.item.layer})
              </Typography>
              <Typography>Entities: {consistencyQuery.data.item.entities_count}</Typography>
              <Typography>Assertions: {consistencyQuery.data.item.assertions_count}</Typography>
              <Typography>Graph edges: {consistencyQuery.data.item.graph_edges_count}</Typography>
              <Typography>Map features: {consistencyQuery.data.item.map_features_count}</Typography>
              <Typography sx={{ mt: 1 }}>
                Graph{'<='}Assertions: {String(consistencyQuery.data.item.checks.graph_edges_within_assertions)}
              </Typography>
              <Typography>
                Map{'<='}Assertions: {String(consistencyQuery.data.item.checks.map_features_within_assertions)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                API metrics
              </Typography>
              <Typography>Total requests observed: {metricsQuery.data.item.total_requests}</Typography>
              <Stack spacing={0.5} sx={{ mt: 1 }}>
                {Object.entries(metricsQuery.data.item.routes).length === 0 ? (
                  <Typography color="text.secondary">No route metrics recorded yet.</Typography>
                ) : (
                  Object.entries(metricsQuery.data.item.routes).map(([route, metric]) => (
                    <Typography key={route} variant="body2">
                      {route}: count={metric.count}, avg={metric.avg_ms}ms, max={metric.max_ms}ms
                    </Typography>
                  ))
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
