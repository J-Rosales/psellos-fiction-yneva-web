import type { AssertionRecord } from '../data/loadAssertionsById';
import type { AssertionsByLayer } from '../data/loadAssertionsByLayer';

const QUERY_PARAM_BASE = 'a';
const QUERY_PARAM_COMPARE = 'b';

export function renderLayerCompareView(
  assertionsByLayer: AssertionsByLayer,
  assertionsById: Record<string, AssertionRecord>,
  layers: string[],
): HTMLElement {
  const section = document.createElement('section');
  section.className = 'view layer-compare';

  const heading = document.createElement('h2');
  heading.textContent = 'Compare layers';

  const description = document.createElement('p');
  description.textContent =
    'Diff assertions between two narrative layers using compiled artifacts.';

  const compareControls = document.createElement('div');
  compareControls.className = 'layer-compare__controls';

  const defaultBase = 'canon';
  const defaultCompare = pickDefaultCompareLayer(layers);

  const fromParams = readSelectionFromQuery();

  let selectedBase = fromParams.base ?? defaultBase;
  let selectedCompare = fromParams.compare ?? defaultCompare;

  const baseControl = renderLayerSelect(
    'Base layer (A)',
    'layer-compare-base',
    layers,
    selectedBase,
    (value) => {
      selectedBase = value;
      syncQueryParams(selectedBase, selectedCompare);
      renderResults();
    },
  );

  const compareControl = renderLayerSelect(
    'Compare layer (B)',
    'layer-compare-compare',
    layers,
    selectedCompare,
    (value) => {
      selectedCompare = value;
      syncQueryParams(selectedBase, selectedCompare);
      renderResults();
    },
  );

  compareControls.append(baseControl, compareControl);

  const results = document.createElement('div');
  results.className = 'layer-compare__results';

  const renderResults = () => {
    const baseValid = layers.includes(selectedBase);
    const compareValid = layers.includes(selectedCompare);

    const diff =
      baseValid && compareValid
        ? computeDiff(assertionsByLayer, selectedBase, selectedCompare)
        : { added: [], removed: [], shared: [] };

    const counts = renderDiffCounts(
      diff.added.length,
      diff.removed.length,
      diff.shared.length,
    );

    const addedList = renderAssertionList(
      'Added assertions',
      diff.added,
      assertionsById,
    );
    const removedList = renderAssertionList(
      'Removed assertions',
      diff.removed,
      assertionsById,
    );

    results.replaceChildren(counts, addedList, removedList);
  };

  renderResults();

  section.append(heading, description, compareControls, results);
  return section;
}

function pickDefaultCompareLayer(layers: string[]): string {
  const nonCanon = layers.find((layerId) => layerId !== 'canon');
  return nonCanon ?? 'canon';
}

function readSelectionFromQuery(): { base: string | null; compare: string | null } {
  try {
    const params = new URLSearchParams(window.location.search);
    return {
      base: params.get(QUERY_PARAM_BASE),
      compare: params.get(QUERY_PARAM_COMPARE),
    };
  } catch {
    return { base: null, compare: null };
  }
}

function syncQueryParams(base: string, compare: string): void {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set(QUERY_PARAM_BASE, base);
    url.searchParams.set(QUERY_PARAM_COMPARE, compare);
    window.history.replaceState({}, '', url);
  } catch {
    // Ignore URL updates if unavailable.
  }
}

function renderLayerSelect(
  labelText: string,
  selectId: string,
  layers: string[],
  selectedLayer: string,
  onSelect: (layerId: string) => void,
): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'layer-compare__control';

  const label = document.createElement('label');
  label.htmlFor = selectId;
  label.textContent = labelText;

  const select = document.createElement('select');
  select.id = selectId;
  select.name = selectId;

  const options = buildLayerOptions(layers, selectedLayer);
  options.forEach((layerId) => {
    const option = document.createElement('option');
    option.value = layerId;
    option.textContent = layerId;
    select.append(option);
  });

  select.value = selectedLayer;

  const status = document.createElement('span');
  status.className = 'layer-compare__status';

  const updateStatus = (layerId: string) => {
    if (layerId !== '' && !layers.includes(layerId)) {
      status.textContent = `Missing layer: ${layerId}`;
      status.hidden = false;
    } else {
      status.textContent = '';
      status.hidden = true;
    }
  };

  updateStatus(selectedLayer);

  select.addEventListener('change', (event) => {
    const target = event.target;
    if (target instanceof HTMLSelectElement) {
      updateStatus(target.value);
      onSelect(target.value);
    }
  });

  wrapper.append(label, select, status);
  return wrapper;
}

function buildLayerOptions(layers: string[], selectedLayer: string): string[] {
  const options = [...layers].sort((a, b) => a.localeCompare(b));
  if (selectedLayer !== '' && !options.includes(selectedLayer)) {
    return [selectedLayer, ...options];
  }
  return options;
}

function computeDiff(
  assertionsByLayer: AssertionsByLayer,
  baseLayer: string,
  compareLayer: string,
): { added: string[]; removed: string[]; shared: string[] } {
  const baseSet = new Set(assertionsByLayer[baseLayer] ?? []);
  const compareSet = new Set(assertionsByLayer[compareLayer] ?? []);

  const added: string[] = [];
  const removed: string[] = [];
  const shared: string[] = [];

  compareSet.forEach((id) => {
    if (!baseSet.has(id)) {
      added.push(id);
    } else {
      shared.push(id);
    }
  });

  baseSet.forEach((id) => {
    if (!compareSet.has(id)) {
      removed.push(id);
    }
  });

  return {
    added: sortAssertionIds(added),
    removed: sortAssertionIds(removed),
    shared: sortAssertionIds(shared),
  };
}

function sortAssertionIds(ids: string[]): string[] {
  return [...ids].sort((a, b) => a.localeCompare(b));
}

function renderDiffCounts(
  addedCount: number,
  removedCount: number,
  sharedCount: number,
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'layer-compare__counts';

  const list = document.createElement('dl');

  const addRow = (label: string, value: number) => {
    const term = document.createElement('dt');
    term.textContent = label;
    const definition = document.createElement('dd');
    definition.textContent = String(value);
    list.append(term, definition);
  };

  addRow('Added', addedCount);
  addRow('Removed', removedCount);
  addRow('Shared', sharedCount);

  container.append(list);
  return container;
}

function renderAssertionList(
  title: string,
  assertionIds: string[],
  assertionsById: Record<string, AssertionRecord>,
): HTMLElement {
  const container = document.createElement('section');
  container.className = 'layer-compare__list';

  const heading = document.createElement('h3');
  heading.textContent = `${title} (${assertionIds.length})`;

  if (assertionIds.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'None.';
    container.append(heading, empty);
    return container;
  }

  const list = document.createElement('ul');
  list.className = 'layer-compare__items';

  assertionIds.forEach((assertionId) => {
    const item = document.createElement('li');
    item.append(renderAssertionCard(assertionId, assertionsById[assertionId]));
    list.append(item);
  });

  container.append(heading, list);
  return container;
}

function renderAssertionCard(
  assertionId: string,
  assertion: AssertionRecord | undefined,
): HTMLElement {
  const card = document.createElement('article');
  card.className = 'assertion-card';

  const heading = document.createElement('h4');
  heading.textContent = assertionId;

  if (!assertion) {
    const missing = document.createElement('p');
    missing.textContent = 'Assertion details not found in assertions_by_id.';
    card.append(heading, missing);
    return card;
  }

  const statement = document.createElement('p');
  statement.textContent = `${assertion.subjectId} — ${assertion.predicate} → ${assertion.objectId}`;

  card.append(heading, statement);
  return card;
}
