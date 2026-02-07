import { expect, test } from '@playwright/test';

test('graph clumping diagnostic improves with larger node separation', async ({ page }) => {
  await page.route('**/api/entities*', async (route) => {
    const url = new URL(route.request().url());
    const q = (url.searchParams.get('q') ?? '').toLowerCase();
    const body = q.includes('alexios')
      ? {
          meta: { layer: 'canon', result_count: 1, total_count: 1 },
          items: [{ id: 'Q41600', label: 'Alexios I Komnenos', entity_type: 'person' }],
        }
      : {
          meta: { layer: 'canon', result_count: 0, total_count: 0 },
          items: [],
        };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });

  await page.route('**/api/graph/neighborhood*', async (route) => {
    const nodes = Array.from({ length: 24 }).map((_, i) => ({
      id: `n${i + 1}`,
      label: `Node ${i + 1}`,
      entity_type: i % 2 === 0 ? 'person' : 'place',
    }));
    const edges: Array<Record<string, unknown>> = [];
    for (let i = 1; i < nodes.length; i += 1) {
      edges.push({
        id: `e${i}`,
        subject: 'n1',
        object: `n${i + 1}`,
        predicate: i % 3 === 0 ? 'ally_of' : 'described_by',
        extensions: { psellos: { confidence: 0.7 } },
      });
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        meta: { layer: 'canon', result_count: edges.length, warnings: [] },
        nodes,
        edges,
      }),
    });
  });

  await page.goto('/graph?q=alexios&layer=canon');
  await page.waitForFunction(() => {
    const win = window as Window & {
      __psellosGraphDebug?: { getMetrics: () => { nodes: number } };
    };
    return Boolean(win.__psellosGraphDebug && win.__psellosGraphDebug.getMetrics().nodes > 0);
  });

  const densePairsAtLow = await page.evaluate(async () => {
    const win = window as Window & {
      __psellosGraphDebug?: { setSeparation: (v: number) => void; getMetrics: () => { densePairs: number } };
    };
    win.__psellosGraphDebug?.setSeparation(1.2);
    await new Promise((resolve) => setTimeout(resolve, 350));
    return win.__psellosGraphDebug?.getMetrics().densePairs ?? -1;
  });

  const densePairsAtHigh = await page.evaluate(async () => {
    const win = window as Window & {
      __psellosGraphDebug?: { setSeparation: (v: number) => void; getMetrics: () => { densePairs: number } };
    };
    win.__psellosGraphDebug?.setSeparation(6);
    await new Promise((resolve) => setTimeout(resolve, 450));
    return win.__psellosGraphDebug?.getMetrics().densePairs ?? -1;
  });

  expect(densePairsAtLow).toBeGreaterThanOrEqual(0);
  expect(densePairsAtHigh).toBeGreaterThanOrEqual(0);
  expect(densePairsAtHigh).toBeLessThanOrEqual(densePairsAtLow);
});
