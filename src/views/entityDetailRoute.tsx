import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Divider, FormControl, Grid, InputLabel, Link, MenuItem, Select, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate, useParams } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { fetchAssertionsForEntity, fetchEntityById } from '../api/client';
import { parseCoreFilters } from '../routing/coreFilters';

export function EntityDetailRouteView() {
  const { entityId } = useParams({ from: '/entity/$entityId' });
  const location = useLocation();
  const navigate = useNavigate();
  const filters = useMemo(() => parseCoreFilters(window.location.search), [location.href]);
  const [assertionsPage, setAssertionsPage] = useState(0);
  const [assertionsPageSize, setAssertionsPageSize] = useState<number>(10);

  const entityQuery = useQuery({
    queryKey: ['entity-by-id', entityId, filters.layer],
    queryFn: () => fetchEntityById({ entityId, filters }),
  });
  const assertionsQuery = useQuery({
    queryKey: ['entity-assertions', entityId, filters.layer, filters.rel_type],
    queryFn: () => fetchAssertionsForEntity({ entityId, filters }),
  });
  const wikiQuery = useQuery({
    queryKey: ['wiki-summary', entityId, filters.layer],
    queryFn: async () => {
      const entity = entityQuery.data?.item;
      const labelCandidate = String(entity?.label ?? entity?.id ?? entityId).trim();
      if (!labelCandidate) return null;
      const title = encodeURIComponent(labelCandidate.replace(/\s+/g, '_'));
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      try {
        const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`, {
          signal: controller.signal,
          headers: { accept: 'application/json' },
        });
        if (!response.ok) return null;
        const payload = (await response.json()) as {
          extract?: string;
          content_urls?: { desktop?: { page?: string } };
          thumbnail?: { source?: string };
          title?: string;
        };
        return {
          summary: payload.extract ?? '',
          pageUrl: payload.content_urls?.desktop?.page ?? '',
          imageUrl: payload.thumbnail?.source ?? '',
          title: payload.title ?? labelCandidate,
        };
      } catch {
        return null;
      } finally {
        clearTimeout(timeout);
      }
    },
    enabled: entityQuery.isSuccess,
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

  if (entityQuery.isError) return <Alert severity="error">Failed to load entity: {entityQuery.error.message}</Alert>;
  if (assertionsQuery.isError) return <Alert severity="error">Failed to load linked assertions: {assertionsQuery.error.message}</Alert>;
  if (!entityQuery.data || !assertionsQuery.data) return <Alert severity="error">Entity detail query returned no payload.</Alert>;

  const entity = entityQuery.data.item;
  if (!entity) {
    return (
      <Card>
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="h6">Search an entity to view details</Typography>
            <Typography color="text.secondary">
              Entity `{entityId}` was not found in layer `{filters.layer}`. Use the search strip and press Update, or open one of these examples.
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Button
                size="small"
                variant="outlined"
                onClick={() => void navigate({ to: '/entity/$entityId', params: { entityId: 'Q41600' } })}
              >
                Example: Alexios I Komnenos
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => void navigate({ to: '/entity/$entityId', params: { entityId: 'Q517' } })}
              >
                Example: Manuel I Komnenos
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => void navigate({ to: '/entities' })}
              >
                Browse Entities
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  const allAssertions = assertionsQuery.data.items;
  const effectiveSize = assertionsPageSize === -1 ? allAssertions.length : assertionsPageSize;
  const totalPages = Math.max(1, Math.ceil(allAssertions.length / Math.max(1, effectiveSize)));
  const clampedPage = Math.min(assertionsPage, totalPages - 1);
  const shownAssertions = assertionsPageSize === -1
    ? allAssertions
    : allAssertions.slice(clampedPage * effectiveSize, clampedPage * effectiveSize + effectiveSize);

  return (
    <Stack spacing={2}>
      {entityQuery.data.meta.warnings?.length ? <Alert severity="warning">{entityQuery.data.meta.warnings.join(' ')}</Alert> : null}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h5">{String(entity.label ?? entity.id)}</Typography>
              <Typography variant="body2" color="text.secondary">{String(entity.id)}</Typography>
              <Card variant="outlined" sx={{ mt: 2 }}>
                <CardContent>
                  {wikiQuery.isLoading ? (
                    <Typography variant="body2" color="text.secondary">Loading wiki summary...</Typography>
                  ) : !wikiQuery.data || !wikiQuery.data.summary ? (
                    <Typography variant="body2" color="text.secondary">wiki summary not found</Typography>
                  ) : (
                    <Stack spacing={1}>
                      {wikiQuery.data.imageUrl ? (
                        <Box
                          component="img"
                          src={wikiQuery.data.imageUrl}
                          alt={`${wikiQuery.data.title} thumbnail`}
                          sx={{ width: '100%', maxWidth: 180, maxHeight: 180, objectFit: 'cover', borderRadius: 1, display: 'block', mx: 'auto' }}
                        />
                      ) : null}
                      <Typography variant="body2">{wikiQuery.data.summary}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Source: {wikiQuery.data.pageUrl ? <Link href={wikiQuery.data.pageUrl} target="_blank" rel="noopener noreferrer">Wikipedia</Link> : 'Wikipedia'}
                      </Typography>
                    </Stack>
                  )}
                </CardContent>
              </Card>
              <Stack direction="row" spacing={1} sx={{ mt: 2 }} useFlexGap flexWrap="wrap">
                <Chip label={`Type: ${String(entity.entity_type ?? 'unknown')}`} />
                <Chip label={`Layer: ${filters.layer}`} variant="outlined" />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="h6">Linked assertions</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel id="assertions-page-size-label">Show</InputLabel>
                    <Select
                      labelId="assertions-page-size-label"
                      label="Show"
                      value={assertionsPageSize}
                      onChange={(event) => {
                        setAssertionsPageSize(Number(event.target.value));
                        setAssertionsPage(0);
                      }}
                    >
                      <MenuItem value={10}>10</MenuItem>
                      <MenuItem value={20}>20</MenuItem>
                      <MenuItem value={50}>50</MenuItem>
                      <MenuItem value={-1}>All</MenuItem>
                    </Select>
                  </FormControl>
                  {assertionsPageSize !== -1 ? (
                    <FormControl size="small" sx={{ minWidth: 130 }}>
                      <InputLabel id="assertions-page-label">Page</InputLabel>
                      <Select
                        labelId="assertions-page-label"
                        label="Page"
                        value={clampedPage}
                        onChange={(event) => setAssertionsPage(Number(event.target.value))}
                      >
                        {Array.from({ length: totalPages }).map((_, idx) => (
                          <MenuItem key={idx} value={idx}>{idx + 1}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : null}
                </Stack>
              </Stack>

              {allAssertions.length === 0 ? (
                <Typography color="text.secondary">No linked assertions for current filters.</Typography>
              ) : (
                <Grid container spacing={1} sx={{ maxHeight: { xs: 560, md: 'calc(100vh - 360px)' }, overflow: 'auto', pr: 0.5 }}>
                  {shownAssertions.map((assertion) => (
                    <Grid key={String(assertion.id ?? `${assertion.subject}-${assertion.object}`)} size={{ xs: 12, md: 6 }}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Stack spacing={1}>
                            <Typography variant="body2" sx={{ fontStyle: 'italic', fontFamily: 'monospace' }}>
                              <Box component="code" sx={{ color: 'secondary.main', bgcolor: 'action.hover', px: 0.5, borderRadius: 0.5 }}>
                                {String(assertion.id ?? 'unknown')}
                              </Box>
                              {' · relation '}
                              <Box component="code" sx={{ color: 'secondary.main', bgcolor: 'action.hover', px: 0.5, borderRadius: 0.5 }}>
                                {String(assertion.predicate ?? 'related_to')}
                              </Box>
                            </Typography>
                            <Divider />
                            <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                              <Stack>
                                <Button
                                  size="small"
                                  variant="text"
                                  sx={{ px: 0, justifyContent: 'flex-start', minWidth: 0, textTransform: 'none', fontWeight: 600 }}
                                  disabled={!assertion.subject}
                                  onClick={() => {
                                    const subjectId = String(assertion.subject ?? '').trim();
                                    if (!subjectId) return;
                                    const params = Object.fromEntries(new URLSearchParams(window.location.search).entries());
                                    void navigate({ to: `/entity/${subjectId}`, search: params });
                                  }}
                                >
                                  {displayEntityLabel(assertion, 'subject', entity)}
                                </Button>
                                <Typography variant="caption" color="text.secondary">{String(assertion.subject ?? 'unknown')}</Typography>
                              </Stack>
                              <Typography variant="body2" color="text.secondary">{'->'}</Typography>
                              <Stack sx={{ minWidth: 0, flex: 1 }}>
                                <Button
                                  size="small"
                                  variant="text"
                                  sx={{ px: 0, justifyContent: 'flex-start', minWidth: 0, textTransform: 'none', fontWeight: 600 }}
                                  disabled={!assertion.object}
                                  onClick={() => {
                                    const objectId = String(assertion.object ?? '').trim();
                                    if (!objectId) return;
                                    const params = Object.fromEntries(new URLSearchParams(window.location.search).entries());
                                    void navigate({ to: `/entity/${objectId}`, search: params });
                                  }}
                                >
                                  {displayEntityLabel(assertion, 'object', entity)}
                                </Button>
                                <Typography variant="caption" color="text.secondary">{String(assertion.object ?? 'unknown')}</Typography>
                              </Stack>
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}

function displayEntityLabel(
  assertion: Record<string, unknown>,
  role: 'subject' | 'object',
  currentEntity: Record<string, unknown>,
): string {
  const id = String(assertion[role] ?? 'unknown');
  const directLabelKey = role === 'subject' ? 'subject_label' : 'object_label';
  const directLabel = assertion[directLabelKey];
  if (typeof directLabel === 'string' && directLabel.trim().length > 0) return directLabel;

  const psellos = (assertion.extensions as { psellos?: { raw?: Record<string, unknown> } } | undefined)?.psellos;
  const rawLabel = psellos?.raw?.[directLabelKey];
  if (typeof rawLabel === 'string' && rawLabel.trim().length > 0) return rawLabel;

  if (String(currentEntity.id ?? '') === id) return String(currentEntity.label ?? currentEntity.id ?? id);
  return id;
}

