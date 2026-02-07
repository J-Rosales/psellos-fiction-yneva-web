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
  MenuItem,
  Select,
  Slider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from '@tanstack/react-router';
import cytoscape from 'cytoscape';
import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchEntities, fetchGraphNeighborhood } from '../api/client';
import { parseCoreFilters } from '../routing/coreFilters';
import { computeViewportHeightPx } from './viewportLayout';

type ViewMode = 'dynasty' | 'workplace';
type ClusterPrecedence = 'confidence' | 'size';
type LayoutView = 'node' | 'directional';

type GraphPayload = {
  nodes: Array<Record<string, unknown>>;
  edges: Array<Record<string, unknown>>;
};

export function GraphRouteView() {
  const location = useLocation();
  const navigate = useNavigate();
  const filters = useMemo(() => parseCoreFilters(window.location.search), [location.href]);
  const search = useMemo(() => new URLSearchParams(window.location.search), [location.href]);

  const initialSeed = search.get('entity_id') ?? filters.q.trim();
  const [seedId, setSeedId] = useState<string>(initialSeed);
  const [selectedId, setSelectedId] = useState<string>(initialSeed);
  const [depth, setDepth] = useState(Number(search.get('g_depth') ?? 1) || 1);
  const [separation, setSeparation] = useState(2.4);
  const [viewMode, setViewMode] = useState<ViewMode>('dynasty');
  const [clusterPrecedence, setClusterPrecedence] = useState<ClusterPrecedence>('confidence');
  const [layoutView, setLayoutView] = useState<LayoutView>((search.get('g_mode') as LayoutView) || 'node');
  const [expanded, setExpanded] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [labelScale, setLabelScale] = useState(1);
  const [data, setData] = useState<GraphPayload>({ nodes: [], edges: [] });
  const [pathFrom, setPathFrom] = useState('');
  const [pathTo, setPathTo] = useState('');
  const [jumpTo, setJumpTo] = useState('');
  const [includeRelations, setIncludeRelations] = useState<string[]>([]);
  const [excludeRelations, setExcludeRelations] = useState<string[]>([]);
  const [relationCatalog, setRelationCatalog] = useState<string[]>([]);
  const [confidenceOpacity, setConfidenceOpacity] = useState(true);
  const [timeFrom, setTimeFrom] = useState(0);
  const [timeTo, setTimeTo] = useState(3000);
  const [collapsedRoots, setCollapsedRoots] = useState<string[]>([]);
  const [nodeSemanticMapEnabled, setNodeSemanticMapEnabled] = useState(true);
  const [pinLayout, setPinLayout] = useState(false);
  const [lastLayoutAt, setLastLayoutAt] = useState(0);
  const [focusHistory, setFocusHistory] = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [cyReady, setCyReady] = useState(false);
  const previousGraphContextRef = useRef('');
  const previousRelationCatalogContextRef = useRef('');
  const [viewportHeight, setViewportHeight] = useState(620);
  const [metrics, setMetrics] = useState<{
    nodes: number;
    edges: number;
    avgDegree: number;
    densePairs: number;
    runtimeMs: number;
    zoom: number;
  }>({ nodes: 0, edges: 0, avgDegree: 0, densePairs: 0, runtimeMs: 0, zoom: 1 });

  useEffect(() => {
    (window as Window & { __psellosGraphDebug?: unknown }).__psellosGraphDebug = {
      getMetrics: () => metrics,
      setSeparation: (value: number) => setSeparation(Math.max(1.2, Math.min(6, value))),
    };
    return () => {
      delete (window as Window & { __psellosGraphDebug?: unknown }).__psellosGraphDebug;
    };
  }, [metrics]);

  const relTypeFilter = useMemo(
    () => buildRelationFilter(filters.rel_type, includeRelations, excludeRelations),
    [filters.rel_type, includeRelations, excludeRelations],
  );
  const activeSeed = useMemo(() => seedId || filters.q.trim(), [seedId, filters.q]);
  const seedResolutionQuery = useQuery({
    queryKey: ['graph-seed-resolution', filters.layer, activeSeed],
    queryFn: async () => {
      const trimmed = activeSeed.trim();
      if (!trimmed) return '';
      if (/^Q\d+$/i.test(trimmed)) return trimmed.toUpperCase();
      const exactHit = await fetchEntities({
        filters: { ...filters, q: trimmed, exact: true, rel_type: '', entity_type: '', has_geo: 'any', date_from: '', date_to: '' },
        page: 0,
        pageSize: 1,
      });
      if (exactHit.items.length > 0 && exactHit.items[0]?.id) {
        return String(exactHit.items[0].id);
      }
      const fuzzyHit = await fetchEntities({
        filters: { ...filters, q: trimmed, exact: false, rel_type: '', entity_type: '', has_geo: 'any', date_from: '', date_to: '' },
        page: 0,
        pageSize: 1,
      });
      if (fuzzyHit.items.length > 0 && fuzzyHit.items[0]?.id) {
        return String(fuzzyHit.items[0].id);
      }
      return '';
    },
    enabled: Boolean(activeSeed.trim()),
    staleTime: 0,
  });
  const resolvedSeedId = seedResolutionQuery.data ?? '';

  const query = useQuery({
    queryKey: ['graph', filters.layer, relTypeFilter, resolvedSeedId, depth],
    queryFn: () =>
      fetchGraphNeighborhood({
        entityId: resolvedSeedId || undefined,
        depth,
        filters: { ...filters, rel_type: relTypeFilter },
      }),
    enabled: Boolean(resolvedSeedId),
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('g_mode', layoutView);
    params.set('g_depth', String(depth));
    if (resolvedSeedId || activeSeed) params.set('entity_id', resolvedSeedId || activeSeed);
    navigate({ to: '/graph', search: Object.fromEntries(params.entries()), replace: true });
  }, [navigate, layoutView, depth, activeSeed, resolvedSeedId]);

  useEffect(() => {
    const q = filters.q.trim();
    if (!q || q === seedId) return;
    setSeedId(q);
    // Preserve current graph while new seed resolves to avoid blink/reload feeling.
    setDepth(1);
  }, [filters.q, seedId]);

  useEffect(() => {
    if (!selectedId && activeSeed) {
      setSelectedId(activeSeed);
    }
  }, [selectedId, activeSeed]);

  useEffect(() => {
    if (!resolvedSeedId) return;
    setSelectedId((prev) => (prev === activeSeed ? resolvedSeedId : prev));
  }, [resolvedSeedId, activeSeed]);

  useEffect(() => {
    if (!query.data) return;
    const contextKey = `${filters.layer}::${relTypeFilter}::${activeSeed}`;
    const previousContext = previousGraphContextRef.current;
    previousGraphContextRef.current = contextKey;
    setData((prev) => (previousContext && previousContext === contextKey ? mergeGraphData(prev, query.data) : query.data));
    const discovered = query.data.edges
      .map((edge) => String(edge.predicate ?? 'related_to').trim())
      .filter(Boolean);
    if (discovered.length > 0) {
      setRelationCatalog((prev) => Array.from(new Set([...prev, ...discovered])).sort((a, b) => a.localeCompare(b)));
    }
  }, [query.data, filters.layer, relTypeFilter, activeSeed]);

  useEffect(() => {
    const catalogContext = `${filters.layer}::${resolvedSeedId || activeSeed}`;
    if (previousRelationCatalogContextRef.current === catalogContext) return;
    previousRelationCatalogContextRef.current = catalogContext;
    setRelationCatalog([]);
    setIncludeRelations([]);
    setExcludeRelations([]);
  }, [filters.layer, resolvedSeedId, activeSeed]);

  useEffect(() => {
    if (!containerRef.current || cyRef.current) return;
    const cy = cytoscape({
      container: containerRef.current,
      elements: [],
      style: buildStyle(labelScale, confidenceOpacity, layoutView) as any,
      layout: { name: 'grid', animate: false },
    });
    cy.on('tap', 'node', (event) => {
      const id = String(event.target.id());
      const rawLabel = String(event.target.data('fullLabel') ?? event.target.data('nodeLabel') ?? id);
      const normalizedLabel = rawLabel.replace(/^L\d+\s+/, '').trim() || id;
      setExpanded(false);
      setFocusHistory((prev) => (selectedId ? [...prev.slice(-11), selectedId] : prev));
      setSelectedId(id);
      setSeedId(id);
      setDepth(1);
      focusNode(cy, id);
      const params = new URLSearchParams(window.location.search);
      params.set('q', normalizedLabel);
      params.set('entity_id', id);
      params.set('g_depth', '1');
      params.set('g_mode', layoutView);
      navigate({ to: '/graph', search: Object.fromEntries(params.entries()), replace: true });
    });
    cyRef.current = cy;
    setCyReady(true);
    return () => {
      cy.destroy();
      cyRef.current = null;
      setCyReady(false);
    };
  }, [
    layoutView,
    labelScale,
    confidenceOpacity,
    seedResolutionQuery.isLoading,
    query.isLoading,
    activeSeed,
    resolvedSeedId,
  ]);

  useEffect(() => {
    const syncViewportHeight = () => {
      const topOffset = viewportRef.current?.getBoundingClientRect().top ?? 220;
      setViewportHeight(computeViewportHeightPx(window.innerHeight, topOffset, 360));
      cyRef.current?.resize();
    };
    syncViewportHeight();
    window.addEventListener('resize', syncViewportHeight);
    return () => window.removeEventListener('resize', syncViewportHeight);
  }, []);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.style(buildStyle(labelScale, confidenceOpacity, layoutView) as any);
  }, [layoutView, labelScale, confidenceOpacity]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    applyGraph(cy, data, selectedId, timeFrom, timeTo, collapsedRoots, nodeSemanticMapEnabled, layoutView);
    setMetrics((prev) => ({ ...prev, ...computeGraphMetrics(cy, separation) }));
  }, [data, selectedId, layoutView, timeFrom, timeTo, collapsedRoots, nodeSemanticMapEnabled, separation, cyReady]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || pinLayout) return;
    const started = performance.now();
    runLayout(cy, separation, layoutView, selectedId);
    const runtimeMs = Math.round(performance.now() - started);
    setLastLayoutAt(Date.now());
    setMetrics((prev) => ({ ...prev, runtimeMs, zoom: Number(cy.zoom().toFixed(2)), ...computeGraphMetrics(cy, separation) }));
  }, [layoutView, separation, selectedId, data, pinLayout, cyReady]);

  const clusterMap = useMemo(() => inferClusters(data.nodes, data.edges, viewMode), [data.nodes, data.edges, viewMode]);
  const relationTypes = useMemo(() => {
    if (relationCatalog.length > 0) return relationCatalog;
    const set = new Set<string>();
    data.edges.forEach((edge) => set.add(String(edge.predicate ?? 'related_to')));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [data.edges, relationCatalog]);

  if ((seedResolutionQuery.isLoading || query.isLoading) && data.nodes.length === 0) {
    return (
      <Card>
        <CardContent>
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={20} />
            <Typography>
              {seedResolutionQuery.isLoading ? 'Resolving seed entity...' : 'Loading graph neighborhood...'}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }
  if (!activeSeed || (!resolvedSeedId && !seedResolutionQuery.isLoading)) {
    const hasQuery = Boolean(activeSeed);
    return (
      <Card>
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="h6">
              {hasQuery ? 'No matching graph seed found' : 'Search an entity to view graph neighborhoods'}
            </Typography>
            <Typography color="text.secondary">
              {hasQuery
                ? `No entity matched "${activeSeed}". Try a different person label or use a canonical entity ID.`
                : 'Use the global search strip and press Update. The graph opens around the selected person with hop-1 depth by default.'}
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Button size="small" variant="outlined" onClick={() => void navigate({ to: '/graph', search: { layer: filters.layer, q: 'alexios i komnenos' } })}>
                Example: Alexios I Komnenos
              </Button>
              <Button size="small" variant="outlined" onClick={() => void navigate({ to: '/graph', search: { layer: filters.layer, q: 'manuel i komnenos' } })}>
                Example: Manuel I Komnenos
              </Button>
              <Button size="small" variant="outlined" onClick={() => void navigate({ to: '/graph', search: { layer: filters.layer, q: 'Q41600' } })}>
                Example: by entity ID
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    );
  }
  if (query.isError) return <Alert severity="error">Graph query failed: {query.error.message}</Alert>;

  const selectedNode = data.nodes.find((node) => String(node.id) === selectedId) ?? null;
  const selectedClusters = selectedId ? clusterMap.get(selectedId) ?? [] : [];
  const sortedClusters = [...selectedClusters].sort((a, b) =>
    clusterPrecedence === 'size' ? b.weight - a.weight : b.confidence - a.confidence,
  );

  return (
    <Stack spacing={1.5}>
      {query.data?.meta.warnings?.length ? <Alert severity="warning">{query.data.meta.warnings.join(' ')}</Alert> : null}
      <Box ref={viewportRef} sx={{ position: 'relative', height: viewportHeight, border: '1px solid #e5e7eb', borderRadius: 1, overflow: 'hidden' }}>
        <Box ref={containerRef} sx={{ width: '100%', height: '100%' }} />

        <Card sx={{ position: 'absolute', top: 12, left: 12, zIndex: 5, width: { xs: 'calc(100% - 24px)', md: 620 }, maxHeight: { xs: 250, md: 320 }, overflow: 'auto' }}>
          <CardContent sx={{ py: 1.25 }}>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="h6">Graph</Typography>
                <Chip label={`Depth ${depth}`} />
                <Chip label={layoutView === 'node' ? 'Node View' : 'Directional View'} />
                <Chip label={`Seed ${resolvedSeedId || activeSeed}`} />
                <Button size="small" variant="outlined" onClick={() => setDepth((value) => Math.min(value + 1, 5))}>
                  Expand (+1)
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    const cy = cyRef.current;
                    if (!cy) return;
                    cy.fit(undefined, 60);
                    setMetrics((prev) => ({ ...prev, zoom: Number(cy.zoom().toFixed(2)) }));
                  }}
                >
                  Fit
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    const cy = cyRef.current;
                    if (!cy || !activeSeed) return;
                    focusNode(cy, activeSeed);
                  }}
                >
                  Center Seed
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    const cy = cyRef.current;
                    if (!cy || focusHistory.length === 0) return;
                    const previous = focusHistory[focusHistory.length - 1];
                    setFocusHistory((prev) => prev.slice(0, -1));
                    setSelectedId(previous);
                    focusNode(cy, previous);
                  }}
                >
                  Back Focus
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    const cy = cyRef.current;
                    if (!cy) return;
                    cy.zoom(Math.min(2.5, cy.zoom() + 0.15));
                    setMetrics((prev) => ({ ...prev, zoom: Number(cy.zoom().toFixed(2)) }));
                  }}
                >
                  Zoom +
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    const cy = cyRef.current;
                    if (!cy) return;
                    cy.zoom(Math.max(0.3, cy.zoom() - 0.15));
                    setMetrics((prev) => ({ ...prev, zoom: Number(cy.zoom().toFixed(2)) }));
                  }}
                >
                  Zoom -
                </Button>
                <FormControl size="small" sx={{ minWidth: 170 }}>
                  <InputLabel id="graph-view-mode-label">Cluster view</InputLabel>
                  <Select
                    labelId="graph-view-mode-label"
                    label="Cluster view"
                    value={viewMode}
                    onChange={(event) => setViewMode(event.target.value as ViewMode)}
                  >
                    <MenuItem value="dynasty">View Dynasty</MenuItem>
                    <MenuItem value="workplace">View Workplace</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 170 }}>
                  <InputLabel id="graph-layout-view-label">Layout view</InputLabel>
                  <Select
                    labelId="graph-layout-view-label"
                    label="Layout view"
                    value={layoutView}
                    onChange={(event) => setLayoutView(event.target.value as LayoutView)}
                  >
                    <MenuItem value="node">Node</MenuItem>
                    <MenuItem value="directional">Directional</MenuItem>
                  </Select>
                </FormControl>
                <Button size="small" variant="text" onClick={() => setShowAdvanced((value) => !value)}>
                  Advanced options
                </Button>
                <Button size="small" variant="text" onClick={() => setPinLayout((value) => !value)}>
                  Layout {pinLayout ? 'Pinned' : 'Auto'}
                </Button>
              </Stack>

            {showAdvanced ? (
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
                <FormControl size="small" sx={{ minWidth: 190 }}>
                  <InputLabel id="cluster-precedence-label">Cluster precedence</InputLabel>
                  <Select
                    labelId="cluster-precedence-label"
                    label="Cluster precedence"
                    value={clusterPrecedence}
                    onChange={(event) => setClusterPrecedence(event.target.value as ClusterPrecedence)}
                  >
                    <MenuItem value="confidence">Confidence-first</MenuItem>
                    <MenuItem value="size">Cluster-size first</MenuItem>
                  </Select>
                </FormControl>
                <Box sx={{ minWidth: 220 }}>
                  <Typography variant="caption">Label scale</Typography>
                  <Slider
                    value={labelScale}
                    min={0.6}
                    max={1.6}
                    step={0.1}
                    onChange={(_, value) => setLabelScale(Number(value))}
                  />
                </Box>
                <TextField size="small" label="Path from" value={pathFrom} onChange={(e) => setPathFrom(e.target.value)} />
                <TextField size="small" label="Path to" value={pathTo} onChange={(e) => setPathTo(e.target.value)} />
                <TextField size="small" label="Jump to node id" value={jumpTo} onChange={(e) => setJumpTo(e.target.value)} />
                <TextField size="small" type="number" label="Year from" value={timeFrom} onChange={(e) => setTimeFrom(Number(e.target.value || 0))} sx={{ width: 120 }} />
                <TextField size="small" type="number" label="Year to" value={timeTo} onChange={(e) => setTimeTo(Number(e.target.value || 3000))} sx={{ width: 120 }} />
                <Button
                  variant="outlined"
                  onClick={() => {
                    const id = jumpTo.trim();
                    if (!id) return;
                    setSelectedId(id);
                    const cy = cyRef.current;
                    if (cy) {
                      focusNode(cy, id);
                    }
                  }}
                >
                  Jump
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    const cy = cyRef.current;
                    if (cy) applyPathHighlight(cy, pathFrom.trim(), pathTo.trim());
                  }}
                >
                  Highlight path
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    const cy = cyRef.current;
                    if (!cy) return;
                    const image = cy.png({ full: true, scale: 2, bg: '#ffffff' });
                    const link = document.createElement('a');
                    link.href = image;
                    link.download = 'graph.png';
                    link.click();
                  }}
                >
                  Export PNG
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    const cy = cyRef.current;
                    if (!cy) return;
                    const png = cy.png({ full: true, scale: 2, bg: '#ffffff' });
                    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000"><image href="${png}" width="1600" height="1000"/></svg>`;
                    const blob = new Blob([svg], { type: 'image/svg+xml' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'graph.svg';
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Export SVG
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    const payload = { selected_id: selectedId || null, mode: layoutView, data };
                    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'graph-subgraph.json';
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Export JSON
                </Button>
              </Stack>
            ) : null}
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="body2">Relation quick filter:</Typography>
              {relationTypes.map((rel) => {
                const included = includeRelations.includes(rel);
                const excluded = excludeRelations.includes(rel);
                return (
                  <Button
                    key={rel}
                    size="small"
                    color={included ? 'primary' : excluded ? 'warning' : 'inherit'}
                    variant={included || excluded ? 'contained' : 'outlined'}
                    onClick={() => {
                      if (included) {
                        setIncludeRelations((prev) => prev.filter((item) => item !== rel));
                        setExcludeRelations((prev) => [...new Set([...prev, rel])]);
                        return;
                      }
                      if (excluded) {
                        setExcludeRelations((prev) => prev.filter((item) => item !== rel));
                        return;
                      }
                      setIncludeRelations((prev) => [...new Set([...prev, rel])]);
                    }}
                  >
                    {included ? `+ ${rel}` : excluded ? `- ${rel}` : rel}
                  </Button>
                );
              })}
                <Button size="small" onClick={() => { setIncludeRelations([]); setExcludeRelations([]); }}>
                  Reset relation filter
                </Button>
              </Stack>
              <Box sx={{ minWidth: 260 }}>
                <Typography variant="caption">Node separation</Typography>
                <Slider
                  value={separation}
                  min={1.2}
                  max={6}
                  step={0.2}
                  onChange={(_, value) => setSeparation(Number(value))}
                />
              </Box>
            {showAdvanced ? (
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Button variant="outlined" onClick={() => setConfidenceOpacity((value) => !value)}>
                  Confidence opacity: {confidenceOpacity ? 'on' : 'off'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setLabelScale(1);
                    setConfidenceOpacity(true);
                    setTimeFrom(0);
                    setTimeTo(3000);
                    setNodeSemanticMapEnabled(true);
                    setSeparation(2.4);
                    setPinLayout(false);
                  }}
                >
                  Reset to Preset
                </Button>
                <Button variant="outlined" onClick={() => setNodeSemanticMapEnabled((v) => !v)} disabled={layoutView === 'directional'}>
                  Node semantic map: {nodeSemanticMapEnabled ? 'on' : 'off'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    const cy = cyRef.current;
                    if (!cy) return;
                    const started = performance.now();
                    runLayout(cy, separation, layoutView, selectedId);
                    const runtimeMs = Math.round(performance.now() - started);
                    setLastLayoutAt(Date.now());
                    setMetrics((prev) => ({ ...prev, runtimeMs, zoom: Number(cy.zoom().toFixed(2)), ...computeGraphMetrics(cy, separation) }));
                  }}
                >
                  Rerun layout
                </Button>
              </Stack>
            ) : null}
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ position: 'absolute', right: 12, top: { xs: 270, md: 12 }, zIndex: 5, width: { xs: 'calc(100% - 24px)', md: 360 }, maxHeight: { xs: 280, md: viewportHeight - 24 }, overflow: 'auto' }}>
          <CardContent sx={{ py: 1.25 }}>
            <Typography variant="h6" gutterBottom>Node details</Typography>
            {!selectedNode ? (
              <Typography color="text.secondary">Click a node to inspect details.</Typography>
            ) : (
              <Stack spacing={1}>
                <Typography variant="subtitle1">{String(selectedNode.label ?? selectedNode.id)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {String(selectedNode.id)}
                </Typography>
                {expanded ? (
                  <Typography variant="body2">Full entity payload keys: {Object.keys(selectedNode).join(', ') || 'none'}</Typography>
                ) : (
                  <Typography variant="body2">Compact summary mode is active.</Typography>
                )}
                <Button size="small" onClick={() => setExpanded((value) => !value)}>
                  {expanded ? 'Collapse' : 'Expand details'}
                </Button>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    onClick={() => {
                      if (!selectedId) return;
                      setSeedId(selectedId);
                      setDepth(1);
                    }}
                  >
                    Set as root
                  </Button>
                  <Button
                    size="small"
                    onClick={() => {
                      if (!selectedId) return;
                      setSeedId(selectedId);
                      setDepth(1);
                      setData({ nodes: [], edges: [] });
                    }}
                  >
                    Expand neighbors
                  </Button>
                  <Button
                    size="small"
                    onClick={() => {
                      if (!selectedId) return;
                      setCollapsedRoots((prev) =>
                        prev.includes(selectedId) ? prev.filter((item) => item !== selectedId) : [...prev, selectedId],
                      );
                    }}
                  >
                    Collapse branch
                  </Button>
                </Stack>
                <Typography variant="subtitle2" sx={{ mt: 1 }}>
                  Clusters ({viewMode})
                </Typography>
                {sortedClusters.length === 0 ? (
                  <Typography color="text.secondary">No inferred clusters for this node.</Typography>
                ) : (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {sortedClusters.map((cluster) => (
                      <Chip key={`${cluster.type}-${cluster.value}`} label={`${cluster.value} (${cluster.weight})`} variant="outlined" />
                    ))}
                  </Stack>
                )}
                <Typography variant="subtitle2" sx={{ mt: 1 }}>
                  Relation details
                </Typography>
                <Stack spacing={0.5}>
                  {data.edges
                    .filter((edge) => String(edge.subject) === selectedId || String(edge.object) === selectedId)
                    .slice(0, 6)
                    .map((edge) => (
                      <Typography key={String(edge.id ?? `${edge.subject}-${edge.object}-${edge.predicate}`)} variant="caption">
                        {String(edge.subject)} {String(edge.predicate)} {String(edge.object)} | source:{' '}
                        {String(((edge.extensions as { psellos?: { source?: string } } | undefined)?.psellos?.source ?? 'unknown'))}
                      </Typography>
                    ))}
                </Stack>
                <Typography variant="subtitle2" sx={{ mt: 1 }}>
                  Graph diagnostics
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Nodes: {metrics.nodes} | Edges: {metrics.edges} | Avg degree: {metrics.avgDegree.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Dense pairs: {metrics.densePairs} | Zoom: {metrics.zoom.toFixed(2)} | Layout runtime: {metrics.runtimeMs}ms
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Last layout: {lastLayoutAt ? new Date(lastLayoutAt).toLocaleTimeString() : 'not yet'}
                </Typography>
              </Stack>
            )}
          </CardContent>
        </Card>
      </Box>
    </Stack>
  );
}

function applyGraph(
  cy: cytoscape.Core,
  graph: GraphPayload,
  selectedId: string,
  timeFrom: number,
  timeTo: number,
  collapsedRoots: string[],
  nodeSemanticMapEnabled: boolean,
  layoutView: LayoutView,
) {
  const nodeCount = graph.nodes.length;
  const denseGraph = nodeCount > 20;
  const veryDenseGraph = nodeCount > 45;
  const ultraDenseGraph = nodeCount > 80;
  const baseNodeSize = Math.max(7, Math.min(14, 22 - Math.log2(nodeCount + 1) * 3));
  const edgeLabelEnabled = nodeCount <= 18;
  const focusIds = new Set<string>();
  if (selectedId) {
    focusIds.add(selectedId);
    const prioritizedEdges = [...graph.edges]
      .sort((left, right) => readConfidence(right) - readConfidence(left))
      .slice(0, 8);
    prioritizedEdges.forEach((edge) => {
      const subject = String(edge.subject ?? '');
      const object = String(edge.object ?? '');
      if (subject === selectedId && object) focusIds.add(object);
      if (object === selectedId && subject) focusIds.add(subject);
    });
  }
  const focusNeighborBudget = veryDenseGraph ? 6 : 10;
  if (focusIds.size > focusNeighborBudget + 1 && selectedId) {
    const keep = new Set<string>([selectedId]);
    let kept = 0;
    for (const value of focusIds) {
      if (value === selectedId) continue;
      keep.add(value);
      kept += 1;
      if (kept >= focusNeighborBudget) break;
    }
    focusIds.clear();
    keep.forEach((value) => focusIds.add(value));
  }
  const edges = graph.edges.filter((edge) => {
    if (collapsedRoots.includes(String(edge.subject ?? ''))) {
      return false;
    }
    const year = extractEdgeYear(edge);
    if (year === null) {
      return true;
    }
    return year >= timeFrom && year <= timeTo;
  });
  cy.elements().remove();
  cy.add([
    ...graph.nodes.map((node) => ({
      data: {
        id: String(node.id),
        fullLabel: String(node.label ?? node.id ?? 'unknown'),
        nodeLabel: ultraDenseGraph
          ? ''
          : denseGraph && !focusIds.has(String(node.id))
            ? ''
            : String(node.label ?? node.id ?? 'unknown'),
        entityType: String(node.entity_type ?? 'unknown').toLowerCase(),
        nodeColor: nodeSemanticMapEnabled ? entityColor(String(node.entity_type ?? 'unknown').toLowerCase()) : '#1976d2',
        nodeShape:
          layoutView === 'directional'
            ? 'round-rectangle'
            : nodeSemanticMapEnabled
              ? entityShape(String(node.entity_type ?? 'unknown').toLowerCase())
              : 'ellipse',
        haloColor: nodeSemanticMapEnabled ? entityHaloColor(String(node.entity_type ?? 'unknown').toLowerCase()) : '#b45309',
        nodeSize: ultraDenseGraph ? Math.max(6, baseNodeSize - 1.5) : baseNodeSize,
        nodeTextMaxWidth: ultraDenseGraph ? 56 : veryDenseGraph ? 64 : 90,
      },
      classes: 'node-view-node',
    })),
    ...edges.map((edge) => ({
      data: {
        id: String(edge.id ?? `${edge.subject}-${edge.object}-${edge.predicate}`),
        source: String(edge.subject ?? ''),
        target: String(edge.object ?? ''),
        label: edgeLabelEnabled ? String(edge.predicate ?? 'related_to') : '',
        relationType: String(edge.predicate ?? 'related_to').toLowerCase(),
        edgeColor: relationColor(String(edge.predicate ?? 'related_to').toLowerCase()),
        edgeLineStyle: relationLineStyle(String(edge.predicate ?? 'related_to').toLowerCase()),
        confidence: readConfidence(edge),
      },
      classes: readConfidence(edge) < 0.45 ? 'ambiguous-edge' : '',
    })),
  ]);
  cy.nodes().removeClass('selected-node');
  if (selectedId) cy.getElementById(selectedId).addClass('selected-node');
}

function runLayout(cy: cytoscape.Core, separation: number, layoutView: LayoutView, seedId: string) {
  if (layoutView === 'directional') {
    cy.layout({
      name: 'breadthfirst',
      directed: true,
      animate: false,
      fit: false,
      padding: Math.round(36 + separation * 14),
      spacingFactor: Math.max(1.15, separation * 0.82),
      roots: seedId ? [`#${seedId}`] : undefined,
    }).run();
    resolveNodeOverlaps(cy, separation);
    cy.fit(undefined, Math.round(36 + separation * 10));
    return;
  }
  const nodeCount = cy.nodes().length;
  const edgeCount = cy.edges().length;
  const params = computeDensityAdaptiveLayout(nodeCount, edgeCount, separation);
  const attempts = nodeCount <= 120 ? 3 : 1;
  let bestPositions: Map<string, { x: number; y: number }> | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    cy.layout({
      name: 'cose',
      animate: false,
      randomize: attempt > 0,
      fit: false,
      nodeDimensionsIncludeLabels: true,
      nodeOverlap: params.nodeOverlap,
      componentSpacing: params.componentSpacing,
      idealEdgeLength: params.idealEdgeLength,
      nodeRepulsion: params.nodeRepulsion,
      gravity: params.gravity,
      padding: params.padding,
    }).run();

    const crossings = estimateEdgeCrossings(cy);
    const densePairs = computeGraphMetrics(cy, separation).densePairs;
    const score = crossings * 10 + densePairs;
    if (score < bestScore) {
      bestScore = score;
      bestPositions = new Map(cy.nodes().map((node) => [String(node.id()), { x: node.position('x'), y: node.position('y') }]));
    }
  }

  if (bestPositions) {
    cy.nodes().forEach((node) => {
      const pos = bestPositions?.get(String(node.id()));
      if (pos) node.position(pos);
    });
  }
  resolveNodeOverlaps(cy, separation);
  cy.fit(undefined, Math.round(30 + separation * 10));
}

function computeDensityAdaptiveLayout(nodeCount: number, edgeCount: number, separation: number) {
  const maxEdges = nodeCount > 1 ? (nodeCount * (nodeCount - 1)) / 2 : 1;
  const graphDensity = Math.max(0, Math.min(1, edgeCount / maxEdges));
  const complexity = Math.min(3, 1 + nodeCount / 30 + graphDensity * 2.2);
  return {
    nodeOverlap: Math.round(20 + separation * 5 + graphDensity * 22),
    componentSpacing: Math.round(72 + separation * 16 + graphDensity * 90),
    idealEdgeLength: Math.round((92 + separation * 42) * complexity),
    nodeRepulsion: Math.round((7000 + separation * 5200) * complexity * (1 + graphDensity * 0.8)),
    gravity: Math.max(0.2, 0.9 - graphDensity * 0.45),
    padding: Math.round(28 + separation * 12 + graphDensity * 20),
  };
}

function estimateEdgeCrossings(cy: cytoscape.Core): number {
  const edges = cy.edges().toArray();
  let crossings = 0;
  for (let i = 0; i < edges.length; i += 1) {
    const a = edges[i];
    const aSource = a.source();
    const aTarget = a.target();
    const ax1 = aSource.position('x');
    const ay1 = aSource.position('y');
    const ax2 = aTarget.position('x');
    const ay2 = aTarget.position('y');
    for (let j = i + 1; j < edges.length; j += 1) {
      const b = edges[j];
      const bSource = b.source();
      const bTarget = b.target();
      if (
        aSource.id() === bSource.id() ||
        aSource.id() === bTarget.id() ||
        aTarget.id() === bSource.id() ||
        aTarget.id() === bTarget.id()
      ) {
        continue;
      }
      const bx1 = bSource.position('x');
      const by1 = bSource.position('y');
      const bx2 = bTarget.position('x');
      const by2 = bTarget.position('y');
      if (segmentsIntersect(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2)) crossings += 1;
    }
  }
  return crossings;
}

function segmentsIntersect(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  dx: number,
  dy: number,
): boolean {
  const o1 = orientation(ax, ay, bx, by, cx, cy);
  const o2 = orientation(ax, ay, bx, by, dx, dy);
  const o3 = orientation(cx, cy, dx, dy, ax, ay);
  const o4 = orientation(cx, cy, dx, dy, bx, by);
  return o1 !== o2 && o3 !== o4;
}

function orientation(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number {
  return Math.sign((by - ay) * (cx - bx) - (bx - ax) * (cy - by));
}

function resolveNodeOverlaps(cy: cytoscape.Core, separation: number) {
  const nodes = cy.nodes();
  if (nodes.length < 2) return;
  const minDistance = Math.max(20, separation * 20);
  const passes = nodes.length > 80 ? 7 : nodes.length > 40 ? 5 : 3;
  for (let pass = 0; pass < passes; pass += 1) {
    let moved = false;
    for (let i = 0; i < nodes.length; i += 1) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j += 1) {
        const b = nodes[j];
        const dx = a.position('x') - b.position('x');
        const dy = a.position('y') - b.position('y');
        const distance = Math.hypot(dx, dy) || 0.0001;
        if (distance >= minDistance) continue;
        const overlap = (minDistance - distance) / 2;
        const ux = dx / distance;
        const uy = dy / distance;
        a.position({ x: a.position('x') + ux * overlap, y: a.position('y') + uy * overlap });
        b.position({ x: b.position('x') - ux * overlap, y: b.position('y') - uy * overlap });
        moved = true;
      }
    }
    if (!moved) break;
  }
}

function focusNode(cy: cytoscape.Core, id: string) {
  const node = cy.getElementById(id);
  if (node.empty()) return;
  cy.animate({ center: { eles: node }, duration: 250 });
}

function buildStyle(labelScale: number, confidenceOpacity: boolean, layoutView: LayoutView): any[] {
  return [
    {
      selector: 'node',
      style: {
        'background-color': 'data(nodeColor)',
        color: '#102a43',
        label: 'data(nodeLabel)',
        'font-size': `${8 * labelScale}px`,
        width: 'data(nodeSize)',
        height: 'data(nodeSize)',
        shape: 'data(nodeShape)',
        'text-wrap': 'none',
        'text-max-width': 'data(nodeTextMaxWidth)',
        'border-color': 'data(haloColor)',
        'border-width': 2,
        'min-zoomed-font-size': 9,
      },
    },
    {
      selector: 'edge',
      style: {
        width: 'mapData(confidence, 0, 1, 1.2, 3.6)',
        'line-color': 'data(edgeColor)',
        'target-arrow-color': 'data(edgeColor)',
        'target-arrow-shape': 'triangle',
        'curve-style': layoutView === 'directional' ? 'taxi' : 'bezier',
        'line-style': 'data(edgeLineStyle)',
        label: 'data(label)',
        'font-size': `${7 * labelScale}px`,
        color: '#475569',
        opacity: confidenceOpacity ? 'mapData(confidence, 0, 1, 0.35, 1)' : 1,
        'text-opacity': confidenceOpacity ? 'mapData(confidence, 0, 1, 0.45, 1)' : 1,
        'text-background-color': '#ffffff',
        'text-background-opacity': 0.8,
        'min-zoomed-font-size': 10,
      },
    },
    { selector: '.selected-node', style: { 'background-color': '#f59e0b', 'border-width': 2, 'border-color': '#b45309' } },
    { selector: '.ambiguous-edge', style: { 'line-style': 'dashed', 'line-color': '#dc2626', 'target-arrow-color': '#dc2626' } },
    { selector: '.focus-path', style: { 'line-color': '#ea580c', width: 4, 'target-arrow-color': '#ea580c' } },
  ];
}

function computeGraphMetrics(cy: cytoscape.Core, separation: number): {
  nodes: number;
  edges: number;
  avgDegree: number;
  densePairs: number;
} {
  const nodes = cy.nodes();
  const edges = cy.edges();
  const nodeCount = nodes.length;
  const edgeCount = edges.length;
  const avgDegree = nodeCount === 0 ? 0 : (edgeCount * 2) / nodeCount;
  let densePairs = 0;
  const threshold = Math.max(36, separation * 22);
  for (let i = 0; i < nodeCount; i += 1) {
    const a = nodes[i];
    for (let j = i + 1; j < nodeCount; j += 1) {
      const b = nodes[j];
      const dx = a.position('x') - b.position('x');
      const dy = a.position('y') - b.position('y');
      if (Math.hypot(dx, dy) < threshold) densePairs += 1;
    }
  }
  return { nodes: nodeCount, edges: edgeCount, avgDegree, densePairs };
}

function buildRelationFilter(base: string, include: string[], exclude: string[]): string {
  const values = [
    ...String(base ?? '')
      .split(',')
      .map((token) => token.trim())
      .filter(Boolean),
    ...include,
    ...exclude.map((token) => `!${token}`),
  ];
  return Array.from(new Set(values)).join(',');
}

function readConfidence(edge: Record<string, unknown>): number {
  const value = (edge.extensions as { psellos?: { confidence?: number } } | undefined)?.psellos?.confidence;
  return typeof value === 'number' ? Math.max(0, Math.min(1, value)) : 0.5;
}

function entityColor(entityType: string): string {
  if (entityType === 'person') return '#2563eb';
  if (entityType === 'place') return '#059669';
  if (entityType === 'organization') return '#7c3aed';
  return '#475569';
}

function entityShape(entityType: string): string {
  if (entityType === 'person') return 'ellipse';
  if (entityType === 'place') return 'diamond';
  if (entityType === 'organization') return 'round-rectangle';
  return 'ellipse';
}

function entityHaloColor(entityType: string): string {
  if (entityType === 'person') return '#0f172a';
  if (entityType === 'place') return '#0f766e';
  if (entityType === 'organization') return '#4c1d95';
  return '#334155';
}

function relationColor(relationType: string): string {
  if (relationType.includes('parent') || relationType.includes('child')) return '#7c3aed';
  if (relationType.includes('spouse')) return '#db2777';
  if (relationType.includes('mentor')) return '#0f766e';
  if (relationType.includes('work') || relationType.includes('office')) return '#0369a1';
  return '#6b7280';
}

function relationLineStyle(relationType: string): string {
  if (relationType.includes('spouse')) return 'dashed';
  if (relationType.includes('mentor')) return 'dotted';
  return 'solid';
}

function extractEdgeYear(edge: Record<string, unknown>): number | null {
  const direct = String(edge.date ?? '');
  const ext = String((edge.extensions as { psellos?: { date?: string } } | undefined)?.psellos?.date ?? '');
  const raw = direct || ext;
  const match = raw.match(/(\d{3,4})/);
  if (!match) return null;
  return Number(match[1]);
}

function applyPathHighlight(cy: cytoscape.Core, from: string, to: string) {
  cy.edges().removeClass('focus-path');
  if (!from || !to) return;
  const frontier = [from];
  const prev = new Map<string, { parent: string; edgeId: string }>();
  const visited = new Set<string>([from]);
  while (frontier.length > 0) {
    const current = frontier.shift() as string;
    if (current === to) break;
    cy.edges().forEach((edge) => {
      const source = String(edge.data('source'));
      const target = String(edge.data('target'));
      const next = source === current ? target : target === current ? source : '';
      if (!next || visited.has(next)) return;
      visited.add(next);
      prev.set(next, { parent: current, edgeId: String(edge.id()) });
      frontier.push(next);
    });
  }
  if (!prev.has(to)) return;
  let cursor = to;
  while (cursor !== from) {
    const step = prev.get(cursor);
    if (!step) break;
    cy.getElementById(step.edgeId).addClass('focus-path');
    cursor = step.parent;
  }
}

export function mergeGraphData(previous: GraphPayload, incoming: GraphPayload): GraphPayload {
  const nodeMap = new Map<string, Record<string, unknown>>();
  const edgeMap = new Map<string, Record<string, unknown>>();
  previous.nodes.forEach((node) => nodeMap.set(String(node.id), node));
  incoming.nodes.forEach((node) => nodeMap.set(String(node.id), { ...nodeMap.get(String(node.id)), ...node }));
  previous.edges.forEach((edge) => edgeMap.set(String(edge.id ?? `${edge.subject}-${edge.object}-${edge.predicate}`), edge));
  incoming.edges.forEach((edge) => edgeMap.set(String(edge.id ?? `${edge.subject}-${edge.object}-${edge.predicate}`), edge));
  return { nodes: Array.from(nodeMap.values()), edges: Array.from(edgeMap.values()) };
}

export function inferClusters(
  nodes: Array<Record<string, unknown>>,
  edges: Array<Record<string, unknown>>,
  viewMode: ViewMode,
): Map<string, Array<{ type: string; value: string; weight: number; confidence: number }>> {
  const byNode = new Map<string, Array<{ type: string; value: string; weight: number; confidence: number }>>();
  const keyword = viewMode === 'dynasty' ? ['family', 'dynasty', 'parent', 'child'] : ['work', 'office', 'mentor', 'guild'];
  edges.forEach((edge) => {
    const rel = String(edge.predicate ?? '').toLowerCase();
    if (!keyword.some((token) => rel.includes(token))) return;
    const source = String(edge.subject ?? '');
    const target = String(edge.object ?? '');
    const confidence = Number(((edge.extensions as { psellos?: { confidence?: number } } | undefined)?.psellos?.confidence ?? 0.5) as number);
    [source, target].forEach((id) => {
      if (!id) return;
      const existing = byNode.get(id) ?? [];
      const hit = existing.find((item) => item.value === rel);
      if (hit) {
        hit.weight += 1;
        hit.confidence = Math.max(hit.confidence, confidence);
      } else {
        existing.push({ type: viewMode, value: rel, weight: 1, confidence });
      }
      byNode.set(id, existing);
    });
  });
  nodes.forEach((node) => {
    const id = String(node.id ?? '');
    if (!id || byNode.has(id)) return;
    byNode.set(id, []);
  });
  return byNode;
}
