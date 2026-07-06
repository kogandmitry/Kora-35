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
    title: '1. Зарождение',
    summary: 'Первые события и прототипы заботы.'
  },
  {
    id: 'assembly',
    title: '2. Сборка',
    summary: 'Связывание треков, ролей, материалов и управленческих решений.'
  },
  {
    id: 'legacy',
    title: '3. Закрепление',
    summary: 'Главное событие и перенос результатов в постоянную систему заботы.'
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

export function getOpenActionCount(data, roleId) {
  const tasks = filterVisible(data.tasks, roleId).filter((task) => OPEN_STATUSES.has(task.status)).length;
  const risks = filterVisible(data.risks, roleId).filter((risk) => OPEN_STATUSES.has(risk.status)).length;
  const subprojects = filterVisible(data.subprojects, roleId).filter((subproject) => OPEN_STATUSES.has(subproject.status)).length;
  return tasks + risks + subprojects;
}

export function buildHealthSummary(data, roleId, now = new Date()) {
  const visibleDirections = filterVisible(data.directions, roleId);
  const readiness = visibleDirections.map((item) => Number(item.readiness || 0));
  const averageReadiness = readiness.length
    ? Math.round(readiness.reduce((sum, value) => sum + value, 0) / readiness.length)
    : 0;

  return {
    daysLeft: daysUntil(data.project.eventDate, now),
    status: data.project.status,
    lastUpdated: data.project.lastUpdated,
    averageReadiness,
    openActions: getOpenActionCount(data, roleId),
    directionCount: visibleDirections.length
  };
}

function clampPercent(value) {
  const number = Number(value || 0);
  return Math.max(0, Math.min(100, Number.isFinite(number) ? number : 0));
}

export function buildProjectMap(data, roleId) {
  const visibleDirections = filterVisible(data.directions, roleId);
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
  const visibleDirections = filterVisible(data.directions, roleId);
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
