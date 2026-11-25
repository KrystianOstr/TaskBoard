import test from 'node:test';
import assert from 'node:assert/strict';
import { createTask, normalizeTitle, updateTaskStatus, removeTask, validateStoredTasks, sampleTasks } from '../public/board-model.mjs';

test('normalizes task titles and rejects invalid lengths', () => {
  assert.equal(normalizeTitle('  Review   deploy  \n test  '), 'Review deploy test');
  assert.throws(() => normalizeTitle('    '), /Enter a task title/);
  assert.throws(() => normalizeTitle('x'.repeat(101)), /Maximum/);
});

test('creates tasks with To Do status', () => {
  const task = createTask(' Review pipeline ', { id: 'task-1', now: '2026-01-01T00:00:00.000Z' });
  assert.deepEqual(task, { id: 'task-1', title: 'Review pipeline', status: 'todo', createdAt: '2026-01-01T00:00:00.000Z' });
});

test('updates status without mutating the original array', () => {
  const before = sampleTasks();
  const after = updateTaskStatus(before, 'seed-3', 'done');
  assert.equal(after.find(task => task.id === 'seed-3').status, 'done');
  assert.equal(before.find(task => task.id === 'seed-3').status, 'todo');
  assert.throws(() => updateTaskStatus(before, 'seed-3', 'invalid'), /Unknown task status/);
});

test('removes only the specified task', () => {
  const before = sampleTasks();
  const after = removeTask(before, 'seed-2');
  assert.equal(after.length, before.length - 1);
  assert.ok(!after.some(task => task.id === 'seed-2'));
});

test('accepts empty task arrays and rejects invalid stored data', () => {
  assert.deepEqual(validateStoredTasks([]), []);
  assert.equal(validateStoredTasks({}), null);
  assert.equal(validateStoredTasks([{ id: 'a', title: '<img src=x>', status: 'wrong', createdAt: '' }]), null);
  assert.deepEqual(validateStoredTasks(sampleTasks()), sampleTasks());
});
