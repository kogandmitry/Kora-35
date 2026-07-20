const STATUS_LABELS = {
  not_started: 'не начато',
  action_needed: 'к действию',
  in_progress: 'в работе',
  blocked: 'блокер',
  done: 'готово',
  archived: 'архив'
};

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatRub(value) {
  return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Number(value || 0))} ₽`;
}

export function renderHealthPanel(health) {
  const budgetCards = Number.isFinite(health.budgetEstimate) && Number.isFinite(health.budgetLimit)
    ? `
      <article class="metric metric-hero">
        <span class="metric-value small">≈ ${formatRub(health.budgetEstimate)}</span>
        <span class="metric-label">текущая пользовательская оценка</span>
      </article>
      <article class="metric">
        <span class="metric-value small">${formatRub(Math.abs(health.budgetHeadroom))}</span>
        <span class="metric-label">${health.budgetHeadroom >= 0 ? 'остаток до лимита 1 млн' : 'превышение лимита 1 млн'}</span>
      </article>`
    : '';
  return `
    <section class="health-grid" aria-label="Сводка проекта">
      <article class="metric metric-hero">
        <span class="metric-value">${health.daysLeft}</span>
        <span class="metric-label">дней до ${escapeHtml(health.eventDateLabel || 'главного события')}</span>
      </article>
      ${budgetCards}
      <article class="metric">
        <span class="metric-value">${health.averageReadiness}%</span>
        <span class="metric-label">средняя готовность</span>
      </article>
      <article class="metric">
        <span class="metric-value">${health.openActions}</span>
        <span class="metric-label">открытых действий</span>
      </article>
      <article class="metric">
        <span class="metric-value">${health.directionCount}</span>
        <span class="metric-label">видимых треков</span>
      </article>
      <article class="metric metric-wide">
        <span class="metric-value small">${escapeHtml(health.lastUpdated)}</span>
        <span class="metric-label">последнее обновление данных</span>
      </article>
    </section>
  `;
}

function safePercent(value) {
  const number = Number(value || 0);
  return Math.max(0, Math.min(100, Number.isFinite(number) ? number : 0));
}

function strokeWidth(strength) {
  return (1.2 + safePercent(strength) / 36).toFixed(2);
}

export function renderAnniversarySeries(series) {
  const filters = series.filters || [];
  const stages = series.stages?.length
    ? series.stages
    : [{ id: 'events', title: 'Этапы', summary: 'Подготовка, выезд и продолжение.', events: series.events || [] }];
  const activeId = series.activeFilter?.id || 'all';
  return `
    <div class="series-map" aria-label="Подготовка, выезд и продолжение проекта КОРА 35">
      <div class="series-controls" aria-label="Фильтры ленты мероприятий">
        ${filters.map((filter) => `
          <button
            class="series-filter"
            type="button"
            data-series-filter="${escapeHtml(filter.id)}"
            aria-pressed="${filter.id === activeId ? 'true' : 'false'}"
          >${escapeHtml(filter.title)}</button>
        `).join('')}
      </div>

      <div class="wellbeing-system-sketch">
        <div class="system-sketch-label">
          <strong>Выезд как часть живой системы отношений</strong>
          <span>35-летие — повод собраться; человечность, благодарность и продолжение — смысл</span>
        </div>
        <div class="track-flow-lines" aria-label="Цветные линии треков проекта">
          ${(series.trackLegend || []).map((track, index) => `
            <div class="track-flow-line" style="--track-color:${escapeHtml(track.color)}; --track-row:${index + 1}">
              <span>${escapeHtml(track.title)}</span>
              <i aria-hidden="true"></i>
            </div>
          `).join('')}
        </div>
        <div class="event-stage-grid">
          ${stages.map((stage) => `
            <section class="event-stage stage-${escapeHtml(stage.id)}">
              <div class="stage-head">
                <strong>${escapeHtml(stage.title)}</strong>
                <span>${escapeHtml(stage.summary)}</span>
              </div>
              <div class="event-river">
                ${stage.events.length ? stage.events.map((event) => `
                  <article class="event-card status-${escapeHtml(event.status)}">
                    <div class="event-marker" aria-hidden="true"></div>
                    <div class="event-body">
                      <div class="event-head">
                        <span>${escapeHtml(event.dateLabel)}</span>
                        <strong>${escapeHtml(event.title)}</strong>
                      </div>
                      <p>${escapeHtml(event.summary)}</p>
                      <div class="event-tracks" aria-label="Треки мероприятия">
                        ${event.tracks.map((track) => `
                          <span style="--track-color:${escapeHtml(track.color)}; background:${escapeHtml(track.color)}">${escapeHtml(track.title)}</span>
                        `).join('')}
                      </div>
                      <div class="event-artifacts" aria-label="Проявленные артефакты">
                        ${event.artifacts.length ? event.artifacts.map((artifact) => `
                          <button class="artifact-dot kind-${escapeHtml(artifact.kind)}" type="button" title="${escapeHtml(artifact.summary || artifact.title)}">
                            <strong>${escapeHtml(artifact.title)}</strong>
                            <small>${escapeHtml(artifact.trackTitles.join(' · ') || 'артефакт')}</small>
                          </button>
                        `).join('') : '<span class="artifact-empty">Нет проявленных артефактов для этого фильтра</span>'}
                      </div>
                    </div>
                  </article>
                `).join('') : '<p class="stage-empty">Сюда попадут следующие мероприятия и артефакты.</p>'}
              </div>
            </section>
          `).join('')}
        </div>
      </div>

      <div class="track-legend" aria-label="Цвета треков">
        ${(series.trackLegend || []).map((track) => `
          <span class="track-chip" style="--track-color:${escapeHtml(track.color)}; background:${escapeHtml(track.color)}">
            ${escapeHtml(track.title)}
          </span>
        `).join('')}
      </div>
    </div>
  `;
}

export function renderProjectMap(map) {
  const nodes = map.nodes || [];
  const links = map.links || [];
  return `
    <div class="project-map" aria-label="Схематическая карта проекта">
      <svg class="map-links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        ${links.map((link) => `
          <line
            class="map-link status-${escapeHtml(link.status || 'not_started')}"
            x1="${safePercent(link.x1)}" y1="${safePercent(link.y1)}"
            x2="${safePercent(link.x2)}" y2="${safePercent(link.y2)}"
            stroke-width="${strokeWidth(link.strength)}"
          />
        `).join('')}
      </svg>
      <div class="map-center">
        <strong>${escapeHtml(map.center?.title || 'КОРА 35')}</strong>
        <span>${escapeHtml(map.center?.subtitle || 'система заботы')}</span>
      </div>
      ${nodes.map((node) => `
        <button
          class="map-node status-${escapeHtml(node.status || 'not_started')}"
          type="button"
          data-direction-id="${escapeHtml(node.id)}"
          style="--x:${safePercent(node.x)}%;--y:${safePercent(node.y)}%;--readiness:${safePercent(node.readiness)}%;"
          aria-label="${escapeHtml(`${node.title}: ${safePercent(node.readiness)}%`)}"
        >
          <span class="node-pulse" aria-hidden="true"></span>
          <strong>${escapeHtml(node.title)}</strong>
          <small>${safePercent(node.readiness)}%</small>
        </button>
      `).join('')}
    </div>
  `;
}

function renderGrowthTags(types) {
  const labels = {
    vertical: 'вверх',
    horizontal: 'вширь',
    functional: 'функции',
    mentoring: 'наставничество',
    role_trial: 'новые роли'
  };
  if (!types?.length) return '';
  return `<div class="growth-tags" aria-label="Типы развития" data-growth-types="${escapeHtml(types.join(' '))}">
    ${types.map((type) => `<span>${escapeHtml(labels[type] || type)}</span>`).join('')}
  </div>`;
}

export function renderWellbeingMap(summary) {
  const items = summary.functions || [];
  if (!items.length) {
    return '<p class="empty">Для выбранного режима пока нет видимых функций благополучия.</p>';
  }
  return `
    <div class="wellbeing-map" aria-label="Карта формирования системы благополучия">
      <div class="wellbeing-score">
        <span>${safePercent(summary.averageFormation)}%</span>
        <strong>Карта формирования системы благополучия</strong>
        <small>показывает, какие части постоянной системы заботы уже формируются проектом</small>
      </div>
      <div class="wellbeing-pixels">
        ${items.map((item) => `
          <article
            class="wellbeing-pixel kind-${escapeHtml(item.kind || 'system')}"
            style="--formation:${safePercent(item.formation)}%;"
          >
            <span class="pixel-swatch" aria-hidden="true"></span>
            <strong>${escapeHtml(item.title)}</strong>
            <small>${safePercent(item.formation)}%</small>
            <p>${escapeHtml(item.summary || 'Функция формируется через связанные треки и артефакты.')}</p>
            ${item.directionTitles?.length ? `<em>${escapeHtml(item.directionTitles.join(' · '))}</em>` : ''}
            ${renderGrowthTags(item.growthTypes)}
          </article>
        `).join('')}
      </div>
    </div>
  `;
}

export function renderDirectionCard(direction) {
  const status = STATUS_LABELS[direction.status] || direction.status;
  return `
    <article class="direction-card status-${escapeHtml(direction.status)}">
      <button class="direction-open" type="button" data-direction-id="${escapeHtml(direction.id)}">
        <span>
          <strong>${escapeHtml(direction.title)}</strong>
          <small>${escapeHtml(status)} · ${escapeHtml(direction.owner || 'владелец уточняется')}</small>
        </span>
        <span class="readiness">${Number(direction.readiness || 0)}%</span>
      </button>
      <p>${escapeHtml(direction.summary)}</p>
      <div class="progress" aria-hidden="true"><i style="width:${Number(direction.readiness || 0)}%"></i></div>
    </article>
  `;
}

export function renderDirectionGrid(directions) {
  return directions.map(renderDirectionCard).join('');
}

export function renderIncomingQueue(items) {
  if (!items.length) {
    return '<p class="empty">Пока нет входящих комментариев в этом браузере.</p>';
  }
  return items.map((item) => `
    <article class="incoming-item">
      <strong>${escapeHtml(item.kindLabel)}</strong>
      <p>${escapeHtml(item.text)}</p>
      <small>${escapeHtml(item.createdAt)}</small>
    </article>
  `).join('');
}

export function renderDirectionDetail(detail) {
  if (!detail.direction) return '<p class="empty">Трек не найден или скрыт для выбранной роли.</p>';
  const row = (item) => `
    <li>
      <strong>${escapeHtml(item.title)}</strong>
      <small>${escapeHtml(STATUS_LABELS[item.status] || item.status || 'статус не задан')}${item.dueDate ? ` · ${escapeHtml(item.dueDate)}` : ''}</small>
    </li>
  `;
  return `
    <div class="section-head">
      <p class="eyebrow">Уровни 2-4</p>
      <h2>${escapeHtml(detail.direction.title)}</h2>
    </div>
    <p>${escapeHtml(detail.direction.summary)}</p>
    <div class="detail-columns">
      <section>
        <h3>Подпроекты</h3>
        <ul>${detail.subprojects.length ? detail.subprojects.map(row).join('') : '<li>Нет видимых подпроектов</li>'}</ul>
      </section>
      <section>
        <h3>Задачи</h3>
        <ul>${detail.tasks.length ? detail.tasks.map(row).join('') : '<li>Нет видимых задач</li>'}</ul>
      </section>
      <section>
        <h3>Риски</h3>
        <ul>${detail.risks.length ? detail.risks.map(row).join('') : '<li>Нет видимых рисков</li>'}</ul>
      </section>
    </div>
  `;
}

export function renderSourceList(sources) {
  return sources.map((source) => `
    <article class="source-item">
      <strong>${escapeHtml(source.title)}</strong>
      <p>${escapeHtml(source.type || 'source')} · ${escapeHtml(source.freshness || 'unknown')} · проверено ${escapeHtml(source.lastChecked || 'неизвестно')}</p>
    </article>
  `).join('');
}

function formatDate(value) {
  if (!value) return 'срок уточняется';
  const [year, month, day] = String(value).slice(0, 10).split('-');
  return day && month && year ? `${day}.${month}.${year}` : String(value);
}

function formatTaskCount(value) {
  const count = Number(value) || 0;
  const mod100 = count % 100;
  const mod10 = count % 10;
  const noun = mod100 >= 11 && mod100 <= 14 ? 'задач' : mod10 === 1 ? 'задача' : mod10 >= 2 && mod10 <= 4 ? 'задачи' : 'задач';
  return `${count} ${noun}`;
}

export function renderActionBoard(board, grouping = 'track') {
  const tasks = board.tasks || [];
  const activeGrouping = grouping === 'owner' ? 'owner' : 'track';
  const groups = board.groups?.[activeGrouping] || (tasks.length ? [{ id: 'all', title: 'Все задачи', tasks }] : []);
  const renderTask = (task) => `
    <article class="action-row status-${escapeHtml(task.status)} ${task.overdue ? 'is-overdue' : ''}">
      <span class="action-status">${escapeHtml(STATUS_LABELS[task.status] || task.status)}</span>
      <div class="action-task-main">
        <strong>${escapeHtml(task.title)}</strong>
        <div class="action-meta">
          <small><b>Трек:</b> ${escapeHtml(task.directionTitle || 'Без трека')}</small>
          <small><b>Ответственные:</b> ${escapeHtml(task.owner || 'владелец уточняется')}</small>
        </div>
      </div>
      <time datetime="${escapeHtml(task.dueDate || '')}">${task.overdue ? 'просрочено · ' : ''}${escapeHtml(formatDate(task.dueDate))}</time>
    </article>
  `;
  return `
    <div class="action-summary">
      <article><strong>${tasks.length}</strong><span>открытых задач</span></article>
      <article class="${board.overdueCount ? 'attention' : ''}"><strong>${board.overdueCount}</strong><span>с просроченной датой</span></article>
      <article><strong>${board.blockedCount}</strong><span>блокеров</span></article>
      <article><strong>${board.ownerUnknownCount}</strong><span>владельцев нужно назначить</span></article>
    </div>
    <div class="action-group-controls" role="group" aria-label="Группировка задач">
      <span>Показать задачи:</span>
      <button type="button" class="action-group-button" data-action-group="track" aria-pressed="${activeGrouping === 'track'}">По трекам</button>
      <button type="button" class="action-group-button" data-action-group="owner" aria-pressed="${activeGrouping === 'owner'}">По ответственным</button>
    </div>
    <div class="action-groups" data-action-group-view="${activeGrouping}">
      ${groups.length ? groups.map((group) => `
        <details class="action-group" open style="--action-group-color:${escapeHtml(group.color || '#8fac45')}">
          <summary><strong>${escapeHtml(group.title)}</strong><span>${formatTaskCount(group.tasks.length)}</span></summary>
          <div class="action-list">${group.tasks.map(renderTask).join('')}</div>
        </details>
      `).join('') : '<p class="empty">Нет открытых задач для этой аудитории.</p>'}
    </div>
  `;
}

export function renderDecisionBoard(board) {
  return `
    <div class="decision-grid">
      <section>
        <h3>Решения и предложения</h3>
        <div class="decision-list">
          ${(board.decisions || []).length ? board.decisions.map((item) => `
            <article class="decision-item">
              <time>${escapeHtml(formatDate(item.createdAt))}</time>
              <p>${escapeHtml(item.text)}</p>
            </article>
          `).join('') : '<p class="empty">Нет новых решений.</p>'}
        </div>
      </section>
      <section>
        <h3>Ключевые риски</h3>
        <div class="decision-list">
          ${(board.risks || []).length ? board.risks.map((risk) => `
            <article class="risk-item severity-${escapeHtml(risk.severity || 'medium')}">
              <strong>${escapeHtml(risk.title)}</strong>
              <p>${escapeHtml(risk.mitigation || 'План снижения риска уточняется.')}</p>
            </article>
          `).join('') : '<p class="empty">Нет открытых рисков.</p>'}
        </div>
      </section>
    </div>
  `;
}

export function renderBudgetBoard(view, audience) {
  if (!view) return '<p class="empty">Бюджетные данные не загрузились.</p>';
  const maxBlock = Math.max(1, ...view.blocks.map((item) => item.amount));
  const headroomLabel = view.headroom >= 0 ? 'свободно до потолка' : 'превышение потолка';
  return `
    <div class="budget-scenarios" aria-label="Сценарии бюджета">
      ${view.scenarios.map((scenario) => `
        <button type="button" class="budget-scenario ${scenario.id === view.scenario.id ? 'active' : ''}" data-budget-scenario="${escapeHtml(scenario.id)}" aria-pressed="${scenario.id === view.scenario.id}">
          <span>${escapeHtml(scenario.id)}</span><strong>${formatRub(scenario.total)}</strong>
        </button>
      `).join('')}
    </div>
    <div class="budget-metrics">
      <article class="budget-metric primary"><strong>${formatRub(view.total)}</strong><span>выбранный сценарий</span></article>
      <article class="budget-metric"><strong>${formatRub(view.ceiling)}</strong><span>потолок</span></article>
      <article class="budget-metric ${view.headroom < 0 ? 'danger' : ''}"><strong>${formatRub(Math.abs(view.headroom))}</strong><span>${headroomLabel}</span></article>
      <article class="budget-metric"><strong>${formatRub(view.reserve)}</strong><span>резерв</span></article>
      <article class="budget-metric"><strong>${formatRub(view.perPerson)}</strong><span>на участника</span></article>
    </div>
    <div class="budget-layout">
      <section class="budget-blocks">
        <h3>Бюджет по блокам</h3>
        ${view.blocks.map((block) => `
          <div class="budget-bar"><span>${escapeHtml(block.title)}</span><i><b style="width:${Math.max(1, block.amount / maxBlock * 100).toFixed(1)}%"></b></i><strong>${formatRub(block.amount)}</strong></div>
        `).join('')}
      </section>
      <aside class="budget-note">
        <strong>${view.unestimatedCount} неоценённых расходов</strong>
        <p>Они сохранены в реестре, но не увеличивают сумму сценария до появления оценки.</p>
        <small>${escapeHtml(view.sourceVersion)} · актуальность ${escapeHtml(formatDate(view.asOf))}</small>
      </aside>
    </div>
    ${audience === 'org' ? `
      <details class="budget-details" open>
        <summary>Построчные расходы · ${view.lines.length} строк</summary>
        <div class="budget-table-wrap">
          <table class="budget-table">
            <thead><tr><th>Блок</th><th>Статья</th><th>Количество</th><th>Сумма</th><th>Статус цены</th><th>Ответственный</th><th>Следующий шаг</th></tr></thead>
            <tbody>${view.lines.map((line) => `
              <tr class="${line.amount === 0 ? 'zero-line' : ''}">
                <td>${escapeHtml(line.block)}</td><td><strong>${escapeHtml(line.item)}</strong>${line.parentItem ? `<small>${escapeHtml(line.parentItem)}</small>` : ''}</td><td>${escapeHtml(line.quantity)}</td><td>${line.amount ? formatRub(line.amount) : '—'}</td><td>${escapeHtml(line.priceStatus)}</td><td>${escapeHtml(line.owner)}</td><td>${escapeHtml(line.nextStep)}</td>
              </tr>
            `).join('')}</tbody>
          </table>
        </div>
      </details>
    ` : '<p class="customer-boundary">Версия заказчиков показывает сценарии и блоки. Построчные действия, рабочие владельцы и закупочные комментарии остаются в версии орггруппы.</p>'}
  `;
}
