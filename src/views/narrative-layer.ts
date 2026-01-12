function isMissingLayer(layers: string[], selectedLayer: string): boolean {
  return selectedLayer !== '' && !layers.includes(selectedLayer);
}

export function renderNarrativeLayerToggle(
  layers: string[],
  selectedLayer: string,
  onSelect: (layerId: string) => void,
): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'narrative-layer';

  const label = document.createElement('label');
  label.textContent = 'Narrative layer ';

  const select = document.createElement('select');
  select.name = 'narrative-layer';
  select.setAttribute('aria-label', 'Narrative layer');

  layers.forEach((layerId) => {
    const option = document.createElement('option');
    option.value = layerId;
    option.textContent = layerId;
    select.append(option);
  });

  const status = document.createElement('span');
  status.className = 'narrative-layer__status';

  const updateStatus = (layerId: string) => {
    if (isMissingLayer(layers, layerId)) {
      status.textContent = `Current layer: ${layerId} (missing)`;
      status.hidden = false;
    } else {
      status.textContent = '';
      status.hidden = true;
    }
  };

  select.value = selectedLayer;
  updateStatus(selectedLayer);

  select.addEventListener('change', (event) => {
    const target = event.target;
    if (target instanceof HTMLSelectElement) {
      updateStatus(target.value);
      onSelect(target.value);
    }
  });

  label.append(select);
  wrapper.append(label, status);

  return wrapper;
}
