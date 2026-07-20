import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const budgetPath = path.join(root, 'data', 'kora35-budget.json');
const monitorPath = path.join(root, 'data', 'kora35-monitor.json');

const budget = JSON.parse(fs.readFileSync(budgetPath, 'utf8'));
const monitor = JSON.parse(fs.readFileSync(monitorPath, 'utf8'));

const updateLine = (id, patch) => {
  const line = budget.lines.find((item) => item.id === id);
  if (!line) throw new Error(`Budget line not found: ${id}`);
  Object.assign(line, patch);
  return line;
};

budget.meta.asOf = '2026-07-20';
budget.meta.sourceVersion = 'Правки пользователя 20.07.2026: задачи, роли, кандидаты и деактивации';

updateLine('helpers', {
  type: 'деактивировано',
  priceStatus: 'деактивировано пользователем',
  nextStep: 'Не учитывать в сумме до отдельного решения об активации',
  basis: 'Правка пользователя 20.07.2026',
  activationStatus: 'deactivated',
  candidateAmount: 10000,
  amounts: { '250 всего': 0, 'Рабочее ядро': 0, 'Риски площадки': 0, 'Все опции': 0 }
});

updateLine('snacks', {
  order: 9.5,
  block: 'Питание',
  owner: 'Кузьмич / питание',
  cutCandidate: true,
  cutReason: 'Дополнительный перекус после обеда; можно сократить при сохранении воды и основного питания'
});

for (const id of ['sports', 'boardgames', 'quiz_other']) {
  updateLine(id, { block: 'Активности Нияза', owner: 'Нияз Кашапов' });
}

updateLine('goldberg', {
  order: 15,
  block: 'Активности Нияза',
  type: 'опция',
  priceStatus: 'условная опция — требуется решение',
  owner: 'Нияз Кашапов',
  nextStep: 'Ниязу подтвердить ценность, состав услуги и КП; не активировать за счёт ядра без сокращения других статей',
  cutCandidate: true,
  cutReason: 'Крупная самостоятельная активность; возможна замена внутренними играми и спортивным блоком'
});

updateLine('animators', { owner: 'Нияз Кашапов / детский куратор' });
updateLine('hosts', {
  owner: 'Нияз Кашапов / Константин',
  nextStep: 'Созвониться с Константином; сверить сценарий, репетицию, роли и границы вознаграждения'
});
updateLine('prep', {
  item: 'Подготовительные коммуникации и набор участников',
  priceStatus: 'состав расходов требует подтверждения',
  owner: 'Гузель / Дмитрий Коган / HR',
  nextStep: 'Разделить фонд на макеты и печать, формы регистрации, рассылки/звонки и сбор заявок; исключить дубли со штатным временем',
  basis: 'Рабочий фонд 5 000 ₽; состав не подтверждён и требует расшифровки'
});

updateLine('custom_1784502249652', {
  block: 'Техника и инфраструктура',
  item: 'LED-экран',
  type: 'опция',
  owner: 'Нияз / технический контур',
  cutCandidate: true,
  cutReason: 'Крупная техническая опция; проверить необходимость при наличии экранов и проекторов площадки'
});

const interviewLine = budget.lines.find((line) => /5 больших интервью/i.test(line.item));
if (interviewLine) {
  interviewLine.cutCandidate = true;
  interviewLine.cutReason = 'Самая крупная медиа-строка; возможны сокращение объёма, поэтапный выпуск или перенос части постпродакшна после выезда';
}

const upsertBudgetLine = (line) => {
  const index = budget.lines.findIndex((item) => item.id === line.id);
  if (index >= 0) budget.lines[index] = line;
  else budget.lines.push(line);
};

upsertBudgetLine({
  id: 'candidate_org_team_functional_compensation',
  order: 62,
  block: 'Потенциальные расходы',
  item: 'Функциональная модель орггруппы и ведения — до 70 000 ₽',
  parentItem: 'Дмитрий 25 000 + Нияз 20 000 + Кузьмич 15 000 + пул коммуникаций/техподдержки 10 000',
  type: 'потенциальная статья',
  priceStatus: 'не утверждено',
  owner: 'Дмитрий Коган / заказчики',
  nextStep: 'Согласовать функции и определить, какие действующие строки PM, ведущих и координаторов эта модель заменяет',
  basis: 'Рабочая функциональная оценка в рамке 60–70 тыс. ₽; не складывать с пересекающимися статьями',
  sourceRef: 'Правка пользователя 20.07.2026 + сверка открытых предложений Набережных Челнов',
  activationStatus: 'not_activated',
  candidateAmount: 70000,
  amounts: { '250 всего': 0, 'Рабочее ядро': 0, 'Риски площадки': 0, 'Все опции': 0 },
  quantities: { '250 всего': '—', 'Рабочее ядро': '—', 'Риски площадки': '—', 'Все опции': '—' }
});

upsertBudgetLine({
  id: 'candidate_daily_documentary_week',
  order: 63,
  block: 'Потенциальные расходы',
  item: 'Ежедневная документальная съёмка: 30 минут в день в течение недели',
  parentItem: 'Хороший телефон/камера, память, звук, отбор и хранение материала',
  type: 'потенциальная статья',
  priceStatus: 'идея — требуется смета',
  owner: 'Евгения Сенина / режиссёр / Игорь',
  nextStep: 'Утвердить цель, дни, владельца телефона, хранение на диске «Фото» и объём монтажа',
  basis: 'Рабочий ориентир 35–70 тыс. ₽; в монитор внесена середина 50 тыс. ₽ без активации',
  sourceRef: 'Правка пользователя 20.07.2026',
  activationStatus: 'not_activated',
  candidateAmount: 50000,
  amounts: { '250 всего': 0, 'Рабочее ядро': 0, 'Риски площадки': 0, 'Все опции': 0 },
  quantities: { '250 всего': '—', 'Рабочее ядро': '—', 'Риски площадки': '—', 'Все опции': '—' }
});

for (const scenario of budget.scenarios) {
  scenario.total = budget.lines.reduce((sum, line) => sum + (Number(line.amounts?.[scenario.id]) || 0), 0);
}

monitor.project.lastUpdated = '20.07.2026';

const budgetEstimate = monitor.budgetItems.find((item) => item.id === 'budget-current-estimate');
if (budgetEstimate) budgetEstimate.amount = budget.scenarios.find((item) => item.id === budget.meta.workingScenario)?.total || 0;

const upsertTask = (task) => {
  const index = monitor.tasks.findIndex((item) => item.id === task.id);
  if (index >= 0) monitor.tasks[index] = { ...monitor.tasks[index], ...task };
  else monitor.tasks.push(task);
};

upsertTask({
  id: 'task-close-canteen',
  directionId: 'children',
  subprojectId: 'children-excursion-closeout',
  title: 'Доплата по столовой 1 054 ₽ передана повару наличными; долг закрыт',
  status: 'done',
  owner: 'Дмитрий Коган',
  dueDate: '2026-07-20',
  visibility: ['owner', 'customer', 'coordinator']
});
upsertTask({
  id: 'task-finish-excursion-budget',
  directionId: 'children',
  subprojectId: 'budget-full-closeout',
  title: 'Собрать отчётную смету детской экскурсии с приложениями и расчётной премией организаторам',
  status: 'done',
  owner: 'Дмитрий Коган / финансы',
  dueDate: '2026-07-20',
  visibility: ['owner', 'customer', 'coordinator']
});

const newTasks = [
  ['task-guzel-site-draft', 'communications', 'anniversary-site-pages', 'Передать Гузель ссылку на готовый черновик сайта юбилея и получить замечания', 'Дмитрий Коган / Гузель'],
  ['task-guzel-announcement-trip', 'communications', 'track-curators', 'Согласовать с Гузель объявление о выезде 16 августа', 'Гузель / Дмитрий Коган'],
  ['task-guzel-archive-call', 'communications', 'track-curators', 'Согласовать объявление о сборе архивных фото и видео сотрудников', 'Гузель / Евгения Сенина'],
  ['task-guzel-masterclasses-help', 'communications', 'track-curators', 'Согласовать приглашение провести мастер-классы и помочь орггруппе, включая детский трек', 'Гузель / кураторы треков'],
  ['task-accounting-liteyshchik-deposit', 'management', 'liteyshchik-operations', 'Получить в бухгалтерии 5 000 ₽ на задаток базе «Литейщик»', 'Дмитрий Коган / бухгалтерия'],
  ['task-liteyshchik-receipt', 'management', 'liteyshchik-operations', 'Оформить и подписать документ о передаче задатка 5 000 ₽ базе «Литейщик»', 'Дмитрий Коган / представитель «Литейщика»'],
  ['task-liteyshchik-question-list', 'gcdt', 'liteyshchik-operations', 'Закрыть с «Литейщиком» вопросы: клининг, домики, дождь, техника, внешний кейтеринг, вода, мебель, туалеты, электрика, парковка и мусор', 'Кузьмич / Дмитрий Коган'],
  ['task-niyaz-concept-roles', 'gcdt', 'liteyshchik-operations', 'Обсудить с Ниязом концепцию выезда, торжественную часть, спортивные активности, роли и вознаграждение', 'Дмитрий Коган / Нияз Кашапов'],
  ['task-niyaz-kuzmich-function-split', 'management', 'track-curators', 'Утвердить распределение функций Нияза и Кузьмича без пересечений и серых зон', 'Дмитрий Коган / Нияз / Кузьмич'],
  ['task-call-konstantin-host', 'gcdt', 'liteyshchik-operations', 'Созвониться с Константином — ведущим торжественной части', 'Дмитрий Коган / Константин'],
  ['task-senina-korachki-gifts', 'recognition', 'recognition-production', 'Дать Евгении Сениной ответ по КОРАчкам и детским сувенирам', 'Дмитрий Коган / Евгения Сенина'],
  ['task-documentary-daily-capture', 'communications', 'anniversary-site-pages', 'Проработать ежедневную документальную съёмку по 30 минут в течение недели: телефон, звук, хранение, владелец', 'Евгения Сенина / режиссёр / Игорь'],
  ['task-igor-laptop', 'management', 'adaptive-management-layer', 'С Игорем исправить рабочий ноутбук', 'Дмитрий Коган / Игорь'],
  ['task-igor-photo-drive', 'communications', 'anniversary-site-pages', 'С Игорем открыть доступ к фото и видео на диске «Фото»', 'Дмитрий Коган / Игорь'],
  ['task-approve-org-compensation-model', 'management', 'budget-full-closeout', 'Согласовать функциональную модель вознаграждения орггруппы до 70 000 ₽ без двойного учёта PM, ведущих и координаторов', 'Дмитрий Коган / заказчики']
];

for (const [id, directionId, subprojectId, title, owner] of newTasks) {
  upsertTask({ id, directionId, subprojectId, title, status: 'action_needed', owner, dueDate: '2026-07-20', visibility: ['owner', 'customer', 'coordinator'] });
}

monitor.teamFunctions = [
  {
    id: 'dmitry-kogan', name: 'Дмитрий Коган', status: 'active', statusLabel: 'реализует сейчас',
    currentRole: 'Руководитель проекта, концепция, бюджет, решения с заказчиками и подрядчиками',
    eventFunctions: ['архитектура проекта', 'бюджет и приоритеты', 'переговоры', 'сведение орггруппы'],
    futureFunctions: ['куратор системы благополучия', 'владелец портфеля инициатив', 'наставник внутренних организаторов'],
    confirmation: 'подтверждено текущей работой', visibility: ['owner', 'coordinator']
  },
  {
    id: 'niyaz', name: 'Нияз Кашапов', status: 'to_confirm', statusLabel: 'согласовать сегодня',
    currentRole: 'Программный и торжественный контур',
    eventFunctions: ['торжественная часть', 'спорт', 'настольные игры', 'викторина', 'зоны разговора', 'лекции', 'аниматоры', 'награждения', 'координация фото и видео'],
    futureFunctions: ['фасилитатор внутренних встреч', 'куратор спортивных и интеллектуальных активностей', 'ведущий программ признания'],
    confirmation: 'объём роли и вознаграждение требуют разговора', visibility: ['owner', 'coordinator']
  },
  {
    id: 'kuzmich', name: 'Дмитрий Кузьмич', status: 'to_confirm', statusLabel: 'согласовать сегодня',
    currentRole: 'Операционный и логистический контур',
    eventFunctions: ['клининг', 'автобусы', 'логистика', 'медик', 'охрана', 'площадка и подрядчики', 'операционный контроль дня'],
    futureFunctions: ['операционный координатор инициатив', 'куратор безопасной логистики', 'владелец сервисных стандартов'],
    confirmation: 'границы с Ниязом и подрядчиками требуют фиксации', visibility: ['owner', 'coordinator']
  },
  {
    id: 'guzel', name: 'Гузель', status: 'action_needed', statusLabel: 'есть пакет задач',
    currentRole: 'Куратор коммуникационного трека',
    eventFunctions: ['объявление о выезде', 'сбор архивных материалов', 'приглашение к мастер-классам', 'набор помощи орггруппе'],
    futureFunctions: ['куратор внутренних коммуникаций', 'редактор календаря инициатив', 'сбор обратной связи'],
    confirmation: 'передать ссылку на сайт и согласовать четыре сообщения', visibility: ['owner', 'coordinator']
  },
  {
    id: 'evgenia-senina', name: 'Евгения Сенина', status: 'action_needed', statusLabel: 'нужны решения',
    currentRole: 'Дизайн, фото и видео',
    eventFunctions: ['КОРАчки', 'детские сувениры', 'документальная съёмка', 'визуальные материалы'],
    futureFunctions: ['куратор корпоративной памяти', 'редактор визуального архива', 'медиа-координатор инициатив'],
    confirmation: 'дать ответ по КОРАчкам и сувенирам; утвердить медиапроцесс', visibility: ['owner', 'coordinator']
  },
  {
    id: 'igor', name: 'Игорь', status: 'action_needed', statusLabel: 'техническая помощь',
    currentRole: 'Техническая поддержка и доступы',
    eventFunctions: ['ремонт ноутбука', 'доступ к диску «Фото»', 'хранение фото и видео'],
    futureFunctions: ['цифровая поддержка инициатив', 'администратор медиаархива', 'помощь сотрудникам с инструментами'],
    confirmation: 'объём участия после мероприятия пока потенциальный', visibility: ['owner', 'coordinator']
  },
  {
    id: 'konstantin', name: 'Константин', status: 'contact_needed', statusLabel: 'нужен созвон',
    currentRole: 'Ведущий торжественной части',
    eventFunctions: ['ведение церемонии', 'репетиция', 'безопасная драматургия и юмор'],
    futureFunctions: ['ведущий будущих корпоративных форматов'],
    confirmation: 'роль и условия не подтверждены', visibility: ['owner', 'coordinator']
  }
];

const upsertUpdate = (update) => {
  const index = monitor.updates.findIndex((item) => item.id === update.id);
  if (index >= 0) monitor.updates[index] = update;
  else monitor.updates.push(update);
};

upsertUpdate({
  id: 'update-user-roles-tasks-budget-2026-07-20',
  createdAt: '2026-07-20',
  kind: 'decision',
  text: 'Функции разделяются: Нияз ведёт программу и активности; Кузьмич — операционный контур. Система благополучия показывается последним треком, как продолжение после события.',
  visibility: ['owner', 'customer', 'coordinator']
});
upsertUpdate({
  id: 'update-child-canteen-closed-2026-07-20',
  createdAt: '2026-07-20',
  kind: 'budget_update',
  text: 'Доплата по столовой детской экскурсии 1 054 ₽ передана повару наличными. Это закрытие ранее учтённой суммы 2 550 ₽, а не новый дополнительный расход.',
  visibility: ['owner', 'customer', 'coordinator']
});
upsertUpdate({
  id: 'update-potential-budget-2026-07-20',
  createdAt: '2026-07-20',
  kind: 'proposal',
  text: 'Неутверждённые идеи вынесены в потенциальные статьи и не влияют на сценарий до активации. В конце бюджета выделены кандидаты на сокращение.',
  visibility: ['owner', 'customer', 'coordinator']
});

fs.writeFileSync(budgetPath, `${JSON.stringify(budget, null, 2)}\n`);
fs.writeFileSync(monitorPath, `${JSON.stringify(monitor, null, 2)}\n`);

console.log(`Budget working total: ${budget.scenarios.find((item) => item.id === budget.meta.workingScenario)?.total}`);
console.log(`Tasks: ${monitor.tasks.length}; team functions: ${monitor.teamFunctions.length}`);
