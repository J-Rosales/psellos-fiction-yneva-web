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
  Stack,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from '@tanstack/react-router';
import cytoscape from 'cytoscape';
import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchGraphNeighborhood } from '../api/client';
import { parseCoreFilters } from '../routing/coreFilters';

type ViewMode = 'dynasty' | 'workplace';
type ClusterPrecedence = 'confidence' | 'size';

export function GraphRouteView() {
  const location = useLocation();
  const filters = useMemo(() => parseCoreFilters(window.location.search), [location.href]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [depth, setDepth] = useState(2);
  const [viewMode, setViewMode] = useState<ViewMode>('dynasty');
  const [clusterPrecedence, setClusterPrecedence] = useState<ClusterPrecedence>('confidence');
  const [expanded, setExpanded] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  const query = useQuery({
    queryKey: ['graph', filters.layer, filters.rel_type, selectedId, depth],
    queryFn: () =>
      fetchGraphNeighborhood({
        entityId: selectedId || undefined,
        depth,
        filters,
      }),
  });

  const clusterMap = useMemo(() => inferClusters(query.data?.nodes ?? [], query.data?.edges ?? [], viewMode), [
    query.data?.nodes,
    query.data?.edges,
    viewMode,
  ]);

  useEffect(() => {
    if (!containerRef.current || !query.data) {
      return;
    }
    cyRef.current?.destroy();
    const elements = [
      ...query.data.nodes.map((node) => ({
        data: { id: String(node.id), label: String(node.label ?? node.id ?? 'unknown') },
      })),
      ...query.data.edges.map((edge) => ({
        data: {
          id: String(edge.id ?? `${edge.subject}-${edge.object}-${edge.predicate}`),
          source: String(edge.subject ?? ''),
          target: String(edge.object ?? ''),
          label: String(edge.predicate ?? 'related_to'),
        },
      })),
    ];
    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#1976d2',
            color: '#102a43',
            label: 'data(label)',
            'font-size': 10,
            width: 16,
            height: 16,
          },
        },
        {
          selector: 'edge',
          style: {
            width: 1.5,
            'line-color': '#6b7280',
            'target-arrow-color': '#6b7280',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            label: 'data(label)',
            'font-size': 8,
            color: '#475569',
            'text-background-color': '#ffffff',
            'text-background-opacity': 0.8,
          },
        },
        {
          selector: '.selected-node',
          style: {
            'background-color': '#f59e0b',
          },
        },
      ],
      layout: {
        name: 'cose',
        animate: false,
      },
    });

    cy.on('tap', 'node', (event) => {
      const id = String(event.target.id());
      setExpanded(false);
      setSelectedId(id);
      cy.nodes().removeClass('selected-node');
      event.target.addClass('selected-node');
    });

    cyRef.current = cy;
    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [query.data]);

  if (query.isLoading) {
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
  if (query.isError) {
    return <Alert severity="error">Graph query failed: {query.error.message}</Alert>;
  }
  if (!query.data) {
    return <Alert severity="error">Graph query returned no payload.</Alert>;
  }

  const selectedNode = query.data.nodes.find((node) => String(node.id) === selectedId) ?? null;
  const selectedClusters = selectedId ? clusterMap.get(selectedId) ?? [] : [];
  const sortedClusters = [...selectedClusters].sort((a, b) =>
    clusterPrecedence === 'size' ? b.weight - a.weight : b.confidence - a.confidence,
  );

  return (
    <Stack spacing={2}>
      {query.data.meta.warnings?.length ? <Alert severity="warning">{query.data.meta.warnings.join(' ')}</Alert> : null}
      <Card>
        <CardContent>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="h5">Graph</Typography>
            <Chip label={`Depth ${depth}`} />
            <Chip label={`View ${viewMode}`} />
            <Button variant="outlined" onClick={() => setDepth((value) => Math.min(value + 1, 5))}>
              Expand (+1 depth)
            </Button>
            <FormControl size="small" sx={{ minWidth: 170 }}>
              <InputLabel id="graph-view-mode-label">View mode</InputLabel>
              <Select
                labelId="graph-view-mode-label"
                label="View mode"
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
            {showAdvanced ? (
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
            ) : null}
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 340px' }, gap: 2 }}>
        <Card>
          <CardContent>
            <Box ref={containerRef} sx={{ width: '100%', height: 620, border: '1px solid #e5e7eb', borderRadius: 1 }} />
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
                  <Typography variant="body2">
                    Full entity payload keys: {Object.keys(selectedNode).join(', ') || 'none'}
                  </Typography>
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
                      <Chip
                        key={`${cluster.type}-${cluster.value}`}
                        label={`${cluster.value} (${cluster.weight})`}
                        variant="outlined"
                      />
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

export function inferClusters(
  nodes: Array<Record<string, unknown>>,
  edges: Array<Record<string, unknown>>,
  viewMode: ViewMode,
): Map<string, Array<{ type: string; value: string; weight: number; confidence: number }>> {
  const byNode = new Map<string, Array<{ type: string; value: string; weight: number; confidence: number }>>();
  const keyword = viewMode === 'dynasty' ? ['family', 'dynasty', 'parent', 'child'] : ['work', 'office', 'mentor', 'guild'];
  edges.forEach((edge) => {
    const rel = String(edge.predicate ?? '').toLowerCase();
    if (!keyword.some((token) => rel.includes(token))) {
      return;
    }
    const source = String(edge.subject ?? '');
    const target = String(edge.object ?? '');
    const clusterValue = rel;
    const confidence = Number(
      ((edge.extensions as { psellos?: { confidence?: number } } | undefined)?.psellos?.confidence ?? 0.5) as number,
    );

    [source, target].forEach((id) => {
      if (!id) return;
      const existing = byNode.get(id) ?? [];
      const hit = existing.find((item) => item.value === clusterValue);
      if (hit) {
        hit.weight += 1;
        hit.confidence = Math.max(hit.confidence, confidence);
      } else {
        existing.push({ type: viewMode, value: clusterValue, weight: 1, confidence });
      }
      byNode.set(id, existing);
    });
  });
  nodes.forEach((node) => {
    const id = String(node.id ?? '');
    if (!id || byNode.has(id)) {
      return;
    }
    byNode.set(id, []);
  });
  return byNode;
}
