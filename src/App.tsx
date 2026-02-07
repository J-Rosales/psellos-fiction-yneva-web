import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Toolbar,
  Typography,
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PersonIcon from '@mui/icons-material/Person';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import MapIcon from '@mui/icons-material/Map';
import LayersIcon from '@mui/icons-material/Layers';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { fetchEntities } from './api/client';
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
import { ACCENT_PRESETS } from './theme/appTheme';
import { useThemePreferences } from './theme/themePreferences';

interface RouteNavEntry {
  path: string;
  label: string;
  icon: ReactElement;
}

const ROUTES: RouteNavEntry[] = [
  { path: '/', label: 'Overview', icon: <AccountBalanceIcon sx={{ fontSize: 25 }} /> },
  { path: '/entities', label: 'Entities', icon: <PersonIcon sx={{ fontSize: 25 }} /> },
  { path: '/entity', label: 'Entity Detail', icon: <ManageAccountsIcon sx={{ fontSize: 25 }} /> },
  { path: '/graph', label: 'Graph', icon: <AccountTreeIcon sx={{ fontSize: 25 }} /> },
  { path: '/map', label: 'Map', icon: <MapIcon sx={{ fontSize: 25 }} /> },
  { path: '/layers', label: 'Layers', icon: <LayersIcon sx={{ fontSize: 25 }} /> },
  { path: '/search', label: 'Search', icon: <VisibilityIcon sx={{ fontSize: 25 }} /> },
  { path: '/diagnostics', label: 'Diagnostics', icon: <MonitorHeartIcon sx={{ fontSize: 25 }} /> },
];

const ENTITY_TYPE_OPTIONS = [
  'persons',
  'groups',
  'polities',
  'institutions',
  'offices',
  'places',
  'artifacts',
  'texts',
  'sources',
  'species',
] as const;

const MAJOR_ROUTES = new Set(['/entities', '/entity', '/graph', '/map', '/layers', '/search', '/diagnostics']);

async function loadLayerOptions(): Promise<string[]> {
  try {
    const response = await fetch('/data/layers.json');
    if (!response.ok) {
      return ['canon'];
    }
    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) {
      return ['canon'];
    }
    const values = payload.filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
    return values.length > 0 ? values : ['canon'];
  } catch {
    return ['canon'];
  }
}

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
  const [showSecondaryFilters, setShowSecondaryFilters] = useState(false);
  const [autoCheck, setAutoCheck] = useState(true);
  const appBarRef = useRef<HTMLDivElement | null>(null);
  const [appBarHeight, setAppBarHeight] = useState(112);
  const { mode, setMode, accentId, setAccentId } = useThemePreferences();
  const layersQuery = useQuery({
    queryKey: ['global-layer-options'],
    queryFn: loadLayerOptions,
    staleTime: 60_000,
  });
  const autoCheckQuery = useQuery({
    queryKey: ['search-auto-check', draftFilters],
    queryFn: () => fetchEntities({ filters: draftFilters, page: 0, pageSize: 1 }),
    enabled: autoCheck && draftFilters.q.trim().length > 0 && getSupportedKeysForPath(pathname).includes('q'),
    staleTime: 0,
  });

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
      return '/entity';
    }
    return ROUTES.find((route) => route.path === pathname)?.path ?? '/';
  }, [pathname]);
  const layerOptions = useMemo(() => {
    const base = Array.isArray(layersQuery.data) ? layersQuery.data : ['canon'];
    const includeCurrent = [draftFilters.layer, pinnedFilters.layer];
    const set = new Set([...base, ...includeCurrent].filter((value) => value && value.trim().length > 0));
    const ordered = Array.from(set).sort((a, b) => a.localeCompare(b));
    if (ordered.includes('canon')) {
      return ['canon', ...ordered.filter((value) => value !== 'canon')];
    }
    return ordered;
  }, [layersQuery.data, draftFilters.layer, pinnedFilters.layer]);

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
    if (pathname === '/entity') {
      applyFiltersForPath('/search', draftFilters);
      return;
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

  useEffect(() => {
    const sync = () => {
      setAppBarHeight(Math.ceil(appBarRef.current?.getBoundingClientRect().height ?? 112));
    };
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        ref={appBarRef}
        position="sticky"
        color="default"
        elevation={0}
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          backgroundImage: 'none',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Toolbar sx={{ display: 'grid', gap: 1, alignItems: 'start', py: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
            <Box>
              <Typography variant="h6">Psellos Fiction Yneva Web</Typography>
              <Typography variant="body2" color="text.secondary">
                Route-driven explorer for compiled prosopographical artifacts.
              </Typography>
            </Box>
            <Stack direction="row" spacing={0.75} alignItems="center">
              {ACCENT_PRESETS.map((preset) => (
                <Tooltip key={preset.id} title={preset.label}>
                  <IconButton
                    aria-label={`Set accent ${preset.label}`}
                    onClick={() => setAccentId(preset.id)}
                    size="small"
                    sx={{
                      p: 0.35,
                      border: accentId === preset.id ? '2px solid' : '1px solid',
                      borderColor: accentId === preset.id ? 'primary.main' : 'divider',
                    }}
                  >
                    <Box
                      sx={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        bgcolor: preset.primary,
                      }}
                    />
                  </IconButton>
                </Tooltip>
              ))}
              <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
                <IconButton
                  aria-label={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                  onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
                  size="small"
                >
                  {mode === 'light' ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          <Tabs
            value={selectedTab}
            onChange={(_, value: string) => onRouteChange(value)}
            variant="scrollable"
            allowScrollButtonsMobile
            sx={{
              minHeight: 56,
              '& .MuiTab-root': {
                minHeight: 56,
                minWidth: 80,
                fontSize: '0.7rem',
                fontWeight: 400,
                color: 'text.secondary',
                textTransform: 'none',
                opacity: 0.88,
                gap: 0.2,
                py: 0.25,
                px: 0.65,
                borderRadius: 1.5,
              },
              '& .MuiTab-root:hover': {
                color: 'text.primary',
              },
              '& .Mui-selected': {
                color: 'text.primary',
                fontWeight: 500,
                opacity: 1,
              },
              '& .MuiSvgIcon-root': {
                mb: 0.05,
              },
            }}
          >
            {ROUTES.map((route) => (
              <Tab key={route.path} value={route.path} label={route.label} icon={route.icon} iconPosition="top" />
            ))}
          </Tabs>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          width: '100%',
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          position: 'sticky',
          top: `${appBarHeight}px`,
          zIndex: (theme) => theme.zIndex.appBar - 1,
          backdropFilter: 'blur(10px)',
        }}
      >
        <Card sx={{ borderRadius: 0, boxShadow: 'none' }}>
          <CardContent>
            <Stack spacing={1}>
              <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="subtitle1">Global filters</Typography>
                  <Tooltip title={pinned ? 'Pinned: filters persist across compatible routes.' : 'Unpinned: filters apply only to the current route context.'}>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', color: pinned ? 'primary.main' : 'text.secondary' }}>
                      {pinned ? <LockIcon fontSize="medium" /> : <LockOpenIcon fontSize="medium" />}
                    </Box>
                  </Tooltip>
                </Stack>
                <Tooltip title="Keep current filters active while navigating between compatible pages.">
                  <Chip
                    label="Pin Globally"
                    clickable
                    onClick={() => onPinToggle(!pinned)}
                    color={pinned ? 'primary' : 'default'}
                    variant={pinned ? 'filled' : 'outlined'}
                    sx={{
                      height: 34,
                      fontSize: '0.82rem',
                      borderRadius: 1,
                      '& .MuiChip-label': { px: 1.1 },
                    }}
                  />
                </Tooltip>
                <Button size="small" variant="contained" onClick={onApply} sx={{ height: 34, px: 1.6, borderRadius: 1 }}>
                  Update
                </Button>
                <Button size="small" variant="outlined" onClick={onReset} sx={{ height: 34, px: 1.6, borderRadius: 1 }}>
                  Reset
                </Button>
                <Tooltip title={showSecondaryFilters ? 'Hide advanced filters' : 'Show advanced filters'}>
                  <IconButton
                    size="small"
                    aria-label={showSecondaryFilters ? 'Hide advanced filters' : 'Show advanced filters'}
                    onClick={() => setShowSecondaryFilters((prev) => !prev)}
                  >
                    {showSecondaryFilters ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </Stack>
              <Grid container spacing={0.75} alignItems="center">
                <Grid size={{ xs: 12, md: 3.25 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Search"
                    value={draftFilters.q}
                    onChange={(event) => updateDraft('q', event.target.value)}
                    disabled={!isSupported('q')}
                    sx={
                      autoCheck && draftFilters.q.trim().length > 0
                        ? {
                            '& .MuiInputBase-input': {
                              color: autoCheckQuery.isLoading
                                ? 'text.primary'
                                : (autoCheckQuery.data?.meta.result_count ?? 0) > 0
                                  ? 'success.main'
                                  : 'error.main',
                            },
                          }
                        : undefined
                    }
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 'auto', md: 'auto' }}>
                  <Tooltip title="Match exact text only for search terms.">
                    <Chip
                      label="Exact"
                      clickable
                      onClick={() => updateDraft('exact', !draftFilters.exact)}
                      color={draftFilters.exact ? 'primary' : 'default'}
                      variant={draftFilters.exact ? 'filled' : 'outlined'}
                      disabled={!isSupported('exact')}
                      sx={{
                        height: 34,
                        fontSize: '0.82rem',
                        borderRadius: 1,
                        '& .MuiChip-label': { px: 1.1 },
                      }}
                    />
                  </Tooltip>
                </Grid>
                <Grid size={{ xs: 'auto', md: 'auto' }}>
                  <Tooltip title="When enabled, search input silently checks if current filters return results.">
                    <Chip
                      label="Auto Check"
                      clickable
                      onClick={() => setAutoCheck((v) => !v)}
                      color={autoCheck ? 'primary' : 'default'}
                      variant={autoCheck ? 'filled' : 'outlined'}
                      disabled={!isSupported('q')}
                      sx={{
                        height: 34,
                        fontSize: '0.82rem',
                        borderRadius: 1,
                        '& .MuiChip-label': { px: 1.1 },
                      }}
                    />
                  </Tooltip>
                </Grid>
                <Grid size={{ xs: 12, md: 2.1 }}>
                  <FormControl fullWidth size="small" disabled={!isSupported('entity_type')}>
                    <InputLabel id="entity-type-label">Entity type</InputLabel>
                    <Select
                      size="small"
                      labelId="entity-type-label"
                      label="Entity type"
                      value={draftFilters.entity_type}
                      onChange={(event) => updateDraft('entity_type', event.target.value)}
                    >
                      <MenuItem value="">any</MenuItem>
                      {ENTITY_TYPE_OPTIONS.map((entityType) => (
                        <MenuItem key={entityType} value={entityType}>
                          {entityType}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="layer-select-label">Layer</InputLabel>
                    <Select
                      size="small"
                      labelId="layer-select-label"
                      label="Layer"
                      value={draftFilters.layer}
                      onChange={(event) => updateDraft('layer', event.target.value)}
                    >
                      {layerOptions.map((layerId) => (
                        <MenuItem key={layerId} value={layerId}>
                          {layerId}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {showSecondaryFilters ? (
                <Grid container spacing={1} alignItems="center">
                  <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth>
                      <TextField
                        fullWidth
                        size="small"
                        label="Relation filters"
                        value={draftFilters.rel_type}
                        onChange={(event) => updateDraft('rel_type', event.target.value)}
                        disabled={!isSupported('rel_type')}
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end">
                                <Tooltip title="Use ally,!enemy for hard include/exclude">
                                  <IconButton edge="end" size="small" tabIndex={-1} aria-label="Relation filter help">
                                    <HelpOutlineIcon fontSize="inherit" />
                                  </IconButton>
                                </Tooltip>
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Stack spacing={0.5}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          Date range
                        </Typography>
                        <Tooltip title="Filters assertion/date metadata in the compiled artifacts. Accepted formats: YYYY, YYYY-MM, YYYY-MM-DD (examples: 1180, 1180-05, 1180-05-12).">
                          <IconButton size="small" tabIndex={-1} aria-label="Date range format help">
                            <HelpOutlineIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <TextField
                          fullWidth
                          size="small"
                          label="From"
                          value={draftFilters.date_from}
                          onChange={(event) => updateDraft('date_from', event.target.value)}
                          disabled={!isSupported('date_from')}
                        />
                        <Typography variant="body2" color="text.secondary">
                          to
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          label="To"
                          value={draftFilters.date_to}
                          onChange={(event) => updateDraft('date_to', event.target.value)}
                          disabled={!isSupported('date_to')}
                        />
                      </Stack>
                    </Stack>
                  </Grid>
                  <Grid size={{ xs: 12, md: 2.4 }}>
                    <FormControl fullWidth size="small" disabled={!isSupported('has_geo')}>
                      <InputLabel id="has-geo-label">Has geo</InputLabel>
                      <Select
                        size="small"
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
              ) : null}

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
      </Box>

      <Box sx={{ width: '100%', px: { xs: 1.5, sm: 2, md: 2.5 }, py: 2 }}>
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
