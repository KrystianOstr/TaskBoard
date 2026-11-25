function duration(name, raw, { optional = false } = {}) {
  if ((raw === undefined || raw === '') && optional) return null;
  if (raw === undefined || raw === '') return 0;
  if (!/^(0|[1-9][0-9]*)$/.test(raw)) {
    throw new Error(`${name} must be a non-negative integer (ms).`);
  }
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed > 86_400_000) {
    throw new Error(`${name} must be between 0 and 86400000 ms.`);
  }
  return parsed;
}

export function loadConfig(env = process.env) {
  const portText = env.PORT ?? '8080';
  if (!/^[0-9]+$/.test(portText)) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }
  const port = Number(portText);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }
  return Object.freeze({
    port,
    appEnv: String(env.APP_ENV || 'local').slice(0, 40),
    appVersion: String(env.APP_VERSION || '1.0.0').slice(0, 60),
    buildSha: String(env.BUILD_SHA || 'local').slice(0, 80),
    startupDelayMs: duration('DEMO_STARTUP_DELAY_MS', env.DEMO_STARTUP_DELAY_MS),
    readinessDelayMs: duration('DEMO_READINESS_DELAY_MS', env.DEMO_READINESS_DELAY_MS),
    livenessFailAfterMs: duration('DEMO_LIVENESS_FAIL_AFTER_MS', env.DEMO_LIVENESS_FAIL_AFTER_MS, { optional: true }),
    readinessFailAfterMs: duration('DEMO_READINESS_FAIL_AFTER_MS', env.DEMO_READINESS_FAIL_AFTER_MS, { optional: true })
  });
}
