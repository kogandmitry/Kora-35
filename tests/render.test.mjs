import test from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeHtml,
  renderActionBoard,
  renderAnniversarySeries,
  renderBudgetBoard,
  renderChildrenJourney,
  renderDecisionBoard,
  renderDirectionCard,
  renderDirectionDetail,
  renderHealthPanel,
  renderIncomingQueue,
  renderProjectMap,
  renderTeamFunctionsBoard,
  renderWellbeingMap,
  renderSourceList,
  renderTrackProgress
} from '../src/render.js';

test('escapes html text', () => {
  assert.equal(escapeHtml('<script>x</script>'), '&lt;script&gt;x&lt;/script&gt;');
});

test('renders health panel with key metrics', () => {
  const health = { daysLeft: 32, eventDateLabel: '15 августа', eventTimeStaff: '10:00–15:00', eventTimeOrganizers: 'с 08:30', averageReadiness: 45, openActions: 7, directionCount: 6, lastUpdated: '2026-07-14', budgetEstimate: 955000, budgetMaximum: 1010000, budgetLimit: 1000000 };
  const html = renderHealthPanel(health);
  assert.match(html, /32/);
  assert.match(html, /45%/);
  assert.match(html, /7/);
  assert.match(html, /955 000 ₽|955 000 ₽/);
  assert.match(html, /1 010 000 ₽|1 010 000 ₽/);
  assert.match(html, /максимум всех оценённых статей/);
  assert.match(html, /15 августа/);
  assert.match(html, /10:00–15:00/);
  assert.match(html, /с 08:30/);
  assert.doesNotMatch(renderHealthPanel(health, { showBudget: false }), /955 000 ₽|955 000 ₽/);
});

test('renders direction card with drilldown button', () => {
  const html = renderDirectionCard({ id: 'children', title: 'Дети', readiness: 70, status: 'action_needed', summary: 'Закрытие' });
  assert.match(html, /data-direction-id="children"/);
  assert.match(html, /Дети/);
  assert.match(html, /70%/);
});

test('renders empty incoming queue', () => {
  const html = renderIncomingQueue([]);
  assert.match(html, /Пока нет входящих/);
});

test('renders direction detail safely', () => {
  const html = renderDirectionDetail({
    direction: { title: 'Управление', summary: 'Монитор' },
    subprojects: [{ title: 'Релиз', status: 'in_progress', dueDate: '2026-07-07' }],
    tasks: [{ title: 'Собрать JSON', status: 'in_progress', dueDate: '2026-07-05' }],
    risks: []
  });
  assert.match(html, /Управление/);
  assert.match(html, /Собрать JSON/);
});

test('renders source list', () => {
  const html = renderSourceList([{ title: 'Master State', freshness: 'partial', lastChecked: '2026-07-05' }]);
  assert.match(html, /Master State/);
  assert.match(html, /partial/);
});

test('renders schematic project map with clickable direction nodes', () => {
  const html = renderProjectMap({
    center: { title: 'КОРА 35', subtitle: 'система заботы' },
    nodes: [
      { id: 'children', title: 'Дети', status: 'action_needed', readiness: 70, x: 18, y: 62 },
      { id: 'growth', title: 'Развитие', status: 'in_progress', readiness: 45, x: 68, y: 24 }
    ],
    links: [
      { id: 'link-children', from: 'center', to: 'children', x1: 50, y1: 50, x2: 18, y2: 62, strength: 70 },
      { id: 'link-growth', from: 'center', to: 'growth', x1: 50, y1: 50, x2: 68, y2: 24, strength: 45 }
    ]
  });
  assert.match(html, /class="project-map"/);
  assert.match(html, /data-direction-id="children"/);
  assert.match(html, /Дети/);
  assert.match(html, /stroke-width/);
});

test('renders wellbeing formation pixel map', () => {
  const html = renderWellbeingMap({
    averageFormation: 40,
    functions: [
      { id: 'recognition', title: 'Признание', formation: 55, summary: 'Вклад виден', directionTitles: ['Признание'] },
      {
        id: 'employee-growth',
        title: 'Развитие сотрудника',
        formation: 25,
        summary: 'Вертикальная и горизонтальная карьера',
        directionTitles: ['Система благополучия'],
        growthTypes: ['vertical', 'horizontal', 'functional']
      }
    ]
  });
  assert.match(html, /Карта формирования системы благополучия/);
  assert.match(html, /Развитие сотрудника/);
  assert.match(html, /vertical/);
  assert.match(html, /40%/);
});

test('renders anniversary series with filter controls and artifacts', () => {
  const html = renderAnniversarySeries({
    activeFilter: { id: 'organizer-wellbeing', title: 'Благополучие организаторов' },
    filters: [
      { id: 'all', title: 'Все' },
      { id: 'organizer-wellbeing', title: 'Благополучие организаторов' }
    ],
    trackLegend: [
      { id: 'children', title: 'Дети', color: '#75b843' },
      { id: 'management', title: 'Управление', color: '#d6a900' }
    ],
    stages: [
      {
        id: 'seed',
        title: '1. Уже сделано',
        summary: 'Первые прототипы человеческой включенности.',
        events: [
          {
            id: 'event-1',
            title: 'Подготовка юбилея',
            dateLabel: 'июль',
            status: 'in_progress',
            summary: 'Команда примеряет новые функции.',
            tracks: [{ id: 'management', title: 'Управление', color: '#d6a900' }],
            artifacts: [
              {
                id: 'artifact-1',
                title: 'Горизонтальная роль координатора',
                kind: 'role',
                status: 'in_progress',
                trackTitles: ['Управление'],
                summary: 'Новая функция в проекте.'
              }
            ],
            artifactCount: 1
          }
        ]
      },
      { id: 'assembly', title: '2. Сборка выезда', summary: 'Связи треков.', events: [] },
      { id: 'legacy', title: '3. Выезд и продолжение', summary: 'Следующие волны инициатив.', events: [] }
    ],
    events: [
      {
        id: 'event-1',
        title: 'Подготовка юбилея',
        dateLabel: 'июль',
        status: 'in_progress',
        summary: 'Команда примеряет новые функции.',
        tracks: [{ id: 'management', title: 'Управление', color: '#d6a900' }],
        artifacts: [
          {
            id: 'artifact-1',
            title: 'Горизонтальная роль координатора',
            kind: 'role',
            status: 'in_progress',
            trackTitles: ['Управление'],
            summary: 'Новая функция в проекте.'
          }
        ],
        artifactCount: 1
      }
    ]
  });
  assert.match(html, /series-filter/);
  assert.match(html, /aria-pressed="true"/);
  assert.match(html, /Благополучие организаторов/);
  assert.match(html, /Горизонтальная роль координатора/);
  assert.match(html, /wellbeing-system-sketch/);
  assert.match(html, /track-flow-line/);
  assert.match(html, /1\. Уже сделано/);
  assert.match(html, /3\. Выезд и продолжение/);
  assert.ok(html.indexOf('event-stage-grid') < html.indexOf('track-legend'));
});

test('renders action board with owner, due date and first-priority marker', () => {
  const task = { id: 'task-quote', title: 'Получить КП', owner: 'Нияз', directionTitle: 'Программа', dueDate: '2026-07-20', status: 'action_needed', priorityLabel: 'Первая очередь', priorityRank: 1 };
  const board = {
    tasks: [task],
    groups: {
      track: [{ id: 'program', title: 'Программа', color: '#6fb24a', tasks: [task] }],
      owner: [
        { id: 'niyaz', title: 'Нияз Кашапов', currentRole: 'Ведущий; координация активностей на базе', functions: ['спорт', 'награждения'], statusLabel: 'согласовать', tasks: [task] },
        { id: 'igor', title: 'Игорь Коган', currentRole: 'Контроль сайта мероприятия', functions: ['сайт'], tasks: [] }
      ]
    },
    overdueCount: 0,
    blockedCount: 0,
    ownerUnknownCount: 0
  };
  const html = renderActionBoard(board, 'track');
  assert.match(html, /Получить КП/);
  assert.match(html, /Нияз/);
  assert.match(html, /По трекам/);
  assert.match(html, /1 задача/);
  assert.match(html, /data-action-group-view="track"/);
  assert.match(html, /data-task-status="done"/);
  assert.match(html, /✓ Выполнена/);
  assert.match(html, /data-task-status="archived"/);
  assert.match(html, /Первая очередь · 1/);
  assert.match(html, /is-first-priority/);
  const ownerHtml = renderActionBoard(board, 'owner');
  assert.match(ownerHtml, /data-action-group-view="owner"/);
  assert.match(ownerHtml, /Нияз Кашапов/);
  assert.match(ownerHtml, /координация активностей на базе/);
  assert.match(ownerHtml, /Игорь Коган/);
  assert.match(ownerHtml, /Открытых задач сейчас нет/);
});

test('renders locally closed tasks with restore control', () => {
  const html = renderActionBoard({
    tasks: [],
    groups: { owner: [], track: [] },
    overdueCount: 0,
    blockedCount: 0,
    ownerUnknownCount: 0
  }, 'owner', [], [{ id: 'task-done', title: 'Готовая задача', status: 'done' }]);
  assert.match(html, /Закрыто в этом браузере · 1/);
  assert.match(html, /Готовая задача/);
  assert.match(html, /data-task-status="restore"/);
});

test('hides the surname placeholder in organizer headings', () => {
  const boardHtml = renderActionBoard({
    tasks: [],
    groups: { owner: [{ id: 'guzel', title: 'Гузель (фамилия уточняется)', currentRole: 'Коммуникации', tasks: [] }], track: [] },
    overdueCount: 0,
    blockedCount: 0,
    ownerUnknownCount: 0
  }, 'owner');
  const teamHtml = renderTeamFunctionsBoard({
    items: [{ name: 'Гузель (фамилия уточняется)', currentRole: 'Коммуникации', eventFunctions: [], futureFunctions: [], status: 'active' }],
    activeCount: 1,
    confirmationCount: 0,
    futureFunctionCount: 0
  });
  assert.match(boardHtml, />Гузель</);
  assert.match(teamHtml, />Гузель</);
  assert.doesNotMatch(`${boardHtml}${teamHtml}`, /фамилия уточняется/);
});

test('renders compact track progress with direct values', () => {
  const html = renderTrackProgress([{ id: 'children', title: 'Детский трек', color: '#f0c94b', score: 45, total: 5, done: 1, inProgress: 2, attention: 2 }]);
  assert.match(html, /Детский трек/);
  assert.match(html, /45%/);
  assert.match(html, /готово 1/);
});

test('renders children journey with three stations and contest first', () => {
  const html = renderChildrenJourney({
    summary: 'Путь детского трека',
    stations: [
      { id: 'excursion', title: 'Экскурсия', dateLabel: '24 июня', status: 'done' },
      { id: 'contest', title: 'Конкурс', dateLabel: 'сейчас', status: 'in_progress' },
      { id: 'nature', title: 'Выезд', dateLabel: '15 августа', status: 'action_needed' }
    ],
    futureLabel: 'Другие активности',
    announcements: [
      { kind: 'contest', title: 'Придавая форму воображению. КОРА глазами детей', lead: 'Участие', details: 'Пять призов' },
      { kind: 'excursion', title: 'Детская экскурсия · 24 июня', lead: 'Первая станция', details: 'Материалы' }
    ]
  });
  assert.match(html, /children-route/);
  assert.match(html, /Придавая форму воображению/);
  assert.ok(html.indexOf('Придавая форму воображению') < html.indexOf('Детская экскурсия'));
});

test('renders decision board and risk mitigation', () => {
  const html = renderDecisionBoard({ decisions: [{ createdAt: '2026-07-19', text: 'Разделить монитор' }], risks: [{ title: 'Права GitHub', severity: 'high', mitigation: 'Выдать доступ' }] });
  assert.match(html, /Решения и предложения/);
  assert.match(html, /Разделить монитор/);
  assert.match(html, /Выдать доступ/);
});

test('renders detailed customer budget without internal operational fields', () => {
  const approved = { block: 'Питание', item: 'Обед', quantity: '300 чел.', amount: 120000, priceStatus: 'утверждено', owner: 'орггруппа', nextStep: 'заказать' };
  const unestimated = { block: 'Питание', item: 'Доплата при изменении явки', quantity: '—', amount: 0, priceStatus: 'не оценено', owner: 'орггруппа', nextStep: 'уточнить' };
  const potential = { block: 'Дополнительно', item: 'Опция', candidateAmount: 70000, priceStatus: 'не активировано', basis: 'требует решения', nextStep: 'согласовать' };
  const html = renderBudgetBoard({
    scenario: { id: 'Рабочее ядро' }, scenarios: [{ id: 'Рабочее ядро', total: 992500 }], total: 992500, ceiling: 1000000,
    headroom: 7500, participants: 300, perPerson: 3308.33, reserve: 30000, options: 0, unestimatedCount: 15, potentialTotal: 70000, totalWithAdditional: 1062500,
    blocks: [{ title: 'Питание', amount: 176500 }], lines: [approved], unestimatedLines: [unestimated], potentialLines: [potential], potentialCount: 1,
    cutCandidates: [], cutCandidateTotal: 0, sourceVersion: 'Смета', asOf: '2026-07-19'
  }, 'customer');
  assert.match(html, /992 500 ₽|992 500 ₽/);
  assert.match(html, /1 062 500 ₽|1 062 500 ₽/);
  assert.match(html, /основная сумма сметы проекта/);
  assert.match(html, /максимальная сумма всех оценённых статей/);
  assert.match(html, /Заказчикам показана полная финансовая структура/);
  assert.match(html, /Статьи основной сметы проекта · 1 строк/);
  assert.match(html, /Обед/);
  assert.match(html, /Доплата при изменении явки/);
  assert.match(html, /Деактивированные и неутверждённые статьи с известной оценкой/);
  assert.doesNotMatch(html, /budget-scenarios/);
  assert.doesNotMatch(html, /data-budget-scenario/);
  assert.match(html, /customer-budget-table/);
  assert.doesNotMatch(html, /Ответственный/);
  assert.doesNotMatch(html, /Следующий шаг/);
  assert.doesNotMatch(html, /заказать|уточнить|согласовать/);
});

test('renders unestimated and potential budget lines under closed details', () => {
  const line = { block: 'Питание', item: 'Торт', quantity: '—', amount: 0, priceStatus: 'не оценено', owner: 'питание', nextStep: 'получить КП' };
  const candidate = { block: 'Дополнительно (пересмотреть)', item: 'Волонтёрство', candidateAmount: 5000, priceStatus: 'не активировано', basis: 'идея', nextStep: 'согласовать' };
  const html = renderBudgetBoard({
    scenario: { id: 'Рабочее ядро' }, scenarios: [{ id: 'Рабочее ядро', total: 100 }], total: 100, ceiling: 1000,
    headroom: 900, participants: 10, perPerson: 10, reserve: 0, options: 0, unestimatedCount: 1,
    blocks: [{ title: 'Питание', amount: 100 }], lines: [], unestimatedLines: [line], potentialLines: [candidate], potentialCount: 1, potentialTotal: 5000,
    cutCandidates: [], cutCandidateTotal: 0, sourceVersion: 'Смета', asOf: '2026-07-20'
  }, 'org');
  assert.match(html, /Неоценённые расходы/);
  assert.match(html, /Общий бюджет юбилейного проекта/);
  assert.match(html, /Деактивированные и неутверждённые статьи с известной оценкой · 1 поз\./);
  assert.doesNotMatch(html, /budget-scenarios/);
  assert.doesNotMatch(html, /под\s+капот/i);
  assert.match(html, /Торт/);
  assert.match(html, /Дополнительно \(пересмотреть\) · не активировано/);
  assert.doesNotMatch(html, /budget-underhood budget-unestimated" open/);
});
