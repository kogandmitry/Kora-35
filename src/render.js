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
