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

export function renderTrackProgress(items = []) {
  return `
    <div class="track-progress-list" aria-label="Степень реализации по трекам">
      ${items.map((item) => `
        <article class="track-progress-item" style="--track-color:${escapeHtml(item.color || '#8fac45')};--track-progress:${Math.max(0, Math.min(100, Number(item.score) || 0))}%">
          <div class="track-progress-head"><strong>${escapeHtml(item.title)}</strong><b>${Math.round(Number(item.score) || 0)}%</b></div>
          <div class="track-progress-bar" role="progressbar" aria-label="${escapeHtml(item.title)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(Number(item.score) || 0)}"><i></i></div>
          <small>${formatTaskCount(item.total)} · готово ${item.done} · в работе ${item.inProgress} · требуют действия ${item.attention}</small>
        </article>
      `).join('')}
    </div>
    <p class="track-progress-note">Расчёт: готово — 100%, в работе — 60%, требует действия — 20%, блокер или не начато — 0%. Система благополучия показана последней как продолжение после выезда.</p>
  `;
}

function childJourneyIcon(id) {
  const icons = {
    excursion: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 34h32M12 31V17l12-7 12 7v14M18 31v-8h12v8M17 18h3m8 0h3"/></svg>',
    contest: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 36l7-23 21 7-7 20zM17 13l14 27M14 27l21 7M30 10l2 5m6-1-4 4"/></svg>',
    nature: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M7 37h34M12 37l9-18 8 18M26 37l7-13 8 13M17 18l4-7 4 7"/></svg>'
  };
  return icons[id] || icons.contest;
}

export function renderChildrenJourney(journey) {
  if (!journey) return '<p class="empty">Детская траектория уточняется.</p>';
  return `
    <p class="children-journey-intro">${escapeHtml(journey.summary || '')}</p>
    <div class="children-route" aria-label="Динамика детского трека">
      ${(journey.stations || []).map((station, index) => `
        <article class="children-station status-${escapeHtml(station.status || 'not_started')}">
          <span class="children-station-number">${index + 1}</span>
          <span class="children-station-icon">${childJourneyIcon(station.id)}</span>
          <small>${escapeHtml(station.dateLabel || '')}</small>
          <strong>${escapeHtml(station.title)}</strong>
          <p>${escapeHtml(station.description || '')}</p>
        </article>
      `).join('')}
      <div class="children-route-future"><i></i><span>＋</span><p>${escapeHtml(journey.futureLabel || '')}</p></div>
    </div>
    <div class="children-announcements">
      ${(journey.announcements || []).map((item) => `
        <article class="children-announcement kind-${escapeHtml(item.kind || 'note')}">
          <div><small>${item.kind === 'contest' ? 'Творческий конкурс' : 'Первая станция трека'}</small><h3>${escapeHtml(item.title)}</h3></div>
          <p>${escapeHtml(item.lead || '')}</p>
          <p class="children-announcement-detail">${escapeHtml(item.details || '')}</p>
        </article>
      `).join('')}
    </div>
  `;
}

export function renderActionBoard(board, grouping = 'owner', taskComments = []) {
  const tasks = board.tasks || [];
  const activeGrouping = grouping === 'owner' ? 'owner' : 'track';
  const groups = board.groups?.[activeGrouping] || (tasks.length ? [{ id: 'all', title: 'Все задачи', tasks }] : []);
  const commentsByTask = new Map();
  for (const comment of taskComments) {
    if (!commentsByTask.has(comment.taskId)) commentsByTask.set(comment.taskId, []);
    commentsByTask.get(comment.taskId).push(comment);
  }
  const renderTask = (task) => `
    <article class="action-row status-${escapeHtml(task.status)} ${task.overdue ? 'is-overdue' : ''}" data-task-id="${escapeHtml(task.id)}">
      <div class="action-row-grid">
        <span class="action-status">${escapeHtml(STATUS_LABELS[task.status] || task.status)}</span>
        <div class="action-task-main">
          <strong>${escapeHtml(task.title)}</strong>
          <div class="action-meta">
            <small><b>Трек:</b> ${escapeHtml(task.directionTitle || 'Без трека')}</small>
            <small><b>Ответственные:</b> ${escapeHtml(task.owner || 'владелец уточняется')}</small>
          </div>
        </div>
        <time datetime="${escapeHtml(task.dueDate || '')}">${task.overdue ? 'просрочено · ' : ''}${escapeHtml(formatDate(task.dueDate))}</time>
      </div>
      <details class="task-comments">
        <summary>＋ Прокомментировать${commentsByTask.get(task.id)?.length ? ` · ${commentsByTask.get(task.id).length}` : ''}</summary>
        <form class="task-comment-form" data-task-comment-form data-task-id="${escapeHtml(task.id)}">
          <label><span>Имя</span><input name="author" autocomplete="name" placeholder="Участник орггруппы"></label>
          <label><span>Комментарий</span><textarea name="comment" rows="2" required placeholder="Идея, уточнение или предложение по этой задаче"></textarea></label>
          <button type="submit">Добавить комментарий</button>
        </form>
        <div class="task-comment-list">
          ${(commentsByTask.get(task.id) || []).map((comment) => `
            <article><strong>${escapeHtml(comment.author || 'Орггруппа')}</strong><p>${escapeHtml(comment.text)}</p><small>${escapeHtml(comment.createdAt)}</small></article>
          `).join('')}
        </div>
      </details>
    </article>
  `;
  return `
    <div class="action-summary">
      <article><strong>${tasks.length}</strong><span>открытых задач</span></article>
      <article class="${board.overdueCount ? 'attention' : ''}"><strong>${board.overdueCount}</strong><span>с просроченной датой</span></article>
      <article><strong>${board.blockedCount}</strong><span>блокеров</span></article>
      <article><strong>${board.ownerUnknownCount}</strong><span>владельцев нужно назначить</span></article>
    </div>
    <p class="task-comment-warning">Комментарии сохраняются только в этом браузере. После согласования они переносятся в канонические задачи проекта и обе версии монитора.</p>
    <div class="action-group-controls" role="group" aria-label="Группировка задач">
      <span>Сгруппировать:</span>
      <button type="button" class="action-group-button" data-action-group="owner" aria-pressed="${activeGrouping === 'owner'}">По ответственным</button>
      <button type="button" class="action-group-button" data-action-group="track" aria-pressed="${activeGrouping === 'track'}">По трекам</button>
    </div>
    <div class="action-groups" data-action-group-view="${activeGrouping}">
      ${groups.length ? groups.map((group) => `
        <details class="action-group ${activeGrouping === 'owner' ? 'owner-action-card' : ''}" style="--action-group-color:${escapeHtml(group.color || '#8fac45')}">
          <summary>
            <div class="action-owner-summary">
              <strong>${escapeHtml(group.title)}</strong>
              ${activeGrouping === 'owner' ? `<small>${escapeHtml(group.currentRole || 'Функциональная роль уточняется')}</small>${group.functions?.length ? `<em>${group.functions.slice(0, 4).map(escapeHtml).join(' · ')}</em>` : ''}` : ''}
            </div>
            <span>${formatTaskCount(group.tasks.length)}</span>
          </summary>
          <div class="action-list">${group.tasks.map(renderTask).join('')}</div>
        </details>
      `).join('') : '<p class="empty">Нет открытых задач для этой аудитории.</p>'}
    </div>
  `;
}

export function renderTeamFunctionsBoard(view) {
  const items = view.items || [];
  return `
    <div class="team-function-summary">
      <article><strong>${items.length}</strong><span>сотрудников в трекере</span></article>
      <article><strong>${view.activeCount}</strong><span>роль подтверждена работой</span></article>
      <article><strong>${view.confirmationCount}</strong><span>нужно согласовать</span></article>
      <article><strong>${view.futureFunctionCount}</strong><span>потенциальных функций после выезда</span></article>
    </div>
    <div class="team-function-grid">
      ${items.map((item) => `
        <article class="team-function-card status-${escapeHtml(item.status || 'potential')}">
          <div class="team-function-head"><div><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.currentRole)}</span></div><em>${escapeHtml(item.statusLabel || item.status)}</em></div>
          <section><h3>На выезде</h3><ul>${(item.eventFunctions || []).map((value) => `<li>${escapeHtml(value)}</li>`).join('')}</ul></section>
          <section class="future-functions"><h3>После мероприятия</h3><ul>${(item.futureFunctions || []).map((value) => `<li>${escapeHtml(value)}</li>`).join('')}</ul></section>
          <p><b>Подтверждение:</b> ${escapeHtml(item.confirmation || 'требуется')}</p>
        </article>
      `).join('')}
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

function renderBudgetTable(lines = []) {
  return `
    <div class="budget-table-wrap">
      <table class="budget-table">
        <thead><tr><th>Блок</th><th>Статья</th><th>Количество</th><th>Сумма</th><th>Статус цены</th><th>Ответственный</th><th>Следующий шаг</th></tr></thead>
        <tbody>${lines.map((line) => `
          <tr class="${line.amount === 0 ? 'zero-line' : ''}">
            <td>${escapeHtml(line.block)}</td><td><strong>${escapeHtml(line.item)}</strong>${line.parentItem ? `<small>${escapeHtml(line.parentItem)}</small>` : ''}</td><td>${escapeHtml(line.quantity)}</td><td>${line.amount ? formatRub(line.amount) : '—'}</td><td>${escapeHtml(line.priceStatus)}</td><td>${escapeHtml(line.owner)}</td><td>${escapeHtml(line.nextStep)}</td>
          </tr>
        `).join('')}</tbody>
      </table>
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
          ${scenario.note ? `<small>${escapeHtml(scenario.note)}</small>` : ''}
        </button>
      `).join('')}
    </div>
    ${view.managerView ? '<p class="manager-budget-note">Локальная версия руководителя проекта · включает закрытый блок «Управление и после».</p>' : ''}
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
        <p>Они доступны в раскрывающемся разделе и не увеличивают сумму сценария до появления оценки.</p>
        <small>${escapeHtml(view.sourceVersion)} · актуальность ${escapeHtml(formatDate(view.asOf))}</small>
      </aside>
    </div>
    ${audience === 'org' ? `
      <details class="budget-details" open>
        <summary>Построчные расходы выбранного сценария · ${view.lines.length} строк</summary>
        ${renderBudgetTable(view.lines)}
      </details>
      <details class="budget-underhood budget-unestimated">
        <summary><span>Неоценённые расходы</span><strong>${view.unestimatedLines.length}</strong></summary>
        <p>Строки сохранены для контроля полноты, но скрыты из основного списка и не входят в сумму.</p>
        ${renderBudgetTable(view.unestimatedLines)}
      </details>
      <details class="budget-underhood budget-potential">
        <summary><span>Потенциальные статьи для активации</span><strong>${formatRub(view.potentialTotal)}</strong></summary>
        <div class="budget-candidate-list">
          ${view.potentialLines.length ? view.potentialLines.map((line) => `
            <article><div><strong>${escapeHtml(line.item)}</strong><p>${escapeHtml(line.basis || '')}</p><small>${escapeHtml(line.nextStep || '')}</small></div><aside><span>${escapeHtml(line.priceStatus)}</span><b>${formatRub(line.candidateAmount)}</b></aside></article>
          `).join('') : '<p class="empty">Нет неактивированных статей с оценкой.</p>'}
        </div>
      </details>
      <section class="budget-cuts">
        <div class="budget-subhead"><div><span>Финальный список</span><h3>Статьи-аутсайдеры — кандидаты на урезание</h3></div><strong>${formatRub(view.cutCandidateTotal)}</strong></div>
        <p>Это список для решения, а не автоматическое сокращение. Приоритеты нужно утвердить до новых обязательств.</p>
        <div class="budget-candidate-list cut-list">
          ${view.cutCandidates.length ? view.cutCandidates.map((line) => `
            <article><div><strong>${escapeHtml(line.item)}</strong><p>${escapeHtml(line.cutReason || 'Требуется решение о ценности и альтернативе.')}</p></div><aside><span>${escapeHtml(line.block)}</span><b>${formatRub(line.amount)}</b></aside></article>
          `).join('') : '<p class="empty">В выбранном сценарии нет активных кандидатов на сокращение.</p>'}
        </div>
      </section>
    ` : '<p class="customer-boundary">Версия заказчиков показывает сценарии и блоки. Построчные действия, рабочие владельцы и закупочные комментарии остаются в версии орггруппы.</p>'}
  `;
}
