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
  renderWellbeingMap,
  renderSourceList,
  renderTrackProgress
} from '../src/render.js';

test('escapes html text', () => {
  assert.equal(escapeHtml('<script>x</script>'), '&lt;script&gt;x&lt;/script&gt;');
});

test('renders health panel with key metrics', () => {
  const html = renderHealthPanel({ daysLeft: 32, eventDateLabel: '15 августа', eventTimeStaff: '10:00–15:00', eventTimeOrganizers: 'с 08:30', averageReadiness: 45, openActions: 7, directionCount: 6, lastUpdated: '2026-07-14', budgetEstimate: 955000, budgetLimit: 1000000, budgetHeadroom: 45000 });
  assert.match(html, /32/);
  assert.match(html, /45%/);
  assert.match(html, /7/);
  assert.match(html, /955 000 ₽|955 000 ₽/);
  assert.match(html, /15 августа/);
  assert.match(html, /10:00–15:00/);
  assert.match(html, /с 08:30/);
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

test('renders action board with owner and due date', () => {
  const task = { title: 'Получить КП', owner: 'Нияз', directionTitle: 'Программа', dueDate: '2026-07-20', status: 'action_needed' };
  const board = {
    tasks: [task],
    groups: {
      track: [{ id: 'program', title: 'Программа', color: '#6fb24a', tasks: [task] }],
      owner: [{ id: 'Нияз', title: 'Нияз', tasks: [task] }]
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
  assert.match(renderActionBoard(board, 'owner'), /data-action-group-view="owner"/);
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

test('renders customer budget without operational table', () => {
  const html = renderBudgetBoard({
    scenario: { id: 'Рабочее ядро' }, scenarios: [{ id: 'Рабочее ядро', total: 992500 }], total: 992500, ceiling: 1000000,
    headroom: 7500, participants: 300, perPerson: 3308.33, reserve: 30000, options: 0, unestimatedCount: 15,
    blocks: [{ title: 'Питание', amount: 176500 }], lines: [], sourceVersion: 'Смета', asOf: '2026-07-19'
  }, 'customer');
  assert.match(html, /992 500 ₽|992 500 ₽/);
  assert.match(html, /Версия заказчиков/);
  assert.doesNotMatch(html, /budget-table/);
});

test('renders unestimated and potential budget lines under closed details', () => {
  const line = { block: 'Питание', item: 'Торт', quantity: '—', amount: 0, priceStatus: 'не оценено', owner: 'питание', nextStep: 'получить КП' };
  const html = renderBudgetBoard({
    scenario: { id: 'Рабочее ядро' }, scenarios: [{ id: 'Рабочее ядро', total: 100 }], total: 100, ceiling: 1000,
    headroom: 900, participants: 10, perPerson: 10, reserve: 0, options: 0, unestimatedCount: 1,
    blocks: [{ title: 'Питание', amount: 100 }], lines: [], unestimatedLines: [line], potentialLines: [], potentialTotal: 0,
    cutCandidates: [], cutCandidateTotal: 0, sourceVersion: 'Смета', asOf: '2026-07-20'
  }, 'org');
  assert.match(html, /Неоценённые расходы/);
  assert.doesNotMatch(html, /под\s+капот/i);
  assert.match(html, /Торт/);
  assert.doesNotMatch(html, /budget-underhood budget-unestimated" open/);
});
