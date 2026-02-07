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
import { fetchGraphNeighborhood } from '../api/client';
import { parseCoreFilters } from '../routing/coreFilters';

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

  const [selectedId, setSelectedId] = useState<string>(search.get('entity_id') ?? '');
  const [depth, setDepth] = useState(Number(search.get('g_depth') ?? 2) || 2);
  const [viewMode, setViewMode] = useState<ViewMode>('dynasty');
  const [clusterPrecedence, setClusterPrecedence] = useState<ClusterPrecedence>('confidence');
  const [structureMode, setStructureMode] = useState<StructureMode>((search.get('g_mode') as StructureMode) || 'node');
  const [expanded, setExpanded] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [labelScale, setLabelScale] = useState(1);
  const [data, setData] = useState<GraphPayload>({ nodes: [], edges: [] });
  const [pathFrom, setPathFrom] = useState('');
  const [pathTo, setPathTo] = useState('');
  const [includeRelations, setIncludeRelations] = useState<string[]>([]);
  const [excludeRelations, setExcludeRelations] = useState<string[]>([]);
  const [confidenceOpacity, setConfidenceOpacity] = useState(true);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  const relTypeFilter = useMemo(
    () => buildRelationFilter(filters.rel_type, includeRelations, excludeRelations),
    [filters.rel_type, includeRelations, excludeRelations],
  );

  const query = useQuery({
    queryKey: ['graph', filters.layer, relTypeFilter, selectedId, depth],
    queryFn: () =>
      fetchGraphNeighborhood({
        entityId: selectedId || undefined,
        depth,
        filters: { ...filters, rel_type: relTypeFilter },
      }),
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('g_mode', structureMode);
    params.set('g_depth', String(depth));
    if (selectedId) params.set('entity_id', selectedId);
    navigate({ to: '/graph', search: Object.fromEntries(params.entries()), replace: true });
  }, [navigate, structureMode, depth, selectedId]);

  useEffect(() => {
    if (!query.data) return;
    setData((prev) => mergeGraphData(prev, query.data));
  }, [query.data]);

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
    const cy = cyRef.current;
    if (!cy) return;
    cy.style(buildStyle(structureMode, labelScale, confidenceOpacity) as any);
    applyGraph(cy, data, selectedId, structureMode);
    runLayout(cy, structureMode, selectedId);
  }, [data, selectedId, structureMode, labelScale, confidenceOpacity]);

  const clusterMap = useMemo(() => inferClusters(data.nodes, data.edges, viewMode), [data.nodes, data.edges, viewMode]);
  const relationTypes = useMemo(() => {
    const set = new Set<string>();
    data.edges.forEach((edge) => set.add(String(edge.predicate ?? 'related_to')));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [data.edges]);

  if (query.isLoading && data.nodes.length === 0) {
    return (
      <Card>
        <CardContent>
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={20} />
            <Typography>Loading graph neighborhood...</Typography>
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
    <Stack spacing={2}>
      {query.data?.meta.warnings?.length ? <Alert severity="warning">{query.data.meta.warnings.join(' ')}</Alert> : null}
      <Card>
        <CardContent>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="h5">Graph</Typography>
              <Chip label={`Depth ${depth}`} />
              <Chip label={`Structure ${structureMode === 'node' ? 'Node View' : 'Hierarchical View'}`} />
              <Button variant="outlined" onClick={() => setDepth((value) => Math.min(value + 1, 5))}>
                Expand (+1 depth)
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
              <Button variant="text" onClick={() => setShowAdvanced((value) => !value)}>
                Advanced options
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
                  }}
                >
                  Reset to Preset
                </Button>
              </Stack>
            ) : null}
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 340px' }, gap: 2 }}>
        <Card>
          <CardContent>
            <Box ref={containerRef} sx={{ width: '100%', height: 620, border: '1px solid #e5e7eb', borderRadius: 1 }} />
            <Typography variant="caption" color="text.secondary">
              Topology-driven partial load is active. Use depth expansion to load more neighbors.
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Node details
            </Typography>
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
              </Stack>
            )}
          </CardContent>
        </Card>
      </Box>
    </Stack>
  );
}

function applyGraph(cy: cytoscape.Core, graph: GraphPayload, selectedId: string, mode: StructureMode) {
  cy.elements().remove();
  cy.add([
    ...graph.nodes.map((node) => ({
      data: { id: String(node.id), label: String(node.label ?? node.id ?? 'unknown') },
      classes: mode === 'hierarchical' ? 'hier-node' : 'node-view-node',
    })),
    ...graph.edges.map((edge) => ({
      data: {
        id: String(edge.id ?? `${edge.subject}-${edge.object}-${edge.predicate}`),
        source: String(edge.subject ?? ''),
        target: String(edge.object ?? ''),
        label: String(edge.predicate ?? 'related_to'),
      },
    })),
  ]);
  cy.nodes().removeClass('selected-node');
  if (selectedId) cy.getElementById(selectedId).addClass('selected-node');
}

function runLayout(cy: cytoscape.Core, mode: StructureMode, rootId: string) {
  if (mode === 'hierarchical') {
    cy.layout({
      name: 'breadthfirst',
      directed: true,
      roots: rootId ? [`#${rootId}`] : undefined,
      spacingFactor: 1.3,
      animate: false,
    }).run();
    return;
  }
  cy.layout({ name: 'cose', animate: false, idealEdgeLength: 150, nodeRepulsion: 9000, padding: 32 }).run();
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
        'background-color': '#1976d2',
        color: '#102a43',
        label: 'data(label)',
        'font-size': `${10 * labelScale}px`,
        width: mode === 'hierarchical' ? 82 : 16,
        height: mode === 'hierarchical' ? 32 : 16,
        shape: mode === 'hierarchical' ? 'round-rectangle' : 'ellipse',
        'text-wrap': mode === 'hierarchical' ? 'wrap' : 'none',
      },
    },
    {
      selector: 'edge',
      style: {
        width: 1.5,
        'line-color': '#6b7280',
        'target-arrow-color': '#6b7280',
        'target-arrow-shape': 'triangle',
        'curve-style': mode === 'hierarchical' ? 'taxi' : 'bezier',
        label: 'data(label)',
        'font-size': `${8 * labelScale}px`,
        color: '#475569',
        opacity: confidenceOpacity ? 0.75 : 1,
        'text-background-color': '#ffffff',
        'text-background-opacity': 0.8,
      },
    },
    { selector: '.selected-node', style: { 'background-color': '#f59e0b', 'border-width': 2, 'border-color': '#b45309' } },
    { selector: '.focus-path', style: { 'line-color': '#ea580c', width: 4, 'target-arrow-color': '#ea580c' } },
  ];
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
