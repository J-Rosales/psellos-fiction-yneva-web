import { Alert, Card, CardContent, Chip, CircularProgress, Grid, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useParams } from '@tanstack/react-router';
import { useMemo } from 'react';
import { fetchAssertionsForEntity, fetchEntityById } from '../api/client';
import { parseCoreFilters } from '../routing/coreFilters';

export function EntityDetailRouteView() {
  const { entityId } = useParams({ from: '/entity/$entityId' });
  const location = useLocation();
  const filters = useMemo(() => parseCoreFilters(window.location.search), [location.href]);

  const entityQuery = useQuery({
    queryKey: ['entity-by-id', entityId, filters.layer],
    queryFn: () => fetchEntityById({ entityId, filters }),
  });
  const assertionsQuery = useQuery({
    queryKey: ['entity-assertions', entityId, filters.layer, filters.rel_type],
    queryFn: () => fetchAssertionsForEntity({ entityId, filters }),
  });

  if (entityQuery.isLoading || assertionsQuery.isLoading) {
    return (
      <Card>
        <CardContent>
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={20} />
            <Typography>Loading entity profile...</Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (entityQuery.isError) {
    return <Alert severity="error">Failed to load entity: {entityQuery.error.message}</Alert>;
  }
  if (assertionsQuery.isError) {
    return <Alert severity="error">Failed to load linked assertions: {assertionsQuery.error.message}</Alert>;
  }
  if (!entityQuery.data || !assertionsQuery.data) {
    return <Alert severity="error">Entity detail query returned no payload.</Alert>;
  }

  const entity = entityQuery.data.item;
  if (!entity) {
    return <Alert severity="warning">Entity `{entityId}` was not found in layer `{filters.layer}`.</Alert>;
  }

  return (
    <Stack spacing={2}>
      {entityQuery.data.meta.warnings?.length ? <Alert severity="warning">{entityQuery.data.meta.warnings.join(' ')}</Alert> : null}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h5">{String(entity.label ?? entity.id)}</Typography>
              <Typography variant="body2" color="text.secondary">
                {String(entity.id)}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Chip label={`Type: ${String(entity.entity_type ?? 'unknown')}`} />
                <Chip label={`Layer: ${filters.layer}`} variant="outlined" />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Linked assertions
              </Typography>
              {assertionsQuery.data.items.length === 0 ? (
                <Typography color="text.secondary">No linked assertions for current filters.</Typography>
              ) : (
                <Stack spacing={1}>
                  {assertionsQuery.data.items.map((assertion) => (
                    <Card key={String(assertion.id ?? `${assertion.subject}-${assertion.object}`)} variant="outlined">
                      <CardContent>
                        <Typography variant="body2">
                          {String(assertion.subject ?? 'unknown')} -[{String(assertion.predicate ?? 'related_to')}]-&gt;{' '}
                          {String(assertion.object ?? 'unknown')}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
