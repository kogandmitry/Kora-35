import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  ROLE_IDS,
  STATUS_IDS,
  normalizeStatus,
  validateBudgetData,
  validateMonitorData
} from '../src/schema.js';

test('role and status constants include first-release values', () => {
  assert.deepEqual(ROLE_IDS, ['owner', 'customer', 'coordinator', 'participant', 'public']);
  assert.deepEqual(STATUS_IDS, ['not_started', 'action_needed', 'in_progress', 'blocked', 'done', 'archived']);
});

test('normalizes legacy status labels', () => {
  assert.equal(normalizeStatus('todo'), 'not_started');
  assert.equal(normalizeStatus('doing'), 'in_progress');
  assert.equal(normalizeStatus('done'), 'done');
  assert.equal(normalizeStatus('blocked'), 'blocked');
});

test('validates seeded monitor data', async () => {
  const data = JSON.parse(await readFile(new URL('../data/kora35-monitor.json', import.meta.url), 'utf8'));
  const result = validateMonitorData(data);
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.deepEqual(data.publicLinks.map((item) => item.id), ['org-monitor', 'customer-monitor']);
  assert.equal(new Set(data.publicLinks.map((item) => item.syncGroup)).size, 1);
  assert.equal(data.teamFunctions.some((item) => item.id === 'konstantin'), false);
  assert.deepEqual([...data.teamFunctions].sort((left, right) => left.order - right.order).slice(0, 5).map((item) => item.name), [
    'Дмитрий Коган', 'Дмитрий Кузьмич', 'Нияз Кашапов', 'Евгения Сенина', 'Гузель (фамилия уточняется)'
  ]);
  assert.equal(data.teamFunctions.find((item) => item.id === 'igor')?.name, 'Игорь Коган');
  assert.equal(data.teamFunctions.find((item) => item.id === 'igor')?.eventFunctions.includes('ремонт ноутбука'), false);
  assert.equal(data.tasks.some((item) => item.id === 'task-igor-laptop'), false);
  assert.equal(data.tasks.find((item) => item.id === 'task-igor-event-site-control')?.owner, 'Игорь Коган / Дмитрий Коган');
  assert.deepEqual(
    [
      'task-accounting-liteyshchik-deposit',
      'task-dmitry-korachki-letter-2026-07-22',
      'task-dmitry-gift-evgenia-senina-2026-07-22'
    ].map((id) => data.tasks.find((item) => item.id === id)?.dueDate),
    ['2026-07-22', '2026-07-22', '2026-07-22']
  );
  assert.deepEqual(
    data.tasks.find((item) => item.id === 'task-dmitry-gift-evgenia-senina-2026-07-22')?.visibility,
    ['owner']
  );
  assert.equal(data.budgetItems.find((item) => item.id === 'budget-current-estimate')?.amount, 933400);
  assert.equal(data.budgetItems.find((item) => item.id === 'budget-with-additional')?.amount, 1003400);
});

test('keeps public link registry synchronized with monitor links', async () => {
  const [data, registry] = await Promise.all([
    readFile(new URL('../data/kora35-monitor.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../data/kora35-public-links.json', import.meta.url), 'utf8').then(JSON.parse)
  ]);
  assert.deepEqual(
    data.publicLinks.map((item) => item.url),
    registry.links.map((item) => item.url)
  );
  assert.deepEqual(
    data.publicLinks.map((item) => item.liveUrl),
    registry.links.map((item) => item.liveUrl)
  );
});

test('keeps the customer monitor focused on track readiness and aggregate budget', async () => {
  const html = await readFile(new URL('../customer/index.html', import.meta.url), 'utf8');
  assert.match(html, /id="trackProgressBoard"/);
  assert.match(html, /Ключевые показатели бюджета/);
  assert.doesNotMatch(html, /Решения и ключевые риски/);
  assert.doesNotMatch(html, /Семьи сотрудников/);
  assert.doesNotMatch(html, /childrenJourneyBoard/);
});

test('keeps the org monitor headings concise', async () => {
  const html = await readFile(new URL('../org/index.html', import.meta.url), 'utf8');
  assert.match(html, /<h1>КОРА 35<br>штаб подготовки<\/h1>/);
  assert.match(html, /<h2>Состояние проекта<\/h2>/);
  assert.match(html, /<h2>Команда проекта<\/h2>/);
  assert.doesNotMatch(html, /Степень реализации по трекам/);
  assert.doesNotMatch(html, /Люди и продолжение/);
});

test('rejects missing project title', () => {
  const result = validateMonitorData({ project: {}, directions: [], subprojects: [], tasks: [], risks: [], updates: [] });
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /project.title/);
});

test('validates wellbeing functions and referenced directions', () => {
  const result = validateMonitorData({
    project: { title: 'КОРА 35', eventDate: '2026-08-15', lastUpdated: '2026-07-05' },
    directions: [{ id: 'wellbeing', title: 'Система', status: 'in_progress' }],
    subprojects: [],
    tasks: [],
    risks: [],
    updates: [],
    people: [],
    budgetItems: [],
    sources: [],
    wellbeingFunctions: [
      {
        id: 'employee-growth',
        title: 'Развитие сотрудника',
        formation: 35,
        directionIds: ['wellbeing'],
        growthTypes: ['vertical', 'horizontal', 'functional']
      }
    ]
  });
  assert.equal(result.ok, true, result.errors.join('\n'));
});

test('rejects wellbeing functions with missing direction references', () => {
  const result = validateMonitorData({
    project: { title: 'КОРА 35', eventDate: '2026-08-15', lastUpdated: '2026-07-05' },
    directions: [],
    subprojects: [],
    tasks: [],
    risks: [],
    updates: [],
    people: [],
    budgetItems: [],
    sources: [],
    wellbeingFunctions: [
      {
        id: 'employee-growth',
        title: 'Развитие сотрудника',
        formation: 35,
        directionIds: ['missing']
      }
    ]
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /wellbeingFunction employee-growth references missing direction missing/);
});

test('validates anniversary events and artifacts references', () => {
  const result = validateMonitorData({
    project: { title: 'КОРА 35', eventDate: '2026-08-15', lastUpdated: '2026-07-06' },
    directions: [{ id: 'management', title: 'Управление', status: 'in_progress' }],
    subprojects: [],
    tasks: [],
    risks: [],
    updates: [],
    people: [],
    budgetItems: [],
    sources: [],
    anniversaryEvents: [
      { id: 'event-1', title: 'Подготовка', trackIds: ['management'] }
    ],
    eventArtifacts: [
      { id: 'artifact-1', title: 'Новая роль', eventId: 'event-1', trackIds: ['management'], filterIds: ['organizer-wellbeing'] }
    ]
  });
  assert.equal(result.ok, true, result.errors.join('\n'));
});

test('rejects anniversary artifacts with missing event references', () => {
  const result = validateMonitorData({
    project: { title: 'КОРА 35', eventDate: '2026-08-15', lastUpdated: '2026-07-06' },
    directions: [{ id: 'management', title: 'Управление', status: 'in_progress' }],
    subprojects: [],
    tasks: [],
    risks: [],
    updates: [],
    people: [],
    budgetItems: [],
    sources: [],
    anniversaryEvents: [],
    eventArtifacts: [
      { id: 'artifact-1', title: 'Новая роль', eventId: 'missing', trackIds: ['management'] }
    ]
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /eventArtifact artifact-1 references missing event missing/);
});

test('validates detailed budget data', async () => {
  const budget = JSON.parse(await readFile(new URL('../data/kora35-budget.json', import.meta.url), 'utf8'));
  const result = validateBudgetData(budget);
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.equal(budget.lines.length, 51);
  assert.equal(budget.scenarios.find((scenario) => scenario.id === 'Рабочее ядро')?.total, 1050400);
  assert.equal(budget.lines.find((line) => line.id === 'sound')?.amounts['Рабочее ядро'], 85000);
  assert.equal(budget.lines.find((line) => line.id === 'sound')?.block, 'Медиа и цифровой контур');
  assert.equal(budget.lines.some((line) => line.id === 'custom_1784502249652'), false);
  assert.equal(budget.lines.find((line) => line.id === 'management-ai-infrastructure')?.amounts['Рабочее ядро'], 12000);
  assert.equal(budget.lines.find((line) => line.id === 'candidate_daily_documentary_week')?.candidateAmount, 0);
  assert.equal(budget.lines.find((line) => line.id === 'candidate_daily_documentary_week')?.owner, 'Евгения Сенина');
  assert.equal(budget.lines.find((line) => line.id === 'photo_video_event')?.amounts['Рабочее ядро'], 20000);
  assert.equal(budget.lines.find((line) => line.id === 'goldberg')?.activationStatus, 'not_activated');
  assert.equal(budget.lines.find((line) => line.id === 'cake')?.amounts['Рабочее ядро'], 15000);
  assert.equal(budget.lines.some((line) => line.id === 'snacks' || line.id === 'candidate_cake'), false);
  assert.equal(budget.lines.find((line) => line.id === 'candidate_3d_glasses_rental')?.priceStatus, 'не оценено');
  assert.equal(budget.lines.find((line) => line.id === 'lina')?.item, 'Йога или стретчинг. Фитнес-тренер');
  for (const movedId of ['artifact_contest_gifts', 'quiz_other', 'workshops', 'boardgames', 'sports', 'ops', 'candidate_3d_glasses_rental', 'candidate_teen_volunteers']) {
    assert.equal(budget.lines.find((line) => line.id === movedId)?.block, 'Дополнительно (пересмотреть)', `${movedId} must be in review category`);
  }
  assert.match(budget.lines.find((line) => line.id === 'sports')?.parentItem || '', /100 ₽\/час/);
  const publicLines = budget.lines.filter((line) => line.block !== 'Управление и после');
  const approvedTotal = publicLines.reduce((sum, line) => sum + (Number(line.amounts?.['Рабочее ядро']) || 0), 0);
  const additionalTotal = publicLines
    .filter((line) => Number(line.candidateAmount) > 0 && line.activationStatus !== 'active')
    .reduce((sum, line) => sum + Number(line.candidateAmount), 0);
  assert.equal(approvedTotal, 933400);
  assert.equal(approvedTotal + additionalTotal, 1003400);
  for (const removedId of ['unestimated_7', 'unestimated_9', 'unestimated_10', 'unestimated_11', 'unestimated_12', 'unestimated_13', 'waste', 'rain', 'generator', 'state_awards', 'extended_video', 'reserve_extra', 'candidate_org_team_functional_compensation']) {
    assert.equal(budget.lines.some((line) => line.id === removedId), false, `${removedId} must stay deleted`);
  }
});
