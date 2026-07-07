import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  ROLE_IDS,
  STATUS_IDS,
  normalizeStatus,
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
