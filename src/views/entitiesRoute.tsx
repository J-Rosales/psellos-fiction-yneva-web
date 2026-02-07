import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Stack, Typography } from '@mui/material';
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { fetchEntities, type EntityRecord } from '../api/client';
import { parseCoreFilters, toSearchObject } from '../routing/coreFilters';
import { buildEntitiesPaginationParams } from './entitiesPagination';

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
  const [typeMode, setTypeMode] = useState<'all' | 'custom'>('all');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const query = useQuery({
    queryKey: ['entities', filters, page, pageSize],
    queryFn: () => fetchEntities({ filters, page, pageSize }),
  });
  const rows = query.data?.items ?? [];
  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((row) => {
      const t = String(row.entity_type ?? '').trim().toLowerCase();
      if (t) set.add(t);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);
  const filteredRows = useMemo(() => {
    if (typeMode === 'all') return rows;
    if (selectedTypes.length === 0) return [] as EntityRecord[];
    return rows.filter((row) => selectedTypes.includes(String(row.entity_type ?? '').trim().toLowerCase()));
  }, [rows, typeMode, selectedTypes]);

  const onPaginationModelChange = (model: GridPaginationModel) => {
    const params = buildEntitiesPaginationParams({
      currentSearch: window.location.search,
      currentModel: { page, pageSize },
      nextModel: model,
    });
    void navigate({ to: '/entities', search: toSearchObject(params) });
  };
  const onRowClick = (entityId: string) => {
    const params = new URLSearchParams(window.location.search);
    void navigate({
      to: `/entity/${entityId}`,
      search: toSearchObject(params),
    });
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
  const noRowsLabel = typeMode === 'custom' && selectedTypes.length === 0
    ? 'No types selected.'
    : filters.q
      ? 'No entities match current filters.'
      : 'No entities found for this layer.';

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
            {filters.exact ? 'exact' : 'fuzzy'} | Visible after type filter: {filteredRows.length}
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 1.5 }} alignItems={{ md: 'center' }}>
            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ minHeight: 34 }}>
              {availableTypes.map((entityType) => {
                const active = typeMode === 'custom' && selectedTypes.includes(entityType);
                return (
                  <Chip
                    key={entityType}
                    label={entityType}
                    clickable
                    color={active ? 'primary' : 'default'}
                    variant={active ? 'filled' : 'outlined'}
                    onClick={() => {
                      setTypeMode('custom');
                      setSelectedTypes((prev) =>
                        prev.includes(entityType)
                          ? prev.filter((value) => value !== entityType)
                          : [...prev, entityType],
                      );
                    }}
                  />
                );
              })}
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button size="small" variant={typeMode === 'all' ? 'contained' : 'outlined'} onClick={() => setTypeMode('all')}>
                All
              </Button>
              <Button
                size="small"
                variant={typeMode === 'custom' && selectedTypes.length === 0 ? 'contained' : 'outlined'}
                onClick={() => {
                  setTypeMode('custom');
                  setSelectedTypes([]);
                }}
              >
                None
              </Button>
            </Stack>
          </Stack>
          <Box sx={{ height: { xs: 520, md: 'calc(100vh - 290px)' }, minHeight: 460 }}>
            <DataGrid
              rows={filteredRows}
              columns={COLUMNS}
              getRowId={(row) => row.id}
              disableRowSelectionOnClick
              pagination
              paginationMode="server"
              loading={query.isFetching}
              rowCount={typeMode === 'all' ? (meta.total_count ?? rows.length) : filteredRows.length}
              paginationModel={{ page, pageSize }}
              onPaginationModelChange={onPaginationModelChange}
              pageSizeOptions={[10, 25, 50, 100]}
              localeText={{ noRowsLabel }}
              onRowClick={(params) => onRowClick(String(params.row.id))}
              sx={{ '& .MuiDataGrid-row': { cursor: 'pointer' } }}
            />
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
}
