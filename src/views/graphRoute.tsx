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
type StructureMode = 'node' | 'hierarchical';

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
  const [structureMode, setStructureMode] = useState<StructureMode>((search.get('g_mode') as StructureMode) || 'node');
  const [expanded, setExpanded] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [labelScale, setLabelScale] = useState(1);
  const [data, setData] = useState<GraphPayload>({ nodes: [], edges: [] });
  const [pathFrom, setPathFrom] = useState('');
  const [pathTo, setPathTo] = useState('');
  const [jumpTo, setJumpTo] = useState('');
  const [includeRelations, setIncludeRelations] = useState<string[]>([]);
  const [excludeRelations, setExcludeRelations] = useState<string[]>([]);
  const [confidenceOpacity, setConfidenceOpacity] = useState(true);
  const [timeFrom, setTimeFrom] = useState(0);
  const [timeTo, setTimeTo] = useState(3000);
  const [rootId, setRootId] = useState('');
  const [collapsedRoots, setCollapsedRoots] = useState<string[]>([]);
  const [nodeSemanticMapEnabled, setNodeSemanticMapEnabled] = useState(true);
  const [pinLayout, setPinLayout] = useState(false);
  const [lastLayoutAt, setLastLayoutAt] = useState(0);
  const [focusHistory, setFocusHistory] = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const previousGraphContextRef = useRef('');
  const [viewportHeight, setViewportHeight] = useState(620);
  const [metrics, setMetrics] = useState<{
    nodes: number;
    edges: number;
    avgDegree: number;
    densePairs: number;
    runtimeMs: number;
    zoom: number;
  }>({ nodes: 0, edges: 0, avgDegree: 0, densePairs: 0, runtimeMs: 0, zoom: 1 });

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
    params.set('g_mode', structureMode);
    params.set('g_depth', String(depth));
    if (resolvedSeedId || activeSeed) params.set('entity_id', resolvedSeedId || activeSeed);
    navigate({ to: '/graph', search: Object.fromEntries(params.entries()), replace: true });
  }, [navigate, structureMode, depth, activeSeed, resolvedSeedId]);

  useEffect(() => {
    const q = filters.q.trim();
    if (!q || q === seedId) return;
    setSeedId(q);
    setSelectedId(q);
    setDepth(1);
    setData({ nodes: [], edges: [] });
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
  }, [query.data, filters.layer, relTypeFilter, activeSeed]);

  useEffect(() => {
    if (!containerRef.current || cyRef.current) return;
    const cy = cytoscape({
      container: containerRef.current,
      elements: [],
      style: buildStyle(structureMode, labelScale, confidenceOpacity) as any,
      layout: { name: 'grid', animate: false },
    });
    cy.on('tap', 'node', (event) => {
      const id = String(event.target.id());
      setExpanded(false);
      setFocusHistory((prev) => (selectedId ? [...prev.slice(-11), selectedId] : prev));
      setSelectedId(id);
      focusNode(cy, id);
    });
    cy.on('zoom', () => {
      if (cy.zoom() < 0.7) {
        cy.nodes().style('font-size', 0);
        cy.edges().style('font-size', 0);
      } else {
        cy.nodes().style('font-size', `${10 * labelScale}px`);
        cy.edges().style('font-size', `${8 * labelScale}px`);
      }
    });
    cyRef.current = cy;
    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [structureMode, labelScale, confidenceOpacity]);

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
    cy.style(buildStyle(structureMode, labelScale, confidenceOpacity) as any);
  }, [structureMode, labelScale, confidenceOpacity]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    applyGraph(cy, data, selectedId, structureMode, timeFrom, timeTo, collapsedRoots, nodeSemanticMapEnabled);
    setMetrics((prev) => ({ ...prev, ...computeGraphMetrics(cy, separation) }));
  }, [data, selectedId, structureMode, timeFrom, timeTo, collapsedRoots, nodeSemanticMapEnabled, separation]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || pinLayout) return;
    const started = performance.now();
    runLayout(cy, structureMode, rootId || selectedId, separation);
    const runtimeMs = Math.round(performance.now() - started);
    setLastLayoutAt(Date.now());
    setMetrics((prev) => ({ ...prev, runtimeMs, zoom: Number(cy.zoom().toFixed(2)), ...computeGraphMetrics(cy, separation) }));
  }, [structureMode, separation, rootId, selectedId, data, pinLayout]);

  const clusterMap = useMemo(() => inferClusters(data.nodes, data.edges, viewMode), [data.nodes, data.edges, viewMode]);
  const relationTypes = useMemo(() => {
    const set = new Set<string>();
    data.edges.forEach((edge) => set.add(String(edge.predicate ?? 'related_to')));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [data.edges]);

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
  if (!activeSeed) {
    return (
      <Alert severity="info">
        Search a person first (from the global search strip) to load a graph neighborhood.
      </Alert>
    );
  }
  if (!resolvedSeedId && !seedResolutionQuery.isLoading) {
    return (
      <Alert severity="warning">
        No matching entity was found for "{activeSeed}". Try a different search string or use entity ID.
      </Alert>
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
                <Chip label={structureMode === 'node' ? 'Node View' : 'Hierarchical View'} />
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
                <FormControl size="small" sx={{ minWidth: 185 }}>
                  <InputLabel id="graph-structure-mode-label">Structure mode</InputLabel>
                  <Select
                    labelId="graph-structure-mode-label"
                    label="Structure mode"
                    value={structureMode}
                    onChange={(event) => setStructureMode(event.target.value as StructureMode)}
                  >
                    <MenuItem value="node">Node View</MenuItem>
                    <MenuItem value="hierarchical">Hierarchical View</MenuItem>
                  </Select>
                </FormControl>
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
                    const payload = { selected_id: selectedId || null, mode: structureMode, data };
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
                  <Chip
                    key={rel}
                    label={excluded ? `!${rel}` : rel}
                    color={included ? 'primary' : excluded ? 'warning' : 'default'}
                    variant="outlined"
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
                    onDelete={() => {
                      setIncludeRelations((prev) => prev.filter((item) => item !== rel));
                      setExcludeRelations((prev) => prev.filter((item) => item !== rel));
                    }}
                  />
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
                <Button variant="outlined" onClick={() => setNodeSemanticMapEnabled((v) => !v)}>
                  Node semantic map: {nodeSemanticMapEnabled ? 'on' : 'off'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    const cy = cyRef.current;
                    if (!cy) return;
                    const started = performance.now();
                    runLayout(cy, structureMode, rootId || selectedId, separation);
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
                      setRootId(selectedId);
                      setStructureMode('hierarchical');
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
  mode: StructureMode,
  timeFrom: number,
  timeTo: number,
  collapsedRoots: string[],
  nodeSemanticMapEnabled: boolean,
) {
  const generationById = mode === 'hierarchical' ? computeGenerations(graph.edges, rootIdFromState(selectedId, graph)) : new Map<string, number>();
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
        label:
          mode === 'hierarchical'
            ? `L${generationById.get(String(node.id)) ?? 0} ${String(node.label ?? node.id ?? 'unknown')}`
            : String(node.label ?? node.id ?? 'unknown'),
        entityType: String(node.entity_type ?? 'unknown').toLowerCase(),
        nodeColor: nodeSemanticMapEnabled ? entityColor(String(node.entity_type ?? 'unknown').toLowerCase()) : '#1976d2',
        nodeShape: nodeSemanticMapEnabled ? entityShape(String(node.entity_type ?? 'unknown').toLowerCase()) : 'ellipse',
        haloColor: nodeSemanticMapEnabled ? entityHaloColor(String(node.entity_type ?? 'unknown').toLowerCase()) : '#b45309',
      },
      classes: mode === 'hierarchical' ? 'hier-node' : 'node-view-node',
    })),
    ...edges.map((edge) => ({
      data: {
        id: String(edge.id ?? `${edge.subject}-${edge.object}-${edge.predicate}`),
        source: String(edge.subject ?? ''),
        target: String(edge.object ?? ''),
        label: String(edge.predicate ?? 'related_to'),
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

function runLayout(cy: cytoscape.Core, mode: StructureMode, rootId: string, separation: number) {
  if (mode === 'hierarchical') {
    cy.layout({
      name: 'breadthfirst',
      directed: true,
      roots: rootId ? [`#${rootId}`] : undefined,
      spacingFactor: Math.max(1.1, separation * 1.2),
      animate: false,
    }).run();
    cy.fit(undefined, Math.round(30 + separation * 10));
    return;
  }
  cy.layout({
    name: 'cose',
    animate: false,
    idealEdgeLength: 120 + 45 * separation,
    nodeRepulsion: 7000 + 5000 * separation,
    padding: Math.round(24 + separation * 10),
  }).run();
  cy.fit(undefined, Math.round(30 + separation * 10));
}

function focusNode(cy: cytoscape.Core, id: string) {
  const node = cy.getElementById(id);
  if (node.empty()) return;
  cy.animate({ center: { eles: node }, duration: 250 });
}

function buildStyle(mode: StructureMode, labelScale: number, confidenceOpacity: boolean): any[] {
  return [
    {
      selector: 'node',
      style: {
        'background-color': 'data(nodeColor)',
        color: '#102a43',
        label: 'data(label)',
        'font-size': `${10 * labelScale}px`,
        width: mode === 'hierarchical' ? 82 : 16,
        height: mode === 'hierarchical' ? 32 : 16,
        shape: mode === 'hierarchical' ? 'round-rectangle' : 'data(nodeShape)',
        'text-wrap': mode === 'hierarchical' ? 'wrap' : 'none',
        'text-max-width': mode === 'hierarchical' ? 110 : 80,
        'border-color': 'data(haloColor)',
        'border-width': 2,
        'min-zoomed-font-size': 8,
      },
    },
    {
      selector: 'edge',
      style: {
        width: 'mapData(confidence, 0, 1, 1.2, 3.6)',
        'line-color': 'data(edgeColor)',
        'target-arrow-color': 'data(edgeColor)',
        'target-arrow-shape': 'triangle',
        'curve-style': mode === 'hierarchical' ? 'taxi' : 'bezier',
        'line-style': 'data(edgeLineStyle)',
        label: 'data(label)',
        'font-size': `${8 * labelScale}px`,
        color: '#475569',
        opacity: confidenceOpacity ? 'mapData(confidence, 0, 1, 0.35, 1)' : 1,
        'text-opacity': confidenceOpacity ? 'mapData(confidence, 0, 1, 0.45, 1)' : 1,
        'text-background-color': '#ffffff',
        'text-background-opacity': 0.8,
        'min-zoomed-font-size': 8,
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

function rootIdFromState(selectedId: string, graph: GraphPayload): string {
  if (selectedId) return selectedId;
  const first = graph.nodes[0];
  return first ? String(first.id ?? '') : '';
}

function computeGenerations(
  edges: Array<Record<string, unknown>>,
  rootId: string,
): Map<string, number> {
  const levels = new Map<string, number>();
  if (!rootId) return levels;
  const adjacency = new Map<string, string[]>();
  edges.forEach((edge) => {
    const source = String(edge.subject ?? '');
    const target = String(edge.object ?? '');
    if (!source || !target) return;
    adjacency.set(source, [...(adjacency.get(source) ?? []), target]);
    adjacency.set(target, [...(adjacency.get(target) ?? []), source]);
  });
  const queue: Array<{ id: string; level: number }> = [{ id: rootId, level: 0 }];
  const visited = new Set<string>();
  while (queue.length > 0) {
    const current = queue.shift() as { id: string; level: number };
    if (visited.has(current.id)) continue;
    visited.add(current.id);
    levels.set(current.id, current.level);
    const next = adjacency.get(current.id) ?? [];
    next.forEach((id) => {
      if (!visited.has(id)) queue.push({ id, level: current.level + 1 });
    });
  }
  return levels;
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
