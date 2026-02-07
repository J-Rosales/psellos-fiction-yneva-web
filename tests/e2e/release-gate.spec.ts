import { expect, test } from '@playwright/test';

test('URL-state restoration survives reload and back/forward navigation', async ({ page }) => {
  await page.route('**/api/entities*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        meta: {
          layer: 'canon',
          result_count: 1,
          total_count: 1,
          buckets: {
            unknown_label_count: 0,
            ambiguous_label_count: 0,
          },
        },
        items: [{ id: 'p1', label: 'Entity One', entity_type: 'person' }],
      }),
    });
  });

  await page.goto('/entities');
  await page.getByRole('textbox', { name: 'Search' }).fill('alexios');
  await page.getByRole('button', { name: 'Update' }).click();

  await expect(page).toHaveURL(/q=alexios/);

  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Search' })).toHaveValue('alexios');

  page.once('dialog', async (dialog) => {
    await dialog.accept();
  });
  await page.getByRole('tab', { name: 'Search' }).click();
  await expect(page).toHaveURL(/\/search\?/);

  await page.goBack();
  await expect(page).toHaveURL(/\/entities\?/);
  await expect(page.getByRole('textbox', { name: 'Search' })).toHaveValue('alexios');
});

test('share-link style deep link opens stable analysis context for entity detail', async ({ page }) => {
  await page.route('**/api/entities/*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        meta: { layer: 'canon', result_count: 1 },
        item: { id: 'p1', label: 'Entity One', entity_type: 'person' },
      }),
    });
  });
  await page.route('**/api/assertions*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        meta: { layer: 'canon', result_count: 1 },
        items: [{ id: 'a1', subject: 'p1', predicate: 'ally_of', object: 'p2' }],
      }),
    });
  });

  await page.goto('/entity/p1?layer=canon&rel_type=ally&q=ignored');
  await expect(page.getByRole('heading', { name: 'Entity One' })).toBeVisible();
  await expect(page).toHaveURL(/\/entity\/p1\?/);
  await expect(page).toHaveURL(/layer=canon/);
  await expect(page).toHaveURL(/rel_type=ally/);
});

test('unknown and ambiguous buckets are explicitly rendered on entities and search views', async ({ page }) => {
  await page.route('**/api/entities*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        meta: {
          layer: 'canon',
          result_count: 1,
          total_count: 1,
          buckets: {
            unknown_label_count: 3,
            ambiguous_label_count: 2,
          },
        },
        items: [{ id: 'p1', label: 'Entity One', entity_type: 'person' }],
      }),
    });
  });

  await page.goto('/entities');
  await expect(page.getByText('Unknown labels: 3 | Ambiguous labels: 2')).toBeVisible();

  page.once('dialog', async (dialog) => {
    await dialog.accept();
  });
  await page.getByRole('tab', { name: 'Search' }).click();
  await expect(page.getByText('Unknown labels: 3 | Ambiguous labels: 2')).toBeVisible();
});
