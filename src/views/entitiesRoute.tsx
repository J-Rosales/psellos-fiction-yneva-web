import { Alert, Box, Card, CardContent, CircularProgress, Stack, Typography } from '@mui/material';
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import { fetchEntities, type EntityRecord } from '../api/client';
import { parseCoreFilters, toSearchObject } from '../routing/coreFilters';

const COLUMNS: GridColDef<EntityRecord>[] = [
  { field: 'id', headerName: 'ID', minWidth: 160, flex: 1 },
  { field: 'label', headerName: 'Label', minWidth: 220, flex: 1.5 },
  { field: 'entity_type', headerName: 'Type', minWidth: 120, flex: 0.8 },
];

export function EntitiesRouteView() {
  const location = useLocation();
  const navigate = useNavigate();
  const filters = useMemo(() => parseCoreFilters(window.location.search), [location.href]);
  const page = Number(new URLSearchParams(window.location.search).get('page') ?? '0') || 0;
  const pageSize = Number(new URLSearchParams(window.location.search).get('page_size') ?? '25') || 25;

  const query = useQuery({
    queryKey: ['entities', filters, page, pageSize],
    queryFn: () => fetchEntities({ filters, page, pageSize }),
  });

  const onPaginationModelChange = (model: GridPaginationModel) => {
    const params = new URLSearchParams(window.location.search);
    params.set('page', String(model.page));
    params.set('page_size', String(model.pageSize));
    void navigate({ to: '/entities', search: toSearchObject(params) });
  };

  if (query.isLoading) {
    return (
      <Card>
        <CardContent>
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={20} />
            <Typography>Loading entities...</Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (query.isError) {
    return <Alert severity="error">Failed to load entities: {query.error.message}</Alert>;
  }
  if (!query.data) {
    return <Alert severity="error">Entity query returned no payload.</Alert>;
  }

  const meta = query.data.meta;
  const rows = query.data.items;
  const noRowsLabel = filters.q ? 'No entities match current filters.' : 'No entities found for this layer.';

  return (
    <Stack spacing={2}>
      {meta.warnings?.length ? <Alert severity="warning">{meta.warnings.join(' ')}</Alert> : null}
      <Alert severity="info">
        Unknown labels: {Number(meta.buckets?.unknown_label_count ?? 0)} | Ambiguous labels:{' '}
        {Number(meta.buckets?.ambiguous_label_count ?? 0)}
      </Alert>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Entities
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Result count: {meta.result_count} (Total: {meta.total_count ?? meta.result_count}) | Mode:{' '}
            {filters.exact ? 'exact' : 'fuzzy'}
          </Typography>
          <Box sx={{ height: 560 }}>
            <DataGrid
              rows={rows}
              columns={COLUMNS}
              getRowId={(row) => row.id}
              disableRowSelectionOnClick
              paginationMode="server"
              rowCount={meta.total_count ?? rows.length}
              paginationModel={{ page, pageSize }}
              onPaginationModelChange={onPaginationModelChange}
              pageSizeOptions={[10, 25, 50, 100]}
              localeText={{ noRowsLabel }}
            />
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
}
