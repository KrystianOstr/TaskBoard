import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config.mjs';

test('default configuration disables fault injection', () => {
  const c = loadConfig({});
  assert.equal(c.port, 8080);
  assert.equal(c.appEnv, 'local');
  assert.equal(c.startupDelayMs, 0);
  assert.equal(c.readinessDelayMs, 0);
  assert.equal(c.livenessFailAfterMs, null);
  assert.equal(c.readinessFailAfterMs, null);
});

test('fault injection accepts zero as immediate activation', () => {
  const c = loadConfig({ DEMO_LIVENESS_FAIL_AFTER_MS: '0', DEMO_READINESS_FAIL_AFTER_MS: '5000' });
  assert.equal(c.livenessFailAfterMs, 0);
  assert.equal(c.readinessFailAfterMs, 5000);
});

test('rejects invalid ports and durations', () => {
  assert.throws(() => loadConfig({ PORT: '0' }), /PORT/);
  assert.throws(() => loadConfig({ PORT: '65536' }), /PORT/);
  assert.throws(() => loadConfig({ DEMO_READINESS_DELAY_MS: '-100' }), /DEMO_READINESS_DELAY_MS/);
  assert.throws(() => loadConfig({ DEMO_READINESS_DELAY_MS: 'abc' }), /DEMO_READINESS_DELAY_MS/);
});
