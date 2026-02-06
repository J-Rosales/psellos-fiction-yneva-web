import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import { Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import {
  filterLabel,
  getIncompatiblePinnedKeys,
  getSupportedKeysForPath,
  hasActiveFilters,
  parseCoreFilters,
  toSearchObject,
  toSearchParamsForPath,
  type CoreFilterKey,
} from './routing/coreFilters';
import { DEFAULT_CORE_FILTERS, type CoreFilters, useFilterPinStore } from './state/filterPinStore';

interface RouteNavEntry {
  path: string;
  label: string;
}

const ROUTES: RouteNavEntry[] = [
  { path: '/', label: 'Overview' },
  { path: '/entities', label: 'Entities' },
  { path: '/entity/sample', label: 'Entity Detail' },
  { path: '/graph', label: 'Graph' },
  { path: '/map', label: 'Map' },
  { path: '/layers', label: 'Layers' },
  { path: '/search', label: 'Search' },
  { path: '/diagnostics', label: 'Diagnostics' },
];

const MAJOR_ROUTES = new Set(['/entities', '/entity/sample', '/graph', '/map', '/layers', '/search', '/diagnostics']);

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const appliedFilters = useMemo(() => parseCoreFilters(window.location.search), [location.href]);

  const pinned = useFilterPinStore((state) => state.pinned);
  const pinnedFilters = useFilterPinStore((state) => state.pinnedFilters);
  const setPinned = useFilterPinStore((state) => state.setPinned);
  const setPinnedFilters = useFilterPinStore((state) => state.setPinnedFilters);
  const resetPinned = useFilterPinStore((state) => state.resetPinned);

  const [draftFilters, setDraftFilters] = useState<CoreFilters>(appliedFilters);

  useEffect(() => {
    setDraftFilters(pinned ? pinnedFilters : appliedFilters);
  }, [appliedFilters, pinned, pinnedFilters]);

  const supportedKeys = useMemo(() => new Set(getSupportedKeysForPath(pathname)), [pathname]);
  const incompatiblePinnedKeys = useMemo(
    () => (pinned ? getIncompatiblePinnedKeys(pathname, pinnedFilters) : []),
    [pathname, pinned, pinnedFilters],
  );

  const selectedTab = useMemo(() => {
    if (pathname.startsWith('/entity/')) {
      return '/entity/sample';
    }
    return ROUTES.find((route) => route.path === pathname)?.path ?? '/';
  }, [pathname]);

  const updateDraft = <K extends keyof CoreFilters>(key: K, value: CoreFilters[K]) => {
    setDraftFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFiltersForPath = (targetPath: string, nextFilters: CoreFilters) => {
    const params = toSearchParamsForPath(targetPath, nextFilters);
    void navigate({
      to: targetPath,
      search: toSearchObject(params),
    });
  };

  const onApply = () => {
    if (pinned) {
      setPinnedFilters(draftFilters);
    }
    applyFiltersForPath(pathname, draftFilters);
  };

  const onReset = () => {
    const resetValue = DEFAULT_CORE_FILTERS;
    setDraftFilters(resetValue);
    resetPinned();
    applyFiltersForPath(pathname, resetValue);
  };

  const onPinToggle = (checked: boolean) => {
    setPinned(checked);
    if (checked) {
      setPinnedFilters(draftFilters);
    }
  };

  const onRouteChange = (targetPath: string) => {
    const isMajorTransition = MAJOR_ROUTES.has(targetPath) && MAJOR_ROUTES.has(pathname) && targetPath !== pathname;
    const sourceFilters = pinned ? pinnedFilters : draftFilters;
    let outgoingFilters = sourceFilters;
    if (isMajorTransition && hasActiveFilters(sourceFilters)) {
      const shouldCarry = window.confirm('Carry current filters to the selected view?');
      if (!shouldCarry) {
        outgoingFilters = DEFAULT_CORE_FILTERS;
      }
    }
    if (pinned) {
      setPinnedFilters(outgoingFilters);
    }
    applyFiltersForPath(targetPath, outgoingFilters);
  };

  const isSupported = (key: CoreFilterKey) => supportedKeys.has(key);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="transparent" elevation={0} sx={{ borderBottom: '1px solid #e5eaf2' }}>
        <Toolbar sx={{ display: 'grid', gap: 1, alignItems: 'start', py: 1 }}>
          <Box>
            <Typography variant="h6">Psellos Fiction Yneva Web</Typography>
            <Typography variant="body2" color="text.secondary">
              Route-driven explorer for compiled prosopographical artifacts.
            </Typography>
          </Box>

          <Tabs
            value={selectedTab}
            onChange={(_, value: string) => onRouteChange(value)}
            variant="scrollable"
            allowScrollButtonsMobile
          >
            {ROUTES.map((route) => (
              <Tab key={route.path} value={route.path} label={route.label} />
            ))}
          </Tabs>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 1280, mx: 'auto', px: 2, py: 2 }}>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="subtitle1">Global filters</Typography>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    label="Search"
                    value={draftFilters.q}
                    onChange={(event) => updateDraft('q', event.target.value)}
                    disabled={!isSupported('q')}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel id="layer-select-label">Layer</InputLabel>
                    <Select
                      labelId="layer-select-label"
                      label="Layer"
                      value={draftFilters.layer}
                      onChange={(event) => updateDraft('layer', event.target.value)}
                    >
                      <MenuItem value="canon">canon</MenuItem>
                      <MenuItem value="narrative">narrative</MenuItem>
                      <MenuItem value="review">review</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField
                    fullWidth
                    label="Relation type"
                    value={draftFilters.rel_type}
                    onChange={(event) => updateDraft('rel_type', event.target.value)}
                    disabled={!isSupported('rel_type')}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 1.5 }}>
                  <TextField
                    fullWidth
                    label="Date from"
                    value={draftFilters.date_from}
                    onChange={(event) => updateDraft('date_from', event.target.value)}
                    disabled={!isSupported('date_from')}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 1.5 }}>
                  <TextField
                    fullWidth
                    label="Date to"
                    value={draftFilters.date_to}
                    onChange={(event) => updateDraft('date_to', event.target.value)}
                    disabled={!isSupported('date_to')}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField
                    fullWidth
                    label="Entity type"
                    value={draftFilters.entity_type}
                    onChange={(event) => updateDraft('entity_type', event.target.value)}
                    disabled={!isSupported('entity_type')}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <FormControl fullWidth disabled={!isSupported('has_geo')}>
                    <InputLabel id="has-geo-label">Has geo</InputLabel>
                    <Select
                      labelId="has-geo-label"
                      label="Has geo"
                      value={draftFilters.has_geo}
                      onChange={(event) => updateDraft('has_geo', event.target.value as 'any' | 'yes' | 'no')}
                    >
                      <MenuItem value="any">any</MenuItem>
                      <MenuItem value="yes">yes</MenuItem>
                      <MenuItem value="no">no</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <FormControlLabel
                  control={<Checkbox checked={pinned} onChange={(event) => onPinToggle(event.target.checked)} />}
                  label="Pin filters globally"
                />
                <Button variant="contained" onClick={onApply}>
                  Apply
                </Button>
                <Button variant="outlined" onClick={onReset}>
                  Reset (full)
                </Button>
              </Stack>

              {incompatiblePinnedKeys.length > 0 && (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {incompatiblePinnedKeys.map((key) => (
                    <Chip
                      key={key}
                      variant="outlined"
                      disabled
                      label={`${filterLabel(key)} pinned but inactive on this route`}
                    />
                  ))}
                </Stack>
              )}
            </Stack>
          </CardContent>
        </Card>

        <Outlet />
      </Box>
    </Box>
  );
}

export function SimpleView(props: {
  title: string;
  description: string;
  routeId: string;
}) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          {props.title}
        </Typography>
        <Typography color="text.secondary" paragraph>
          {props.description}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Route: {props.routeId}
        </Typography>
      </CardContent>
    </Card>
  );
}
