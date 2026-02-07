import { Alert, Button, Card, CardContent, CircularProgress, Grid, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from '@tanstack/react-router';
import { useMemo } from 'react';
import { fetchApiMetrics, fetchEntities, fetchLayerConsistency, fetchMapFeatures } from '../api/client';
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
  const entitiesQuery = useQuery({
    queryKey: ['diagnostics-entities', filters.layer],
    queryFn: () => fetchEntities({ filters, page: 0, pageSize: 1000 }),
  });
  const mapQuery = useQuery({
    queryKey: ['diagnostics-map', filters.layer],
    queryFn: () => fetchMapFeatures({ filters }),
  });

  if (consistencyQuery.isLoading || metricsQuery.isLoading || entitiesQuery.isLoading || mapQuery.isLoading) {
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
  if (!consistencyQuery.data || !metricsQuery.data || !entitiesQuery.data || !mapQuery.data) {
    return <Alert severity="error">Diagnostics payload missing.</Alert>;
  }

  const entities = entitiesQuery.data.items;
  const assertionQuality = {
    missing_label_entities: entities.filter((item) => !String(item.label ?? '').trim()).map((item) => item.id),
    unknown_entity_type_entities: entities.filter((item) => !String(item.entity_type ?? '').trim()).map((item) => item.id),
    entity_total: entities.length,
  };
  const layerDrift = {
    layer: filters.layer,
    entities_count: consistencyQuery.data.item.entities_count,
    assertions_count: consistencyQuery.data.item.assertions_count,
    graph_edges_count: consistencyQuery.data.item.graph_edges_count,
    map_features_count: consistencyQuery.data.item.map_features_count,
  };
  const temporalSparsity = {
    layer: filters.layer,
    note: 'Temporal sparsity needs assertion-level date extraction from compiled assertion payloads for full precision.',
    date_filter_from: filters.date_from || null,
    date_filter_to: filters.date_to || null,
  };
  const geoCoverage = {
    layer: filters.layer,
    place_groups: mapQuery.data.groups.length,
    unknown_geo_assertion_count: Number(mapQuery.data.meta.buckets?.unknown_geo_assertion_count ?? 0),
    ambiguous_place_group_count: Number(mapQuery.data.meta.buckets?.ambiguous_place_group_count ?? 0),
  };

  const downloadReport = (fileName: string, payload: unknown) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

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
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Action Exports
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button variant="outlined" onClick={() => downloadReport(`diagnostics-assertion-quality-${filters.layer}.json`, assertionQuality)}>
                  Export assertion quality
                </Button>
                <Button variant="outlined" onClick={() => downloadReport(`diagnostics-layer-drift-${filters.layer}.json`, layerDrift)}>
                  Export layer drift
                </Button>
                <Button variant="outlined" onClick={() => downloadReport(`diagnostics-temporal-sparsity-${filters.layer}.json`, temporalSparsity)}>
                  Export temporal sparsity
                </Button>
                <Button variant="outlined" onClick={() => downloadReport(`diagnostics-geo-coverage-${filters.layer}.json`, geoCoverage)}>
                  Export geo coverage
                </Button>
                <Button
                  variant="outlined"
                  onClick={() =>
                    downloadReport(`diagnostics-repro-snapshot-${filters.layer}.json`, {
                      generated_at: new Date().toISOString(),
                      layer: filters.layer,
                      counts: {
                        entities: consistencyQuery.data.item.entities_count,
                        assertions: consistencyQuery.data.item.assertions_count,
                        graph_edges: consistencyQuery.data.item.graph_edges_count,
                        map_features: consistencyQuery.data.item.map_features_count,
                      },
                    })
                  }
                >
                  Export reproducibility snapshot
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
