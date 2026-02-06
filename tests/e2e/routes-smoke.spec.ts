import { expect, test } from '@playwright/test';

const routes = [
  { path: '/', heading: 'Overview' },
  { path: '/entities', heading: 'Entities' },
  { path: '/entity/sample', heading: 'Entity sample' },
  { path: '/graph', heading: 'Graph' },
  { path: '/map', heading: 'Map' },
  { path: '/layers', heading: 'Layers' },
  { path: '/search', heading: 'Search' },
  { path: '/diagnostics', heading: 'Diagnostics' },
];

for (const route of routes) {
  test(`route smoke: ${route.path}`, async ({ page }) => {
    await page.goto(route.path);
    await expect(page.getByRole('heading', { name: route.heading })).toBeVisible();
  });
}
