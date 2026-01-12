import './style.css';
import { loadManifest } from './data/loadManifest';
import { renderManifestApp } from './views/manifest-app';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('App root not found');
}

const header = document.createElement('header');
const title = document.createElement('h1');
const subtitle = document.createElement('p');

header.className = 'site-header';

title.textContent = 'Psellos Web';
subtitle.textContent =
  'Static explorer for compiled prosopographical data from psellos-builder.';

header.append(title, subtitle);

const status = document.createElement('p');
status.className = 'status';
status.textContent = 'Loading manifest...';

const main = document.createElement('main');
main.className = 'site-main';

app.append(header, status, main);

loadManifest()
  .then((manifest) => {
    status.textContent = 'Loaded manifest.';
    main.append(renderManifestApp(manifest));
  })
  .catch((error: Error) => {
    status.textContent = 'Failed to load manifest.';

    const errorMessage = document.createElement('pre');
    errorMessage.textContent = error.message;
    errorMessage.className = 'error';
    main.append(errorMessage);
  });
