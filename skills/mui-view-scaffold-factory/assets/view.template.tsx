import { Box, Card, CardContent, Stack, Typography } from '@mui/material';

export function {{VIEW_NAME_PASCAL}}View() {
  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h4">{{VIEW_NAME_TITLE}}</Typography>
        <Typography variant="body2" color="text.secondary">
          TODO: describe this view.
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 2 }}>
        <Card>
          <CardContent>
            <Typography variant="h6">Main Surface</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6">Details Panel</Typography>
          </CardContent>
        </Card>
      </Box>
    </Stack>
  );
}