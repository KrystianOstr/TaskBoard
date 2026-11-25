# Health endpoints

All health endpoints accept HTTP GET and HEAD on the configured application port (8080 by default). Responses use `Cache-Control: no-store`. GET responses contain JSON; unhealthy responses use HTTP 503 and include `Retry-After: 2`.

| Path | HTTP 200 | HTTP 503 |
| --- | --- | --- |
| `/health/startup` | Startup threshold reached | Startup delay active |
| `/health/live` | Process responds and no liveness fault is active | Injected liveness failure |
| `/health/ready` | Startup and readiness thresholds reached; no readiness fault | Startup/readiness delay or injected readiness failure |
| `/health` | Same status as readiness | Same status as readiness |

Healthy response:

```json
{"status":"healthy","check":"liveness"}
```

Unhealthy response:

```json
{"status":"unhealthy","check":"readiness","reason":"simulated_readiness_failure"}
```

## Fault injection configuration

All durations are milliseconds measured from process startup. The server remains reachable during configured startup and readiness delays. These delays model application state, not a delayed socket bind.

| Variable | Default | Behavior |
| --- | --- | --- |
| `DEMO_STARTUP_DELAY_MS` | `0` | Startup and readiness report 503 until the threshold |
| `DEMO_READINESS_DELAY_MS` | `0` | Readiness reports 503 until the threshold |
| `DEMO_LIVENESS_FAIL_AFTER_MS` | Unset | Liveness reports 503 at and after the threshold |
| `DEMO_READINESS_FAIL_AFTER_MS` | Unset | Readiness reports 503 at and after the threshold |

Failure thresholds accept `0` for immediate activation. Empty values disable failure injection. Liveness and readiness are evaluated independently. A liveness fault does not itself change the readiness response. A process restart resets elapsed time, so persistent liveness fault configuration can cause repeated restarts under an orchestrator. Leave fault injection disabled during normal operation.

Example:

```bash
docker run --rm -p 8080:8080 \
  -e DEMO_READINESS_FAIL_AFTER_MS=10000 taskboard:1.0.0
```

## Deployment integration

The Dockerfile health check performs a local HTTP request to `/health/ready` every 30 seconds, with a 4-second timeout, 15-second start period and three retries. Docker health status alone does not restart a standalone container.

Configure startup, liveness and readiness probes explicitly on the target orchestration platform. Use `/health` for external post-deployment verification and `/version` when release identity must also be confirmed. The health endpoints do not validate browser workflows or external dependencies; this application has no server-side database.
