import type { ProsopographyData } from '../data/prosopography';

export function renderRelationshipGraph(data: ProsopographyData): HTMLElement {
  const section = document.createElement('section');
  section.className = 'view';

  const heading = document.createElement('h2');
  heading.textContent = 'Relationship Graph';

  const description = document.createElement('p');
  description.textContent =
    'Placeholder for relationship graph visualization. A graph is rendered here once data contracts are finalized.';

  const stub = document.createElement('p');
  stub.className = 'stub';
  stub.textContent = 'Stub view: graph rendering is pending.';

  const metadata = document.createElement('p');
  metadata.textContent = `Loaded relationships: ${data.relationships.length}`;

  const todo = document.createElement('p');
  todo.className = 'todo';
  todo.textContent =
    'TODO: integrate graph layout once relationship schema (nodes, edges, metadata) is confirmed.';

  section.append(heading, description, stub, metadata, todo);
  return section;
}
