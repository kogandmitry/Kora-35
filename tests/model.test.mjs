import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildActionBoard,
  buildAnniversarySeries,
  buildBudgetView,
  buildDecisionBoard,
  buildProjectMap,
  buildWellbeingSummary,
  buildHealthSummary,
  daysUntil,
  filterVisible,
  getDirectionDetail,
  getOpenActionCount,
  getRoleDepth
} from '../src/model.js';

const sample = {
  project: { eventDate: '2026-08-16', status: 'action_needed', lastUpdated: '2026-07-05' },
  roles: [{ id: 'owner', depth: 4 }, { id: 'participant', depth: 2 }],
  directions: [
    { id: 'a', title: 'A', readiness: 50, status: 'in_progress', visibility: ['owner', 'participant'] },
    { id: 'b', title: 'B', readiness: 10, status: 'blocked', visibility: ['owner'] }
  ],
  subprojects: [
    { id: 's1', directionId: 'a', title: 'S1', status: 'action_needed', visibility: ['owner', 'participant'] }
  ],
  tasks: [
    { id: 't1', directionId: 'a', status: 'action_needed', visibility: ['owner', 'participant'] },
    { id: 't2', directionId: 'b', status: 'blocked', visibility: ['owner'] }
  ],
  risks: [{ id: 'r1', directionId: 'b', status: 'action_needed', visibility: ['owner'] }],
  budgetItems: [
    { id: 'budget-project-limit', amount: 1000000, visibility: ['owner'] },
    { id: 'budget-current-estimate', amount: 955000, visibility: ['owner'] }
  ],
  seriesFilters: [
    { id: 'all', title: 'Все' },
    { id: 'organizer-wellbeing', title: 'Благополучие организаторов' }
  ],
  anniversaryEvents: [
    {
      id: 'event-a',
      title: 'Первое событие',
      dateLabel: 'июнь',
      stageId: 'seed',
      trackIds: ['a', 'b'],
      visibility: ['owner', 'participant']
    }
  ],
  eventArtifacts: [
    {
      id: 'artifact-visible',
      eventId: 'event-a',
      title: 'Новая роль координатора',
      trackIds: ['a'],
      filterIds: ['organizer-wellbeing'],
      visibility: ['owner', 'participant']
    },
    {
      id: 'artifact-owner',
      eventId: 'event-a',
      title: 'Внутренний риск',
      trackIds: ['b'],
      filterIds: ['organizer-wellbeing'],
      visibility: ['owner']
    }
  ],
  wellbeingFunctions: [
    {
      id: 'care',
      title: 'Забота',
      formation: 60,
      directionIds: ['a'],
      visibility: ['owner', 'participant']
    },
    {
      id: 'growth',
      title: 'Развитие сотрудника',
      formation: 20,
      directionIds: ['b'],
      visibility: ['owner'],
      growthTypes: ['vertical', 'horizontal', 'functional']
    }
  ],
  updates: []
};

test('daysUntil uses date-only UTC-safe math', () => {
  assert.equal(daysUntil('2026-08-16', new Date('2026-07-05T12:00:00+03:00')), 42);
});

test('builds anniversary event series with visible track colors', () => {
  const series = buildAnniversarySeries(sample, 'participant', 'all');
  assert.deepEqual(series.filters.map((item) => item.id), ['all', 'organizer-wellbeing']);
  assert.equal(series.events.length, 1);
  assert.deepEqual(series.events[0].tracks.map((item) => item.id), ['a']);
  assert.deepEqual(series.events[0].artifacts.map((item) => item.id), ['artifact-visible']);
});

test('filters anniversary artifacts for organizer wellbeing layer', () => {
  const series = buildAnniversarySeries(sample, 'owner', 'organizer-wellbeing');
  assert.equal(series.activeFilter.id, 'organizer-wellbeing');
  assert.deepEqual(series.events[0].artifacts.map((item) => item.id), ['artifact-visible', 'artifact-owner']);
  assert.equal(series.events[0].artifactCount, 2);
});

test('groups anniversary events into three strategic stages', () => {
  const series = buildAnniversarySeries(sample, 'participant', 'all');
  assert.deepEqual(series.stages.map((stage) => stage.id), ['seed', 'assembly', 'legacy']);
  assert.equal(series.stages[0].events[0].id, 'event-a');
  assert.deepEqual(series.stages[1].events, []);
  assert.deepEqual(series.stages[2].events, []);
});

test('role depth defaults safely', () => {
  assert.equal(getRoleDepth(sample, 'owner'), 4);
  assert.equal(getRoleDepth(sample, 'missing'), 1);
});

test('filters data by visibility', () => {
  const visible = filterVisible(sample.directions, 'participant');
  assert.deepEqual(visible.map((item) => item.id), ['a']);
});

test('counts open actions for visible items', () => {
  assert.equal(getOpenActionCount(sample, 'owner'), 4);
  assert.equal(getOpenActionCount(sample, 'participant'), 2);
});

test('builds health summary', () => {
  const health = buildHealthSummary(sample, 'owner', new Date('2026-07-05T12:00:00+03:00'));
  assert.equal(health.daysLeft, 42);
  assert.equal(health.openActions, 4);
  assert.equal(health.averageReadiness, 30);
  assert.equal(health.budgetEstimate, 955000);
  assert.equal(health.budgetHeadroom, 45000);
});

test('builds direction detail', () => {
  const detail = getDirectionDetail(sample, 'a', 'participant');
  assert.equal(detail.direction.id, 'a');
  assert.deepEqual(detail.subprojects.map((item) => item.id), ['s1']);
  assert.deepEqual(detail.tasks.map((item) => item.id), ['t1']);
});

test('builds schematic project map nodes for visible directions', () => {
  const map = buildProjectMap(sample, 'participant');
  assert.equal(map.center.title, 'КОРА 35');
  assert.deepEqual(map.nodes.map((item) => item.id), ['a']);
  assert.equal(map.links.length, 1);
  assert.equal(map.nodes[0].readiness, 50);
});

test('builds wellbeing formation summary with employee growth dimension', () => {
  const ownerSummary = buildWellbeingSummary(sample, 'owner');
  assert.equal(ownerSummary.averageFormation, 40);
  assert.equal(ownerSummary.functions.length, 2);
  assert.deepEqual(ownerSummary.functions.find((item) => item.id === 'growth').growthTypes, ['vertical', 'horizontal', 'functional']);

  const participantSummary = buildWellbeingSummary(sample, 'participant');
  assert.deepEqual(participantSummary.functions.map((item) => item.id), ['care']);
  assert.equal(participantSummary.averageFormation, 60);
});

test('builds audience action board and marks overdue tasks', () => {
  const board = buildActionBoard(sample, 'owner', new Date('2026-07-06T12:00:00+03:00'));
  assert.equal(board.tasks.length, 2);
  assert.equal(board.overdueCount, 0);
});

test('builds decisions and risks for a role', () => {
  const data = {
    ...sample,
    updates: [
      { id: 'u1', kind: 'decision', createdAt: '2026-07-19', text: 'Решение', visibility: ['owner'] },
      { id: 'u2', kind: 'proposal', createdAt: '2026-07-20', text: 'Предложение', visibility: ['owner'] }
    ]
  };
  const board = buildDecisionBoard(data, 'owner');
  assert.equal(board.decisions.length, 2);
  assert.equal(board.decisions[0].kind, 'proposal');
  assert.equal(board.risks.length, 1);
});

test('builds detailed and customer budget views', () => {
  const budget = {
    meta: { workingScenario: 'Рабочее ядро', ceiling: 1000000, sourceVersion: 'test', asOf: '2026-07-19' },
    scenarios: [{ id: 'Рабочее ядро', total: 130, participants: 10 }],
    lines: [
      { id: 'a', block: 'A', item: 'Ядро', type: 'ядро', priceStatus: 'лимит', amounts: { 'Рабочее ядро': 100 }, quantities: { 'Рабочее ядро': '1' } },
      { id: 'r', block: 'Резерв', item: 'Резерв', type: 'резерв', priceStatus: 'решение', amounts: { 'Рабочее ядро': 30 }, quantities: { 'Рабочее ядро': '1' } }
    ]
  };
  const org = buildBudgetView(budget, 'org', 'Рабочее ядро');
  const customer = buildBudgetView(budget, 'customer', 'Рабочее ядро');
  assert.equal(org.total, 130);
  assert.equal(org.reserve, 30);
  assert.equal(org.lines.length, 2);
  assert.equal(customer.lines.length, 0);
});
