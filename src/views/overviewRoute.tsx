import { Card, CardContent, Grid, Link, Stack, Typography } from '@mui/material';

export function OverviewRouteView() {
  return (
    <Stack spacing={2}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>Psellos Overview</Typography>
          <Typography color="text.secondary">
            Psellos Fiction Yneva Web is a portfolio-grade interface for browsing compiled prosopographical artifacts,
            with layered search, entity inspection, graph analysis, and map exploration.
          </Typography>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>What Psellos Is</Typography>
              <Typography variant="body2" color="text.secondary">
                A read-only presentation surface for compiled outputs. It is optimized for transparent navigation across
                entities, assertions, layers, and diagnostics.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>How It Differs</Typography>
              <Typography variant="body2" color="text.secondary">
                Unlike narrative-only prosopography viewers, this stack exposes structural views and query-first workflows
                for source-aware analysis, reproducible filtering, and cross-view state consistency.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Builder + Web Concretization</Typography>
              <Typography variant="body2" color="text.secondary">
                Yneva Builder emits compiled artifacts; Yneva Web indexes and serves them with stable route contracts,
                canonical entity typing, and forward-compatible UI rendering.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Quick Start</Typography>
          <Stack spacing={0.75}>
            <Typography variant="body2"><Link href="/entities">Browse Entities</Link> to inspect canonical records.</Typography>
            <Typography variant="body2"><Link href="/graph">Open Graph</Link> for network analysis and cluster context.</Typography>
            <Typography variant="body2"><Link href="/map">Open Map</Link> for geo-linked assertion navigation.</Typography>
            <Typography variant="body2"><Link href="/diagnostics">Run Diagnostics</Link> for data quality exports.</Typography>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
