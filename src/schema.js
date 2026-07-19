export const ROLE_IDS = ['owner', 'customer', 'coordinator', 'participant', 'public'];

export const STATUS_IDS = [
  'not_started',
  'action_needed',
  'in_progress',
  'blocked',
  'done',
  'archived'
];

const STATUS_ALIASES = new Map([
  ['todo', 'not_started'],
  ['plan', 'not_started'],
  ['doing', 'in_progress'],
  ['in-progress', 'in_progress'],
  ['ready', 'done'],
  ['complete', 'done'],
  ['done', 'done'],
  ['blocked', 'blocked'],
  ['action', 'action_needed'],
  ['action_needed', 'action_needed']
]);

export function normalizeStatus(value) {
  const key = String(value || '').trim().toLowerCase();
  return STATUS_ALIASES.get(key) || (STATUS_IDS.includes(key) ? key : 'not_started');
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function requireArray(errors, object, key) {
  if (!Array.isArray(object[key])) {
    errors.push(`${key} must be an array`);
    return [];
  }
  return object[key];
}

function validateIdSet(errors, items, label) {
  const seen = new Set();
  for (const item of items) {
    if (!hasText(item.id)) {
      errors.push(`${label} item is missing id`);
      continue;
    }
    if (seen.has(item.id)) errors.push(`${label} contains duplicate id: ${item.id}`);
    seen.add(item.id);
  }
  return seen;
}

export function validateMonitorData(data) {
  const errors = [];
  if (!data || typeof data !== 'object') {
    return { ok: false, errors: ['data must be an object'] };
  }

  if (!data.project || typeof data.project !== 'object') errors.push('project must be an object');
  if (!hasText(data.project?.title)) errors.push('project.title is required');
  if (!hasText(data.project?.eventDate)) errors.push('project.eventDate is required');
  if (!hasText(data.project?.lastUpdated)) errors.push('project.lastUpdated is required');

  const directions = requireArray(errors, data, 'directions');
  const subprojects = requireArray(errors, data, 'subprojects');
  const tasks = requireArray(errors, data, 'tasks');
  const risks = requireArray(errors, data, 'risks');
  const updates = requireArray(errors, data, 'updates');
  const wellbeingFunctions = Array.isArray(data.wellbeingFunctions) ? data.wellbeingFunctions : [];
  const anniversaryEvents = Array.isArray(data.anniversaryEvents) ? data.anniversaryEvents : [];
  const eventArtifacts = Array.isArray(data.eventArtifacts) ? data.eventArtifacts : [];
  requireArray(errors, data, 'people');
  requireArray(errors, data, 'budgetItems');
  requireArray(errors, data, 'sources');

  const directionIds = validateIdSet(errors, directions, 'directions');
  const subprojectIds = validateIdSet(errors, subprojects, 'subprojects');
  validateIdSet(errors, tasks, 'tasks');
  validateIdSet(errors, risks, 'risks');
  validateIdSet(errors, updates, 'updates');
  validateIdSet(errors, wellbeingFunctions, 'wellbeingFunctions');
  const anniversaryEventIds = validateIdSet(errors, anniversaryEvents, 'anniversaryEvents');
  validateIdSet(errors, eventArtifacts, 'eventArtifacts');

  for (const direction of directions) {
    if (!hasText(direction.title)) errors.push(`direction ${direction.id || '(missing id)'} is missing title`);
    direction.status = normalizeStatus(direction.status);
  }

  for (const subproject of subprojects) {
    if (!directionIds.has(subproject.directionId)) {
      errors.push(`subproject ${subproject.id} references missing direction ${subproject.directionId}`);
    }
    subproject.status = normalizeStatus(subproject.status);
  }

  for (const task of tasks) {
    if (task.directionId && !directionIds.has(task.directionId)) {
      errors.push(`task ${task.id} references missing direction ${task.directionId}`);
    }
    if (task.subprojectId && !subprojectIds.has(task.subprojectId)) {
      errors.push(`task ${task.id} references missing subproject ${task.subprojectId}`);
    }
    task.status = normalizeStatus(task.status);
  }

  for (const wellbeingFunction of wellbeingFunctions) {
    if (!hasText(wellbeingFunction.title)) {
      errors.push(`wellbeingFunction ${wellbeingFunction.id || '(missing id)'} is missing title`);
    }
    const formation = Number(wellbeingFunction.formation);
    if (!Number.isFinite(formation) || formation < 0 || formation > 100) {
      errors.push(`wellbeingFunction ${wellbeingFunction.id} formation must be a number from 0 to 100`);
    }
    for (const directionId of wellbeingFunction.directionIds || []) {
      if (!directionIds.has(directionId)) {
        errors.push(`wellbeingFunction ${wellbeingFunction.id} references missing direction ${directionId}`);
      }
    }
  }

  for (const event of anniversaryEvents) {
    if (!hasText(event.title)) errors.push(`anniversaryEvent ${event.id || '(missing id)'} is missing title`);
    for (const directionId of event.trackIds || []) {
      if (!directionIds.has(directionId)) {
        errors.push(`anniversaryEvent ${event.id} references missing direction ${directionId}`);
      }
    }
  }

  for (const artifact of eventArtifacts) {
    if (!hasText(artifact.title)) errors.push(`eventArtifact ${artifact.id || '(missing id)'} is missing title`);
    if (!anniversaryEventIds.has(artifact.eventId)) {
      errors.push(`eventArtifact ${artifact.id} references missing event ${artifact.eventId}`);
    }
    for (const directionId of artifact.trackIds || []) {
      if (!directionIds.has(directionId)) {
        errors.push(`eventArtifact ${artifact.id} references missing direction ${directionId}`);
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

export function validateBudgetData(data) {
  const errors = [];
  if (!data || typeof data !== 'object') return { ok: false, errors: ['budget data must be an object'] };
  if (!data.meta || typeof data.meta !== 'object') errors.push('budget.meta must be an object');
  if (!hasText(data.meta?.workingScenario)) errors.push('budget.meta.workingScenario is required');
  if (!Number.isFinite(Number(data.meta?.ceiling))) errors.push('budget.meta.ceiling must be a number');
  const scenarios = requireArray(errors, data, 'scenarios');
  const lines = requireArray(errors, data, 'lines');
  const scenarioIds = validateIdSet(errors, scenarios, 'budget scenarios');
  validateIdSet(errors, lines, 'budget lines');
  if (data.meta?.workingScenario && !scenarioIds.has(data.meta.workingScenario)) {
    errors.push(`budget working scenario is missing: ${data.meta.workingScenario}`);
  }
  for (const scenario of scenarios) {
    if (!Number.isFinite(Number(scenario.total))) errors.push(`budget scenario ${scenario.id} total must be a number`);
  }
  for (const line of lines) {
    if (!hasText(line.item)) errors.push(`budget line ${line.id || '(missing id)'} is missing item`);
    if (!hasText(line.block)) errors.push(`budget line ${line.id || '(missing id)'} is missing block`);
    for (const scenario of scenarios) {
      if (!Number.isFinite(Number(line.amounts?.[scenario.id]))) {
        errors.push(`budget line ${line.id} has no numeric amount for ${scenario.id}`);
      }
    }
  }
  return { ok: errors.length === 0, errors };
}
