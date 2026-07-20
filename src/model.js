const OPEN_STATUSES = new Set(['action_needed', 'blocked', 'in_progress']);
const FALLBACK_NODE_POSITIONS = [
  { x: 50, y: 18 },
  { x: 78, y: 32 },
  { x: 78, y: 68 },
  { x: 50, y: 82 },
  { x: 22, y: 68 },
  { x: 22, y: 32 },
  { x: 50, y: 50 }
];
const FALLBACK_TRACK_COLORS = ['#6fb24a', '#d8b52b', '#4fa987', '#7fb85b', '#b8c94a', '#62a477', '#a7bf3e'];
const DEFAULT_SERIES_FILTERS = [
  { id: 'all', title: 'Все' }
];
const DEFAULT_SERIES_STAGES = [
  {
    id: 'seed',
    title: '1. Уже сделано',
    summary: 'Первые события, решения и прототипы человеческой включенности.'
  },
  {
    id: 'assembly',
    title: '2. Сборка выезда',
    summary: 'Подрядчики, владельцы, материалы, сообщения и безопасные сценарии.'
  },
  {
    id: 'legacy',
    title: '3. Выезд и продолжение',
    summary: 'Отдых коллектива 15 августа и следующие волны инициатив.'
  }
];

function parseDateOnly(value) {
  const [year, month, day] = String(value).split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

export function daysUntil(dateOnly, now = new Date()) {
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.floor((parseDateOnly(dateOnly) - today) / 86400000));
}

export function getRoleDepth(data, roleId) {
  return data.roles?.find((role) => role.id === roleId)?.depth || 1;
}

export function isVisible(item, roleId) {
  if (!item.visibility || item.visibility.length === 0) return roleId === 'owner';
  return item.visibility.includes(roleId) || roleId === 'owner';
}

export function filterVisible(items, roleId) {
  return (items || []).filter((item) => isVisible(item, roleId));
}

function wellbeingLast(items) {
  return [...items].sort((left, right) => Number(left.id === 'wellbeing-system') - Number(right.id === 'wellbeing-system'));
}

export function getOpenActionCount(data, roleId) {
  const tasks = filterVisible(data.tasks, roleId).filter((task) => OPEN_STATUSES.has(task.status)).length;
  const risks = filterVisible(data.risks, roleId).filter((risk) => OPEN_STATUSES.has(risk.status)).length;
  const subprojects = filterVisible(data.subprojects, roleId).filter((subproject) => OPEN_STATUSES.has(subproject.status)).length;
  return tasks + risks + subprojects;
}

export function buildHealthSummary(data, roleId, now = new Date()) {
  const visibleDirections = filterVisible(data.directions, roleId);
  const visibleBudgetItems = filterVisible(data.budgetItems, roleId);
  const readiness = visibleDirections.map((item) => Number(item.readiness || 0));
  const averageReadiness = readiness.length
    ? Math.round(readiness.reduce((sum, value) => sum + value, 0) / readiness.length)
    : 0;

  const budgetLimit = Number(visibleBudgetItems.find((item) => item.id === 'budget-project-limit')?.amount);
  const budgetEstimate = Number(visibleBudgetItems.find((item) => item.id === 'budget-current-estimate')?.amount);
  const budgetMaximum = Number(visibleBudgetItems.find((item) => item.id === 'budget-with-additional')?.amount);
  const hasCurrentBudget = Number.isFinite(budgetLimit) && Number.isFinite(budgetEstimate);

  return {
    daysLeft: daysUntil(data.project.eventDate, now),
    eventDateLabel: data.project.eventDateLabel || data.project.eventDate,
    eventTimeStaff: data.project.eventTimeStaff || '',
    eventTimeOrganizers: data.project.eventTimeOrganizers || '',
    status: data.project.status,
    lastUpdated: data.project.lastUpdated,
    averageReadiness,
    openActions: getOpenActionCount(data, roleId),
    directionCount: visibleDirections.length,
    budgetEstimate: hasCurrentBudget ? budgetEstimate : null,
    budgetMaximum: Number.isFinite(budgetMaximum) ? budgetMaximum : null,
    budgetLimit: hasCurrentBudget ? budgetLimit : null
  };
}

function clampPercent(value) {
  const number = Number(value || 0);
  return Math.max(0, Math.min(100, Number.isFinite(number) ? number : 0));
}

export function buildProjectMap(data, roleId) {
  const visibleDirections = wellbeingLast(filterVisible(data.directions, roleId));
  const nodes = visibleDirections.map((direction, index) => {
    const fallback = FALLBACK_NODE_POSITIONS[index % FALLBACK_NODE_POSITIONS.length];
    const x = clampPercent(direction.map?.x ?? fallback.x);
    const y = clampPercent(direction.map?.y ?? fallback.y);

    return {
      id: direction.id,
      title: direction.title,
      status: direction.status,
      readiness: clampPercent(direction.readiness),
      owner: direction.owner,
      summary: direction.summary,
      x,
      y
    };
  });

  return {
    center: {
      title: data.project?.title || 'КОРА 35',
      subtitle: data.project?.subtitle || 'система заботы'
    },
    nodes,
    links: nodes.map((node) => ({
      id: `center-${node.id}`,
      from: 'center',
      to: node.id,
      x1: 50,
      y1: 50,
      x2: node.x,
      y2: node.y,
      strength: node.readiness,
      status: node.status
    }))
  };
}

export function buildWellbeingSummary(data, roleId) {
  const visibleDirections = filterVisible(data.directions, roleId);
  const directionsById = new Map(visibleDirections.map((direction) => [direction.id, direction]));
  const functions = filterVisible(data.wellbeingFunctions || [], roleId).map((item) => ({
    id: item.id,
    title: item.title,
    formation: clampPercent(item.formation),
    summary: item.summary,
    kind: item.kind || 'system',
    directionIds: item.directionIds || [],
    directionTitles: (item.directionIds || [])
      .map((directionId) => directionsById.get(directionId)?.title)
      .filter(Boolean),
    growthTypes: item.growthTypes || [],
    artifactIds: item.artifactIds || []
  }));
  const averageFormation = functions.length
    ? Math.round(functions.reduce((sum, item) => sum + item.formation, 0) / functions.length)
    : 0;

  return {
    averageFormation,
    functions
  };
}

export function buildAnniversarySeries(data, roleId, filterId = 'all') {
  const visibleDirections = wellbeingLast(filterVisible(data.directions, roleId));
  const directionsById = new Map(visibleDirections.map((direction, index) => [
    direction.id,
    {
      id: direction.id,
      title: direction.title,
      color: direction.color || FALLBACK_TRACK_COLORS[index % FALLBACK_TRACK_COLORS.length]
    }
  ]));
  const filters = (data.seriesFilters?.length ? data.seriesFilters : DEFAULT_SERIES_FILTERS)
    .filter((filter) => !filter.visibility || isVisible(filter, roleId));
  const activeFilter = filters.find((filter) => filter.id === filterId) || filters[0] || DEFAULT_SERIES_FILTERS[0];
  const visibleArtifacts = filterVisible(data.eventArtifacts || [], roleId);
  const shouldShowArtifact = (artifact) => activeFilter.id === 'all' || (artifact.filterIds || []).includes(activeFilter.id);

  const events = filterVisible(data.anniversaryEvents || [], roleId).map((event, index) => {
    const tracks = (event.trackIds || [])
      .map((directionId) => directionsById.get(directionId))
      .filter(Boolean);
    const artifacts = visibleArtifacts
      .filter((artifact) => artifact.eventId === event.id)
      .filter(shouldShowArtifact)
      .map((artifact) => ({
        id: artifact.id,
        title: artifact.title,
        kind: artifact.kind || 'artifact',
        status: artifact.status || 'not_started',
        summary: artifact.summary || '',
        filterIds: artifact.filterIds || [],
        wellbeingFunctionIds: artifact.wellbeingFunctionIds || [],
        trackTitles: (artifact.trackIds || [])
          .map((directionId) => directionsById.get(directionId)?.title)
          .filter(Boolean)
      }));

    return {
      id: event.id,
      title: event.title,
      dateLabel: event.dateLabel || event.date || '',
      stageId: event.stageId || DEFAULT_SERIES_STAGES[Math.min(DEFAULT_SERIES_STAGES.length - 1, Math.floor(index / 2))].id,
      status: event.status || 'not_started',
      summary: event.summary || '',
      tracks,
      artifacts,
      artifactCount: artifacts.length
    };
  });

  const legendIds = new Set(events.flatMap((event) => event.tracks.map((track) => track.id)));
  const stages = DEFAULT_SERIES_STAGES.map((stage) => ({
    ...stage,
    events: events.filter((event) => event.stageId === stage.id)
  }));

  return {
    activeFilter,
    filters,
    trackLegend: [...legendIds].map((id) => directionsById.get(id)).filter(Boolean),
    stages,
    events
  };
}

export function getDirectionDetail(data, directionId, roleId) {
  const direction = filterVisible(data.directions, roleId).find((item) => item.id === directionId) || null;
  return {
    direction,
    subprojects: filterVisible(data.subprojects, roleId).filter((item) => item.directionId === directionId),
    tasks: filterVisible(data.tasks, roleId).filter((item) => item.directionId === directionId),
    risks: filterVisible(data.risks, roleId).filter((item) => item.directionId === directionId),
    budgetItems: filterVisible(data.budgetItems, roleId).filter((item) => item.directionId === directionId || !item.directionId)
  };
}

export function buildActionBoard(data, roleId, now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const statusOrder = { blocked: 0, action_needed: 1, in_progress: 2, not_started: 3, done: 4, archived: 5 };
  const statusWeight = { done: 100, in_progress: 60, action_needed: 20, blocked: 0, not_started: 0 };
  const visibleDirections = wellbeingLast(filterVisible(data.directions, roleId));
  const directionById = new Map(visibleDirections.map((direction, index) => [direction.id, { ...direction, sortOrder: index }]));
  const primaryOwner = (owner) => String(owner || '').split('/').map((part) => part.trim()).find(Boolean) || 'Не назначен';
  const normalizeOwner = (value) => String(value || '')
    .toLocaleLowerCase('ru')
    .replaceAll('ё', 'е')
    .replace(/\s+/g, ' ')
    .trim();
  const visibleTeam = filterVisible(data.teamFunctions || [], roleId)
    .sort((left, right) => Number(left.order ?? 999) - Number(right.order ?? 999));
  const taskBelongsToPerson = (task, person) => {
    const owner = normalizeOwner(task.owner);
    const aliases = [person.name, ...(person.taskAliases || [])]
      .map(normalizeOwner)
      .filter(Boolean);
    return aliases.some((alias) => owner.includes(alias));
  };
  const allVisibleTasks = filterVisible(data.tasks, roleId).filter((task) => task.status !== 'archived');
  const tasks = allVisibleTasks
    .filter((task) => OPEN_STATUSES.has(task.status))
    .map((task) => {
      const direction = directionById.get(task.directionId);
      return {
        ...task,
        directionTitle: direction?.title || 'Без трека',
        directionColor: direction?.color || '#8fac45',
        directionSortOrder: direction?.sortOrder ?? 999,
        ownerGroup: primaryOwner(task.owner),
        overdue: Boolean(task.dueDate && task.dueDate < today)
      };
    })
    .sort((left, right) => {
      if (left.overdue !== right.overdue) return left.overdue ? -1 : 1;
      const statusDelta = (statusOrder[left.status] ?? 9) - (statusOrder[right.status] ?? 9);
      if (statusDelta) return statusDelta;
      return String(left.dueDate || '9999-12-31').localeCompare(String(right.dueDate || '9999-12-31'));
    });

  const groupTasks = (items, keyFor, titleFor) => {
    const groups = new Map();
    for (const task of items) {
      const key = keyFor(task);
      if (!groups.has(key)) groups.set(key, { id: key, title: titleFor(task), tasks: [] });
      groups.get(key).tasks.push(task);
    }
    return [...groups.values()];
  };
  const trackGroups = groupTasks(tasks, (task) => task.directionId || 'without-track', (task) => task.directionTitle)
    .map((group) => ({
      ...group,
      color: group.tasks[0]?.directionColor || '#8fac45',
      sortOrder: group.id === 'wellbeing-system' ? 10000 : (group.tasks[0]?.directionSortOrder ?? 999)
    }))
    .sort((left, right) => left.sortOrder - right.sortOrder || left.title.localeCompare(right.title, 'ru'));
  const ownerGroups = visibleTeam.length
    ? [
        ...visibleTeam.map((person) => {
          const personTasks = tasks.filter((task) => taskBelongsToPerson(task, person));
          return {
            id: person.id,
            title: person.name,
            tasks: personTasks,
            color: personTasks[0]?.directionColor || '#8fac45',
            currentRole: person.currentRole || 'Функциональная роль уточняется',
            functions: person.eventFunctions || [],
            statusLabel: person.statusLabel || ''
          };
        }),
        ...(() => {
          const otherTasks = tasks.filter((task) => !visibleTeam.some((person) => taskBelongsToPerson(task, person)));
          return otherTasks.length ? [{
            id: 'other-roles',
            title: 'Другие роли и подрядчики',
            tasks: otherTasks,
            color: otherTasks[0]?.directionColor || '#8fac45',
            currentRole: 'Профильные исполнители вне основного состава орггруппы',
            functions: [],
            statusLabel: ''
          }] : [];
        })()
      ]
    : groupTasks(tasks, (task) => task.ownerGroup, (task) => task.ownerGroup)
      .map((group) => ({
        ...group,
        color: group.tasks[0]?.directionColor || '#8fac45',
        currentRole: 'Функциональная роль уточняется',
        functions: [],
        statusLabel: ''
      }))
      .sort((left, right) => right.tasks.length - left.tasks.length || left.title.localeCompare(right.title, 'ru'));

  const trackProgress = visibleDirections.map((direction) => {
    const directionTasks = allVisibleTasks.filter((task) => task.directionId === direction.id);
    const total = directionTasks.length;
    const score = total
      ? Math.round(directionTasks.reduce((sum, task) => sum + (statusWeight[task.status] ?? 0), 0) / total)
      : Number(direction.readiness || 0);
    return {
      id: direction.id,
      title: direction.title,
      color: direction.color || '#8fac45',
      score,
      total,
      done: directionTasks.filter((task) => task.status === 'done').length,
      inProgress: directionTasks.filter((task) => task.status === 'in_progress').length,
      attention: directionTasks.filter((task) => ['action_needed', 'blocked', 'not_started'].includes(task.status)).length
    };
  });

  return {
    tasks,
    groups: { track: trackGroups, owner: ownerGroups },
    trackProgress,
    overdueCount: tasks.filter((task) => task.overdue).length,
    blockedCount: tasks.filter((task) => task.status === 'blocked').length,
    ownerUnknownCount: tasks.filter((task) => !task.owner || task.owner.includes('назначить')).length
  };
}

export function buildDecisionBoard(data, roleId) {
  const decisions = filterVisible(data.updates || [], roleId)
    .filter((update) => ['decision', 'budget_update', 'proposal'].includes(update.kind))
    .sort((left, right) => String(right.createdAt || '').localeCompare(String(left.createdAt || '')))
    .slice(0, 8);
  const risks = filterVisible(data.risks || [], roleId)
    .filter((risk) => OPEN_STATUSES.has(risk.status))
    .sort((left, right) => ({ high: 0, medium: 1, low: 2 }[left.severity] ?? 3) - ({ high: 0, medium: 1, low: 2 }[right.severity] ?? 3))
    .slice(0, 8);
  return { decisions, risks };
}

export function buildTeamFunctionsView(data, roleId) {
  const items = filterVisible(data.teamFunctions || [], roleId);
  const statusOrder = { active: 0, action_needed: 1, to_confirm: 2, contact_needed: 3, potential: 4 };
  return {
    items: [...items].sort((left, right) =>
      Number(left.order ?? 999) - Number(right.order ?? 999)
      || (statusOrder[left.status] ?? 9) - (statusOrder[right.status] ?? 9)
      || String(left.name).localeCompare(String(right.name), 'ru')
    ),
    activeCount: items.filter((item) => item.status === 'active').length,
    confirmationCount: items.filter((item) => item.status !== 'active').length,
    futureFunctionCount: items.reduce((sum, item) => sum + (item.futureFunctions || []).length, 0)
  };
}

export function buildBudgetView(budget, audience, _scenarioId, roleId = audience === 'org' ? 'coordinator' : 'customer') {
  if (!budget) return null;
  const sourceLines = (budget.lines || []).filter((line) => line.block !== 'Управление и после' || roleId === 'owner');
  const sourceScenario = (budget.scenarios || []).find((item) => item.id === budget.meta.workingScenario)
    || budget.scenarios?.[0];
  if (!sourceScenario) return null;
  const scenario = {
    ...sourceScenario,
    label: 'Единая смета',
    total: sourceLines.reduce((sum, line) => sum + (Number(line.amounts?.[sourceScenario.id]) || 0), 0)
  };
  const lines = sourceLines
    .map((line) => ({
      ...line,
      amount: Number(line.amounts?.[scenario.id]) || 0,
      quantity: line.quantities?.[scenario.id] || '—'
    }))
    .sort((left, right) => Number(left.order || 999) - Number(right.order || 999) || String(left.item).localeCompare(String(right.item), 'ru'));
  const blocks = new Map();
  for (const line of lines) {
    if (line.amount > 0) blocks.set(line.block, (blocks.get(line.block) || 0) + line.amount);
  }
  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  const ceiling = Number(budget.meta.ceiling) || 0;
  const isUnestimated = (line) => line.type === 'неоценено' || line.priceStatus === 'не оценено';
  const isPotential = (line) => Number(line.candidateAmount) > 0 && line.activationStatus !== 'active';
  const potentialTotal = lines.filter(isPotential).reduce((sum, line) => sum + Number(line.candidateAmount || 0), 0);
  return {
    scenario,
    total,
    ceiling,
    headroom: ceiling - total,
    participants: Number(scenario.participants) || 1,
    perPerson: total / (Number(scenario.participants) || 1),
    reserve: lines.filter((line) => line.type === 'резерв').reduce((sum, line) => sum + line.amount, 0),
    options: lines.filter((line) => line.type === 'опция').reduce((sum, line) => sum + line.amount, 0),
    unestimatedCount: lines.filter(isUnestimated).length,
    blocks: [...blocks].map(([title, amount]) => ({ title, amount })).sort((a, b) => b.amount - a.amount),
    lines: audience === 'org' ? lines.filter((line) => !isUnestimated(line) && !isPotential(line)) : [],
    unestimatedLines: audience === 'org' ? lines.filter(isUnestimated) : [],
    potentialLines: audience === 'org' ? lines.filter(isPotential) : [],
    potentialCount: lines.filter(isPotential).length,
    potentialTotal,
    totalWithAdditional: total + potentialTotal,
    cutCandidates: audience === 'org' ? lines.filter((line) => line.cutCandidate && line.amount > 0).sort((left, right) => right.amount - left.amount) : [],
    cutCandidateTotal: lines.filter((line) => line.cutCandidate && line.amount > 0).reduce((sum, line) => sum + line.amount, 0),
    managerView: roleId === 'owner',
    sourceVersion: budget.meta.sourceVersion,
    asOf: budget.meta.asOf
  };
}
