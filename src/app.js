import { validateMonitorData } from './schema.js';
import {
  buildActionBoard,
  buildAnniversarySeries,
  buildBudgetView,
  buildDecisionBoard,
  buildHealthSummary,
  buildProjectMap,
  buildTeamFunctionsView,
  buildWellbeingSummary,
  filterVisible,
  getDirectionDetail
} from './model.js';
import {
  renderActionBoard,
  renderAnniversarySeries,
  renderBudgetBoard,
  renderChildrenJourney,
  renderDecisionBoard,
  renderDirectionDetail,
  renderDirectionGrid,
  renderHealthPanel,
  renderIncomingQueue,
  renderProjectMap,
  renderTeamFunctionsBoard,
  renderWellbeingMap,
  renderSourceList,
  renderTrackProgress
} from './render.js';

const locationParams = new URLSearchParams(window.location.search);
const localOwnerMode = ['127.0.0.1', 'localhost'].includes(window.location.hostname) && locationParams.get('role') === 'owner';
const config = {
  role: localOwnerMode ? 'owner' : (document.body.dataset.role || 'public'),
  audience: document.body.dataset.audience || 'public',
  dataUrl: document.body.dataset.dataUrl || './data/kora35-monitor.json',
  budgetUrl: document.body.dataset.budgetUrl || './data/kora35-budget.json'
};
const STORE_KEY = `kora35-monitor-incoming-v2-${config.role}`;
const TASK_COMMENT_STORE_KEY = `kora35-task-comments-v1-${config.role}`;
const state = {
  data: null,
  budget: null,
  role: config.role,
  audience: config.audience,
  budgetScenario: 'Рабочее ядро',
  actionGrouping: 'owner',
  seriesFilter: 'all',
  incoming: loadIncoming(),
  taskComments: loadTaskComments()
};

const els = Object.fromEntries([
  'healthPanel', 'eventSeries', 'projectMap', 'wellbeingMap', 'directionGrid',
  'detail', 'detailContent', 'incomingForm', 'incomingQueue', 'sourceList',
  'actionBoard', 'trackProgressBoard', 'childrenJourneyBoard', 'teamFunctionsBoard', 'decisionBoard', 'budgetBoard'
].map((id) => [id, document.querySelector(`#${id}`)]));

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

function loadTaskComments() {
  try {
    return JSON.parse(localStorage.getItem(TASK_COMMENT_STORE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveTaskComments() {
  localStorage.setItem(TASK_COMMENT_STORE_KEY, JSON.stringify(state.taskComments));
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
  const actionBoard = buildActionBoard(data, state.role);
  if (els.healthPanel) els.healthPanel.innerHTML = renderHealthPanel(buildHealthSummary(data, state.role));
  if (els.eventSeries) els.eventSeries.innerHTML = renderAnniversarySeries(buildAnniversarySeries(data, state.role, state.seriesFilter));
  if (els.projectMap) els.projectMap.innerHTML = renderProjectMap(buildProjectMap(data, state.role));
  if (els.wellbeingMap) els.wellbeingMap.innerHTML = renderWellbeingMap(buildWellbeingSummary(data, state.role));
  if (els.directionGrid) els.directionGrid.innerHTML = renderDirectionGrid([...filterVisible(data.directions, state.role)].sort((left, right) => Number(left.id === 'wellbeing-system') - Number(right.id === 'wellbeing-system')));
  if (els.incomingQueue) els.incomingQueue.innerHTML = renderIncomingQueue(state.incoming);
  if (els.sourceList) els.sourceList.innerHTML = renderSourceList(data.sources || []);
  if (els.trackProgressBoard) els.trackProgressBoard.innerHTML = renderTrackProgress(actionBoard.trackProgress);
  if (els.childrenJourneyBoard) els.childrenJourneyBoard.innerHTML = renderChildrenJourney(data.childrenJourney);
  if (els.actionBoard) els.actionBoard.innerHTML = renderActionBoard(actionBoard, state.actionGrouping, state.taskComments);
  if (els.teamFunctionsBoard) els.teamFunctionsBoard.innerHTML = renderTeamFunctionsBoard(buildTeamFunctionsView(data, state.role));
  if (els.decisionBoard) els.decisionBoard.innerHTML = renderDecisionBoard(buildDecisionBoard(data, state.role));
  if (els.budgetBoard) els.budgetBoard.innerHTML = renderBudgetBoard(buildBudgetView(state.budget, state.audience, state.budgetScenario, state.role), state.audience);
}

function openDirection(directionId) {
  if (!els.detail || !els.detailContent) return;
  const detail = getDirectionDetail(state.data, directionId, state.role);
  els.detail.hidden = false;
  els.detailContent.innerHTML = renderDirectionDetail(detail);
  els.detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return response.json();
}

async function init() {
  [state.data, state.budget] = await Promise.all([
    fetchJson(config.dataUrl),
    fetchJson(config.budgetUrl)
  ]);
  const validation = validateMonitorData(state.data);
  if (!validation.ok) throw new Error(validation.errors.join('\n'));
  state.budgetScenario = state.budget.meta?.workingScenario || state.budgetScenario;
  render();
}

els.directionGrid?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-direction-id]');
  if (button) openDirection(button.dataset.directionId);
});

els.projectMap?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-direction-id]');
  if (button) openDirection(button.dataset.directionId);
});

els.eventSeries?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-series-filter]');
  if (!button) return;
  state.seriesFilter = button.dataset.seriesFilter;
  render();
});

els.budgetBoard?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-budget-scenario]');
  if (!button) return;
  state.budgetScenario = button.dataset.budgetScenario;
  render();
});

els.actionBoard?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action-group]');
  if (!button) return;
  state.actionGrouping = button.dataset.actionGroup;
  render();
});

els.actionBoard?.addEventListener('submit', (event) => {
  const formElement = event.target.closest('[data-task-comment-form]');
  if (!formElement) return;
  event.preventDefault();
  const form = new FormData(formElement);
  const text = String(form.get('comment') || '').trim();
  if (!text) return;
  state.taskComments.unshift({
    id: crypto.randomUUID(),
    taskId: formElement.dataset.taskId,
    author: String(form.get('author') || '').trim() || 'Орггруппа',
    text,
    createdAt: new Date().toLocaleString('ru-RU')
  });
  saveTaskComments();
  render();
});

els.incomingForm?.addEventListener('submit', (event) => {
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

document.querySelector('.floating-idea-button')?.addEventListener('click', () => {
  window.setTimeout(() => els.incomingForm?.querySelector('textarea')?.focus(), 250);
});

init().catch((error) => {
  document.body.innerHTML = `<main class="panel"><h1>Монитор не загрузился</h1><pre>${error.message}</pre></main>`;
});
