import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config.mjs';
import { createHealthChecks } from '../src/health.mjs';

test('startup, liveness and readiness report independent states', () => {
  let t = 0;
  const checks = createHealthChecks(loadConfig({
    DEMO_STARTUP_DELAY_MS: '6000',
    DEMO_READINESS_DELAY_MS: '10000'
  }), () => t);
  assert.equal(checks.startup().code, 503);
  assert.equal(checks.liveness().code, 200);
  assert.equal(checks.readiness().code, 503);
  t = 7000;
  assert.equal(checks.startup().code, 200);
  assert.equal(checks.readiness().code, 503);
  t = 11000;
  assert.equal(checks.readiness().code, 200);
});

test('readiness failure does not imply liveness failure', () => {
  let t = 0;
  const checks = createHealthChecks(loadConfig({ DEMO_READINESS_FAIL_AFTER_MS: '4000' }), () => t);
  assert.equal(checks.readiness().code, 200);
  t = 5000;
  assert.equal(checks.readiness().code, 503);
  assert.equal(checks.readiness().body.reason, 'simulated_readiness_failure');
  assert.equal(checks.liveness().code, 200);
});

test('liveness fault injection returns 503', () => {
  let t = 0;
  const checks = createHealthChecks(loadConfig({ DEMO_LIVENESS_FAIL_AFTER_MS: '2500' }), () => t);
  assert.equal(checks.liveness().code, 200);
  t = 2500;
  assert.equal(checks.liveness().code, 503);
});
