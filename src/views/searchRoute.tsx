import { Alert, Card, CardContent, CircularProgress, List, ListItemButton, ListItemText, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import { fetchEntities } from '../api/client';
import { parseCoreFilters } from '../routing/coreFilters';

export function SearchRouteView() {
  const location = useLocation();
  const navigate = useNavigate();
  const filters = useMemo(() => parseCoreFilters(window.location.search), [location.href]);

  const query = useQuery({
    queryKey: ['search', filters],
    queryFn: () => fetchEntities({ filters, page: 0, pageSize: 50 }),
  });

  if (query.isLoading) {
    return (
      <Card>
        <CardContent>
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={20} />
            <Typography>Searching entities...</Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (query.isError) {
    return <Alert severity="error">Search failed: {query.error.message}</Alert>;
  }
  if (!query.data) {
    return <Alert severity="error">Search query returned no payload.</Alert>;
  }

  const rows = query.data.items;
  return (
    <Stack spacing={2}>
      {query.data.meta.warnings?.length ? <Alert severity="warning">{query.data.meta.warnings.join(' ')}</Alert> : null}
      <Alert severity="info">
        Unknown labels: {Number(query.data.meta.buckets?.unknown_label_count ?? 0)} | Ambiguous labels:{' '}
        {Number(query.data.meta.buckets?.ambiguous_label_count ?? 0)}
      </Alert>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Search
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {filters.q ? `Query "${filters.q}"` : 'No query text entered'} | Mode: {filters.exact ? 'exact' : 'fuzzy'}
          </Typography>
          {rows.length === 0 ? (
            <Typography color="text.secondary">No results for the current query/filter set.</Typography>
          ) : (
            <List dense>
              {rows.map((row) => (
                <ListItemButton key={row.id} onClick={() => void navigate({ to: `/entity/${row.id}` })}>
                  <ListItemText
                    primary={String(row.label ?? row.id)}
                    secondary={`${String(row.id)} | ${String(row.entity_type ?? 'unknown')}`}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
