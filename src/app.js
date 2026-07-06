import { validateMonitorData } from './schema.js';
import {
  buildAnniversarySeries,
  buildHealthSummary,
  buildProjectMap,
  buildWellbeingSummary,
  filterVisible,
  getDirectionDetail
} from './model.js';
import {
  renderAnniversarySeries,
  renderDirectionDetail,
  renderDirectionGrid,
  renderHealthPanel,
  renderIncomingQueue,
  renderProjectMap,
  renderWellbeingMap,
  renderSourceList
} from './render.js';

const STORE_KEY = 'kora35-monitor-incoming-v1';
const state = {
  data: null,
  role: 'public',
  seriesFilter: 'all',
  incoming: loadIncoming()
};

const els = {
  roleSelect: document.querySelector('#roleSelect'),
  healthPanel: document.querySelector('#healthPanel'),
  eventSeries: document.querySelector('#eventSeries'),
  projectMap: document.querySelector('#projectMap'),
  wellbeingMap: document.querySelector('#wellbeingMap'),
  directionGrid: document.querySelector('#directionGrid'),
  detail: document.querySelector('#detail'),
  detailContent: document.querySelector('#detailContent'),
  incomingForm: document.querySelector('#incomingForm'),
  incomingQueue: document.querySelector('#incomingQueue'),
  sourceList: document.querySelector('#sourceList')
};

function loadIncoming() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveIncoming() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state.incoming));
}

function classifyKind(kind) {
  return {
    comment: 'Комментарий',
    idea: 'Идея',
    risk: 'Риск',
    role: 'Зона ответственности',
    growth: 'Развитие сотрудника'
  }[kind] || 'Комментарий';
}

function render() {
  const data = state.data;
  const health = buildHealthSummary(data, state.role);
  els.healthPanel.innerHTML = renderHealthPanel(health);
  els.eventSeries.innerHTML = renderAnniversarySeries(buildAnniversarySeries(data, state.role, state.seriesFilter));
  els.projectMap.innerHTML = renderProjectMap(buildProjectMap(data, state.role));
  els.wellbeingMap.innerHTML = renderWellbeingMap(buildWellbeingSummary(data, state.role));
  els.directionGrid.innerHTML = renderDirectionGrid(filterVisible(data.directions, state.role));
  els.incomingQueue.innerHTML = renderIncomingQueue(state.incoming);
  els.sourceList.innerHTML = renderSourceList(data.sources || []);
}

function openDirection(directionId) {
  const detail = getDirectionDetail(state.data, directionId, state.role);
  els.detail.hidden = false;
  els.detailContent.innerHTML = renderDirectionDetail(detail);
  els.detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function init() {
  const response = await fetch('./data/kora35-monitor.json');
  state.data = await response.json();
  const validation = validateMonitorData(state.data);
  if (!validation.ok) {
    throw new Error(validation.errors.join('\n'));
  }
  render();
}

els.roleSelect.addEventListener('change', (event) => {
  state.role = event.target.value;
  els.detail.hidden = true;
  state.seriesFilter = 'all';
  render();
});

els.directionGrid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-direction-id]');
  if (!button) return;
  openDirection(button.dataset.directionId);
});

els.projectMap.addEventListener('click', (event) => {
  const button = event.target.closest('[data-direction-id]');
  if (!button) return;
  openDirection(button.dataset.directionId);
});

els.eventSeries.addEventListener('click', (event) => {
  const filterButton = event.target.closest('[data-series-filter]');
  if (!filterButton) return;
  state.seriesFilter = filterButton.dataset.seriesFilter;
  render();
});

els.incomingForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const text = String(form.get('text') || '').trim();
  if (!text) return;
  const kind = String(form.get('kind') || 'comment');
  state.incoming.unshift({
    id: crypto.randomUUID(),
    kind,
    kindLabel: classifyKind(kind),
    text,
    createdAt: new Date().toLocaleString('ru-RU')
  });
  saveIncoming();
  event.currentTarget.reset();
  render();
});

init().catch((error) => {
  document.body.innerHTML = `<main class="panel"><h1>Монитор не загрузился</h1><pre>${error.message}</pre></main>`;
});

