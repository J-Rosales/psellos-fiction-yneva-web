import type { Manifest } from '../data/loadManifest';
import { renderNarrativeLayerToggle } from './narrative-layer';

export function renderManifestApp(manifest: Manifest): HTMLElement {
  const section = document.createElement('section');
  section.className = 'view';

  const heading = document.createElement('h2');
  heading.textContent = 'Manifest Overview';

  const narrativeToggle = renderNarrativeLayerToggle();

  const content = document.createElement('div');

  let selectedPersonId: string | null = null;

  const render = () => {
    content.replaceChildren(
      selectedPersonId
        ? renderPersonDetailView(manifest, selectedPersonId, (id) => {
            selectedPersonId = id;
            render();
          })
        : renderHomeView(manifest, (id) => {
            selectedPersonId = id;
            render();
          }),
    );
  };

  render();

  section.append(heading, narrativeToggle, content);
  return section;
}

function renderHomeView(
  manifest: Manifest,
  onSelect: (id: string) => void,
): HTMLElement {
  const container = document.createElement('div');

  const spec = document.createElement('p');
  spec.textContent = `Spec version: ${manifest.spec_version}`;

  const counts = document.createElement('p');
  counts.textContent = `Persons: ${manifest.counts.persons} · Assertions: ${manifest.counts.assertions}`;

  const listHeading = document.createElement('h3');
  listHeading.textContent = 'Persons';

  const list = document.createElement('ul');

  const entries = Object.entries(manifest.person_index).sort(([, a], [, b]) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  );

  if (entries.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'No persons found in manifest.';
    container.append(spec, counts, listHeading, empty);
    return container;
  }

  entries.forEach(([id, displayName]) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = `${displayName} (${id})`;
    button.addEventListener('click', () => onSelect(id));
    item.append(button);
    list.append(item);
  });

  container.append(spec, counts, listHeading, list);
  return container;
}

function renderPersonDetailView(
  manifest: Manifest,
  personId: string,
  onSelect: (id: string | null) => void,
): HTMLElement {
  const container = document.createElement('div');

  const backButton = document.createElement('button');
  backButton.type = 'button';
  backButton.textContent = 'Back to list';
  backButton.addEventListener('click', () => onSelect(null));

  const heading = document.createElement('h3');
  heading.textContent = 'Person Detail';

  const idLine = document.createElement('p');
  idLine.textContent = `ID: ${personId}`;

  const displayName = manifest.person_index[personId] ?? 'Unknown';
  const nameLine = document.createElement('p');
  nameLine.textContent = `Display name: ${displayName}`;

  const assertions = document.createElement('section');
  const assertionsHeading = document.createElement('h4');
  assertionsHeading.textContent = 'Assertions (coming next)';
  const assertionsStub = document.createElement('p');
  assertionsStub.textContent = 'Placeholder for assertion list.';

  assertions.append(assertionsHeading, assertionsStub);

  container.append(backButton, heading, idLine, nameLine, assertions);
  return container;
}
