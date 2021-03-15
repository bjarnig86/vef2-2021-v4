import { fetchEarthquakes } from './lib/earthquakes';
import { el, element, formatDate } from './lib/utils';
import { init, createPopup, clearMarkers } from './lib/map';
import { pl } from 'date-fns/locale';

async function index(type, period) {
  // Tökum hidden úr loading elementinu
  const loading = document.querySelector('.loading');
  loading.classList.remove('.hidden');

  const earthquakes = await fetchEarthquakes(type, period);
  console.log('earthquakes :>> ', earthquakes);

  // Burt með gamla markers
  clearMarkers();

  // bætum hidden aftur við loading þegar upplýsingar hafa verið sóttar
  loading.classList.add('.hidden');

  // const parent = loading.parentNode;
  // loading.textContent = '';

  if (!earthquakes) {
    document.appendChild(el('p', 'Villa við að sækja gögn'));
  }

  const timeNode = document.querySelector('.cache');
  const ul = document.querySelector('.earthquakes');

  const { elapsed, cache } = earthquakes.info;

  // Einföldum! Breytum bara texta í nóðu og hugsum ekki um að bæta við/fjarlægja nóðum innan
  const cacheText = `Fyrirspurn tók ${elapsed} sekúndur. Gögn eru ${cache ? '' : 'ekki'} í cache`;
  timeNode.textContent = cacheText;

  earthquakes.data.features.forEach((quake) => {
    const { title, mag, time, url } = quake.properties;
    const link = element(
      'a',
      { href: url, target: '_blank' },
      null,
      'Skoða nánar',
    );

    const markerContent = el(
      'div',
      el('h3', title),
      el('p', formatDate(time)),
      el('p', link),
    );
    const marker = createPopup(quake.geometry, markerContent.outerHTML);

    const onClick = () => {
      marker.openPopup();
    };

    const li = el('li');

    li.appendChild(
      el(
        'div',
        el('h2', title),
        el(
          'dl',
          el('dt', 'Tími'),
          el('dd', formatDate(time)),
          el('dt', 'Styrkur'),
          el('dd', `${mag} á richter`),
          el('dt', 'Nánar'),
          el('dd', url.toString()),
        ),
        element(
          'div',
          { class: 'buttons' },
          null,
          element('button', null, { click: onClick }, 'Sjá á korti'),
          link,
        ),
      ),
    );

    ul.appendChild(li);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  // TODO
  // Bæta við virkni til að sækja úr lista
  // Nota proxy
  // Hreinsa header og upplýsingar þegar ný gögn eru sótt
  // Sterkur leikur að refactora úr virkni fyrir event handler í sér fall
  const map = document.querySelector('.map');
  init(map);

  const linkar = document.querySelectorAll('ul.nav a');

  linkar.forEach((link) => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();

      const url = new URL(link.href);
      const { searchParams } = url;
      const type = searchParams.get('type');
      const period = searchParams.get('period');

      index(type, period);
    });
  });
});
