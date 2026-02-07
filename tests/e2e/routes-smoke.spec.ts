import { expect, test } from '@playwright/test';

const routes = [
  { path: '/', tab: 'Overview' },
  { path: '/entities', tab: 'Entities' },
  { path: '/entity/sample', tab: 'Entity Detail' },
  { path: '/graph', tab: 'Graph' },
  { path: '/map', tab: 'Map' },
  { path: '/layers', tab: 'Layers' },
  { path: '/search', tab: 'Search' },
  { path: '/diagnostics', tab: 'Diagnostics' },
];

for (const route of routes) {
  test(`route smoke: ${route.path}`, async ({ page }) => {
    await page.goto(route.path);
    await expect(page).toHaveURL(new RegExp(route.path === '/' ? '/$' : route.path.replace('/', '\\/')));
    await expect(page.getByText('Psellos Fiction Yneva Web')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('tab', { name: route.tab })).toBeVisible({ timeout: 10_000 });
  });
}

