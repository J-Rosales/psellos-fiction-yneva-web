export function renderNarrativeLayerToggle(): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'narrative-layer';

  const label = document.createElement('label');
  label.textContent = 'Narrative layer ';

  const select = document.createElement('select');
  select.name = 'narrative-layer';
  select.setAttribute('aria-label', 'Narrative layer');

  const options = ['canon', 'faction_a', 'faction_b'];
  options.forEach((optionValue) => {
    const option = document.createElement('option');
    option.value = optionValue;
    option.textContent = optionValue;
    select.append(option);
  });

  label.append(select);
  wrapper.append(label);

  return wrapper;
}
