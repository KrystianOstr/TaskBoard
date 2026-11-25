import {
  STORAGE_KEY, STATUSES, createTask, sampleTasks,
  updateTaskStatus, removeTask, validateStoredTasks
} from '/assets/board-model.mjs';

const statusLabels = { todo: 'To do', inprogress: 'In progress', done: 'Completed' };
const refs = Object.fromEntries([
  'total-count', 'progress-count', 'completed-count', 'completion-percent', 'completion-progress',
  'todo-count', 'inprogress-count', 'done-count', 'todo-list', 'inprogress-list', 'done-list',
  'add-form', 'task-title', 'form-feedback', 'reset-samples', 'focus-add', 'environment-badge',
  'runtime-status', 'app-version', 'app-commit'
].map(id => [id, document.getElementById(id)]));

function loadTasks() {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing === null) {
      const initial = sampleTasks();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = validateStoredTasks(JSON.parse(existing));
    if (parsed !== null) return parsed;
  } catch {
    // If localStorage is unavailable, tasks remain in memory until the page is refreshed.
  }
  return sampleTasks();
}

let tasks = loadTasks();
function saveTasks(next) {
  tasks = next;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
  catch { showFeedback('Browser storage is unavailable. Changes may be lost on refresh.', true); }
  render();
}

function showFeedback(message, isError = false) {
  refs['form-feedback'].textContent = message;
  refs['form-feedback'].classList.toggle('error', isError);
}

function createCard(task) {
  const card = document.createElement('article');
  card.className = 'task-card';

  const tag = document.createElement('div');
  tag.className = 'task-tag';
  const tagDot = document.createElement('span');
  tagDot.className = `task-tag-dot ${task.status}`;
  tag.append(tagDot, document.createTextNode(' DevOps Task'));

  const title = document.createElement('p');
  title.className = 'task-title';
  title.textContent = task.title;

  const divider = document.createElement('div');
  divider.className = 'task-divider';

  const footer = document.createElement('div');
  footer.className = 'task-footer';
  const select = document.createElement('select');
  select.className = 'task-status-select';
  select.setAttribute('aria-label', `Change status: ${task.title}`);
  for (const status of STATUSES) {
    const option = document.createElement('option');
    option.value = status;
    option.textContent = statusLabels[status];
    select.appendChild(option);
  }
  select.value = task.status;
  select.addEventListener('change', () => {
    saveTasks(updateTaskStatus(tasks, task.id, select.value));
    showFeedback(`Updated task status: ${task.title}.`);
  });

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'delete-task';
  del.textContent = 'Delete';
  del.setAttribute('aria-label', `Delete task: ${task.title}`);
  del.addEventListener('click', () => {
    saveTasks(removeTask(tasks, task.id));
    showFeedback(`Deleted task: ${task.title}.`);
  });
  footer.append(select, del);
  card.append(tag, title, divider, footer);
  return card;
}

function render() {
  const counts = { todo: 0, inprogress: 0, done: 0 };
  for (const status of STATUSES) refs[`${status}-list`].replaceChildren();
  for (const task of tasks) {
    counts[task.status]++;
    refs[`${task.status}-list`].appendChild(createCard(task));
  }
  for (const status of STATUSES) {
    refs[`${status}-count`].textContent = String(counts[status]);
    if (counts[status] === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-column';
      empty.textContent = 'No tasks in this column';
      refs[`${status}-list`].appendChild(empty);
    }
  }
  refs['total-count'].textContent = String(tasks.length);
  refs['progress-count'].textContent = String(counts.inprogress);
  refs['completed-count'].textContent = String(counts.done);
  const percent = tasks.length ? Math.round((counts.done / tasks.length) * 100) : 0;
  refs['completion-percent'].textContent = String(percent);
  refs['completion-progress'].style.width = `${percent}%`;
}

refs['add-form'].addEventListener('submit', event => {
  event.preventDefault();
  try {
    const newTask = createTask(refs['task-title'].value);
    saveTasks([newTask, ...tasks]);
    refs['task-title'].value = '';
    refs['task-title'].focus();
    showFeedback('Task added.');
  } catch (error) {
    showFeedback(error.message, true);
  }
});
refs['focus-add'].addEventListener('click', () => {
  refs['task-title'].focus();
  refs['task-title'].scrollIntoView({ block: 'center', behavior: 'smooth' });
});
refs['reset-samples'].addEventListener('click', () => {
  if (window.confirm('Replace the current board with sample tasks?')) {
    saveTasks(sampleTasks());
    showFeedback('Sample tasks restored.');
  }
});

async function loadVersion() {
  try {
    const response = await fetch('/version', { cache: 'no-store' });
    if (!response.ok) throw new Error('Failed to retrieve version.');
    const data = await response.json();
    refs['environment-badge'].textContent = String(data.environment).toUpperCase();
    refs['app-version'].textContent = String(data.version);
    refs['app-commit'].textContent = String(data.commit).slice(0, 12);
  } catch {
    refs['app-commit'].textContent = 'unknown';
  }
}
async function checkReadiness() {
  try {
    const response = await fetch('/health/ready', { cache: 'no-store' });
    const ok = response.status === 200;
    refs['runtime-status'].innerHTML = '';
    const dot = document.createElement('span');
    dot.className = ok ? 'pulse' : 'pulse pulse-warning';
    refs['runtime-status'].append(dot, document.createTextNode(ok ? 'Application ready' : 'Application not ready'));
  } catch {
    refs['runtime-status'].textContent = 'Connection unavailable';
  }
}
render();
loadVersion();
checkReadiness();
setInterval(checkReadiness, 15_000);
