import { expect, test } from '@playwright/test';

test('apply updates URL query with layer and search', async ({ page }) => {
  await page.goto('/entities');
  await page.getByRole('textbox', { name: 'Search' }).fill('alexios');
  await page.getByRole('button', { name: 'Update' }).click();
  await expect(page).toHaveURL(/\/entities\?(.+&)?q=alexios/);
  await expect(page).toHaveURL(/layer=canon/);
});

test('reset clears search and resets layer to canon', async ({ page }) => {
  await page.goto('/entities');
  await page.getByLabel('Layer').click();
  await page.getByRole('option', { name: /narrative\./ }).first().click();
  await page.getByRole('textbox', { name: 'Search' }).fill('to-clear');
  await page.getByRole('button', { name: 'Update' }).click();
  await expect(page).toHaveURL(/layer=narrative\./);

  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(page).toHaveURL(/layer=canon/);
  await expect(page).not.toHaveURL(/q=to-clear/);
});

test('pinned incompatible filters show inert chip on route where unsupported', async ({ page }) => {
  await page.goto('/entities');
  await page.getByRole('textbox', { name: 'Search' }).fill('pinned-value');
  await page.getByText('Pin Globally', { exact: true }).click();
  await page.getByRole('button', { name: 'Update' }).click();

  page.once('dialog', async (dialog) => {
    await dialog.accept();
  });
  await page.getByRole('tab', { name: 'Layers' }).click();
  await expect(page.getByText('Search pinned but inactive on this route')).toBeVisible();
});

test('major route carry prompt can reject carrying filters', async ({ page }) => {
  await page.goto('/graph');
  await page.getByRole('textbox', { name: 'Search' }).fill('drop-me');
  await page.getByRole('button', { name: 'Update' }).click();
  await expect(page).toHaveURL(/q=drop-me/);

  page.once('dialog', async (dialog) => {
    await dialog.dismiss();
  });
  await page.getByRole('tab', { name: 'Map' }).click();

  await expect(page).toHaveURL(/\/map\?/);
  await expect(page).toHaveURL(/layer=canon/);
  await expect(page).not.toHaveURL(/q=drop-me/);
});
