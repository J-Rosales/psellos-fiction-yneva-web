import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import HubIcon from '@mui/icons-material/Hub';
import MapIcon from '@mui/icons-material/Map';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import TableRowsIcon from '@mui/icons-material/TableRows';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import { Avatar, Card, CardActionArea, CardContent, Chip, Grid, Paper, Stack, Tooltip, Typography, Link as MuiLink } from '@mui/material';
import { useNavigate } from '@tanstack/react-router';
import type { ReactElement } from 'react';

type QuickAction = {
  title: string;
  subtitle: string;
  to: string;
  search: Record<string, string>;
  icon: ReactElement;
};

export function OverviewRouteView() {
  const navigate = useNavigate();
  const actions: QuickAction[] = [
    {
      title: 'Show Alexios I Komnenos',
      subtitle: 'Entities preset',
      to: '/entities',
      search: { layer: 'canon', q: 'alexios i komnenos', exact: 'false', page: '0', page_size: '25' },
      icon: <TableRowsIcon color="primary" />,
    },
    {
      title: 'Open Alexios Entity Detail',
      subtitle: 'Entity profile preset',
      to: '/entity/Q41600',
      search: { layer: 'canon' },
      icon: <PersonSearchIcon color="primary" />,
    },
    {
      title: 'Graph Around Alexios',
      subtitle: 'Hop-1 graph preset',
      to: '/graph',
      search: { layer: 'canon', q: 'Q41600', entity_id: 'Q41600', g_depth: '1', g_mode: 'node' },
      icon: <HubIcon color="primary" />,
    },
    {
      title: 'Map Byzantine Focus',
      subtitle: 'Geo assertions preset',
      to: '/map',
      search: { layer: 'canon', q: 'constantinople' },
      icon: <MapIcon color="primary" />,
    },
    {
      title: 'Compare Narrative Layers',
      subtitle: 'Layer diff preset',
      to: '/layers',
      search: { layer: 'narrative.tentative.consensus' },
      icon: <AccountTreeIcon color="primary" />,
    },
    {
      title: 'Run Diagnostics',
      subtitle: 'Canon diagnostics preset',
      to: '/diagnostics',
      search: { layer: 'canon' },
      icon: <AnalyticsIcon color="primary" />,
    },
  ];

  return (
    <Stack spacing={2}>
      <Paper
        elevation={3}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 3,
          background: (theme) =>
            `linear-gradient(120deg, ${theme.palette.primary.main}22 0%, ${theme.palette.secondary.main}1a 45%, ${theme.palette.background.paper} 100%)`,
          border: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
            <Chip icon={<RocketLaunchIcon />} label="Portfolio Mode" color="primary" variant="filled" />
            <Chip icon={<PrecisionManufacturingIcon />} label="Compiled Artifacts Only" variant="outlined" />
            <Chip icon={<TravelExploreIcon />} label="Layered Exploration" variant="outlined" />
          </Stack>
          <Typography variant="h4">Psellos Overview</Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 900 }}>
            Psellos is a{' '}
            <Tooltip title="SNAP is a standards initiative for interoperable, machine-readable prosopographical and historical data.">
              <MuiLink href="https://snapdrgn.net/about.html" target="_blank" rel="noopener noreferrer">
                SNAP
              </MuiLink>
            </Tooltip>
            -aligned prosopography initiative with an explicit extension for narrative layers, allowing structured
            persons/roles/relations to coexist with interpretive and temporal storytelling.
          </Typography>
          <Grid container spacing={1.25} sx={{ pt: 0.5 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Stack spacing={1.25}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                      <TravelExploreIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="h6" gutterBottom>What Psellos Is</Typography>
                    <Typography variant="body2" color="text.secondary">
                      A read-only presentation surface for compiled outputs. It is optimized for transparent navigation across
                      entities, assertions, layers, and diagnostics.
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Stack spacing={1.25}>
                    <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36 }}>
                      <HubIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="h6" gutterBottom>How It Differs</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Unlike narrative-only prosopography viewers, this stack exposes structural views and query-first workflows
                      for source-aware analysis, reproducible filtering, and cross-view state consistency.
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Stack spacing={1.25}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                      <PrecisionManufacturingIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="h6" gutterBottom>Builder + Web Concretization</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Yneva Builder emits compiled artifacts; Yneva Web indexes and serves them with stable route contracts,
                      canonical entity typing, and forward-compatible UI rendering.
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Stack>
      </Paper>

      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="h6">Quick Start</Typography>
            <Typography variant="body2" color="text.secondary">
              Preset launch panels
            </Typography>
          </Stack>
          <Grid container spacing={1}>
            {actions.map((action) => (
              <Grid key={action.title} size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardActionArea
                    sx={{
                      p: 1.25,
                      height: '100%',
                      borderRadius: 2,
                      transition: 'transform 180ms ease, box-shadow 180ms ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 3,
                      },
                    }}
                    onClick={() => void navigate({ to: action.to, search: action.search })}
                  >
                    <Stack spacing={0.75} alignItems="flex-start">
                      <Avatar sx={{ bgcolor: 'action.selected', color: 'primary.main', width: 34, height: 34 }}>
                        {action.icon}
                      </Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {action.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {action.subtitle}
                      </Typography>
                    </Stack>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Stack>
  );
}
