import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

const input = argument('--input');
if (!input) {
  console.error('Usage: node scripts/import-budget-artifact.mjs --input <artifact.json>');
  process.exit(1);
}

const artifact = JSON.parse(await readFile(resolve(input), 'utf8'));
const rows = artifact?.snapshot?.datasets?.budget_scenario_items;
if (!Array.isArray(rows) || !rows.length) {
  console.error('budget_scenario_items dataset is missing');
  process.exit(1);
}

const scenarioOrder = ['250 всего', 'Рабочее ядро', 'Риски площадки', 'Все опции'];
const participants = {
  '250 всего': 250,
  'Рабочее ядро': 300,
  'Риски площадки': 300,
  'Все опции': 300
};
const items = new Map();

for (const row of rows) {
  if (!items.has(row.id)) {
    items.set(row.id, {
      id: row.id,
      order: items.size + 1,
      block: row.block,
      item: String(row.item || '').replace(/^↳\s*/, ''),
      parentItem: row.parent_item === '—' ? '' : row.parent_item,
      type: row.type,
      priceStatus: row.price_status,
      owner: row.owner,
      nextStep: row.next_step,
      basis: row.basis,
      sourceRef: row.source_ref,
      amounts: Object.fromEntries(scenarioOrder.map((scenario) => [scenario, 0])),
      quantities: Object.fromEntries(scenarioOrder.map((scenario) => [scenario, '—']))
    });
  }
  const item = items.get(row.id);
  item.amounts[row.scenario] = Number(row.amount_rub) || 0;
  item.quantities[row.scenario] = row.quantity_label || '—';
  if (row.scenario === 'Рабочее ядро') {
    item.block = row.block;
    item.item = String(row.item || '').replace(/^↳\s*/, '');
    item.parentItem = row.parent_item === '—' ? '' : row.parent_item;
    item.type = row.type;
    item.priceStatus = row.price_status;
    item.owner = row.owner;
    item.nextStep = row.next_step;
    item.basis = row.basis;
    item.sourceRef = row.source_ref;
  }
}

const lines = [...items.values()];
const totals = Object.fromEntries(scenarioOrder.map((scenario) => [
  scenario,
  lines.reduce((sum, item) => sum + item.amounts[scenario], 0)
]));
const workingBlocks = new Map();
for (const line of lines) {
  const amount = line.amounts['Рабочее ядро'];
  if (amount > 0) workingBlocks.set(line.block, (workingBlocks.get(line.block) || 0) + amount);
}

const output = {
  meta: {
    title: 'КОРА 35 — бюджет выезда на базу «Литейщик»',
    asOf: '2026-07-19',
    sourceVersion: 'Смета 14.07.2026 + детализация монитора 19.07.2026',
    workingScenario: 'Рабочее ядро',
    ceiling: 1000000,
    participants
  },
  scenarios: scenarioOrder.map((id) => ({ id, total: totals[id], participants: participants[id] })),
  blocks: [...workingBlocks].map(([title, amount]) => ({ title, amount })),
  unestimatedCount: lines.filter((item) => item.type === 'неоценено' || item.priceStatus === 'не оценено').length,
  lines
};

await writeFile('data/kora35-budget.json', `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`Budget imported: ${lines.length} lines, working total ${totals['Рабочее ядро']}`);
