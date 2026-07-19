import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { validateBudgetData, validateMonitorData } from '../src/schema.js';

const requiredFiles = [
  'index.html',
  'org/index.html',
  'customer/index.html',
  'src/styles.css',
  'src/app.js',
  'src/schema.js',
  'src/model.js',
  'src/render.js',
  'data/kora35-monitor.json',
  'data/kora35-budget.json',
  'MONITOR_SYNC_POLICY.md'
];

const missing = requiredFiles.filter((file) => !existsSync(join(process.cwd(), file)));
if (missing.length) {
  console.error(`Missing required files: ${missing.join(', ')}`);
  process.exit(1);
}

const data = JSON.parse(await readFile('data/kora35-monitor.json', 'utf8'));
const result = validateMonitorData(data);
if (!result.ok) {
  console.error(result.errors.join('\n'));
  process.exit(1);
}

const budget = JSON.parse(await readFile('data/kora35-budget.json', 'utf8'));
const budgetResult = validateBudgetData(budget);
if (!budgetResult.ok) {
  console.error(budgetResult.errors.join('\n'));
  process.exit(1);
}

console.log('Monitor and budget validation passed');
