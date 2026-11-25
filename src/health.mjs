/**
 * Health state with optional fault injection. Time is measured from process startup.
 * Probe states are independent: liveness does not imply readiness.
 * Fault injection is controlled by process configuration, not a public endpoint.
 */
export function createHealthChecks(config, now = () => performance.now()) {
  const startedAt = now();
  function elapsedMs() {
    return Math.max(0, now() - startedAt);
  }
  function result(check, healthy, reason = null) {
    return {
      code: healthy ? 200 : 503,
      body: {
        status: healthy ? 'healthy' : 'unhealthy',
        check,
        ...(reason ? { reason } : {})
      }
    };
  }
  function startup() {
    const passed = elapsedMs() >= config.startupDelayMs;
    return result('startup', passed, passed ? null : 'starting');
  }
  function liveness() {
    const failed = config.livenessFailAfterMs !== null && elapsedMs() >= config.livenessFailAfterMs;
    return result('liveness', !failed, failed ? 'simulated_liveness_failure' : null);
  }
  function readiness() {
    if (elapsedMs() < config.startupDelayMs || elapsedMs() < config.readinessDelayMs) {
      return result('readiness', false, 'warming_up');
    }
    const failed = config.readinessFailAfterMs !== null && elapsedMs() >= config.readinessFailAfterMs;
    return result('readiness', !failed, failed ? 'simulated_readiness_failure' : null);
  }
  return { startup, liveness, readiness };
}
