export const STATUSES = Object.freeze(['todo', 'inprogress', 'done']);
export const STORAGE_KEY = 'taskboard-mvp-v1';
export const MAX_TITLE_LENGTH = 100;

export function normalizeTitle(value) {
  const title = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (!title) throw new Error('Enter a task title.');
  if (title.length > MAX_TITLE_LENGTH) throw new Error(`Maximum ${MAX_TITLE_LENGTH} characters.`);
  return title;
}

function generateTaskId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  // IDs are local board identifiers, not security or authorization tokens.
  return `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function createTask(title, { id = generateTaskId(), now = new Date().toISOString() } = {}) {
  return { id, title: normalizeTitle(title), status: 'todo', createdAt: now };
}

export function updateTaskStatus(tasks, id, status) {
  if (!STATUSES.includes(status)) throw new Error('Unknown task status.');
  return tasks.map(task => task.id === id ? { ...task, status } : task);
}

export function removeTask(tasks, id) {
  return tasks.filter(task => task.id !== id);
}

export function validateStoredTasks(data) {
  if (!Array.isArray(data)) return null;
  if (data.length > 1000) return null;
  const result = [];
  const ids = new Set();
  for (const task of data) {
    if (!task || typeof task !== 'object' || typeof task.id !== 'string' || task.id.length > 100 || ids.has(task.id)) return null;
    if (typeof task.title !== 'string' || !task.title.trim() || task.title.length > MAX_TITLE_LENGTH) return null;
    if (!STATUSES.includes(task.status)) return null;
    if (typeof task.createdAt !== 'string' || task.createdAt.length > 40) return null;
    ids.add(task.id);
    result.push({ id: task.id, title: task.title, status: task.status, createdAt: task.createdAt });
  }
  return result;
}

export function sampleTasks() {
  return [
    { id: 'seed-1', title: 'Configure source repository', status: 'done', createdAt: '2026-01-01T08:00:00.000Z' },
    { id: 'seed-2', title: 'Build container image', status: 'inprogress', createdAt: '2026-01-01T08:01:00.000Z' },
    { id: 'seed-3', title: 'Configure service health probes', status: 'todo', createdAt: '2026-01-01T08:02:00.000Z' },
    { id: 'seed-4', title: 'Deploy application to DEV', status: 'todo', createdAt: '2026-01-01T08:03:00.000Z' },
    { id: 'seed-5', title: 'Validate deployment readiness', status: 'todo', createdAt: '2026-01-01T08:04:00.000Z' }
  ];
}
