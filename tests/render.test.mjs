import test from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeHtml,
  renderAnniversarySeries,
  renderDirectionCard,
  renderDirectionDetail,
  renderHealthPanel,
  renderIncomingQueue,
  renderProjectMap,
  renderWellbeingMap,
  renderSourceList
} from '../src/render.js';

test('escapes html text', () => {
  assert.equal(escapeHtml('<script>x</script>'), '&lt;script&gt;x&lt;/script&gt;');
});

test('renders health panel with key metrics', () => {
  const html = renderHealthPanel({ daysLeft: 41, averageReadiness: 45, openActions: 7, directionCount: 6, lastUpdated: '2026-07-05' });
  assert.match(html, /41/);
  assert.match(html, /45%/);
  assert.match(html, /7/);
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
        title: '1. Зарождение',
        summary: 'Первые прототипы заботы.',
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
      { id: 'assembly', title: '2. Сборка', summary: 'Связи треков.', events: [] },
      { id: 'legacy', title: '3. Закрепление', summary: 'Система после юбилея.', events: [] }
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
  assert.match(html, /1\. Зарождение/);
  assert.match(html, /3\. Закрепление/);
  assert.ok(html.indexOf('event-stage-grid') < html.indexOf('track-legend'));
});
