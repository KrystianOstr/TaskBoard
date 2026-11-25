# TaskBoard

TaskBoard is a lightweight, containerized Kanban application for tracking work across three workflow stages: To Do, In Progress, and Completed.

## Features

- Create, update and delete tasks, with live completion statistics.
- Browser-local persistence using `localStorage`.
- HTTP startup, liveness and readiness endpoints.
- Release metadata exposed through `/version`.
- Configurable fault injection for resilience verification.
- Non-root container runtime and zero external npm dependencies.

## Requirements

Node.js 22+ or Docker. The application uses only built-in Node.js modules; no package installation is required.

## Local development

```bash
npm test
npm start
```

Open `http://localhost:8080`.

## Container runtime

```bash
docker build -t taskboard:1.0.0 .
docker run --rm --name taskboard -p 8080:8080 taskboard:1.0.0
```

The image runs as the unprivileged `node` user. Its Docker health check targets `/health/ready`. Configure any orchestration-platform probes separately.

## Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `8080` | HTTP listening port |
| `APP_ENV` | `local` | Environment identifier |
| `APP_VERSION` | `1.0.0` | Release version |
| `BUILD_SHA` | `local` | Source revision identifier |

The server binds to `0.0.0.0`. `.env.example` documents configuration but is not loaded automatically. Set variables through the shell, container runtime or deployment configuration.

## HTTP endpoints

| Method and path | Purpose | Success | Failure |
| --- | --- | --- | --- |
| `GET /` | Web interface | 200 | 500 |
| `GET /health/startup` | Startup status | 200 | 503 |
| `GET /health/live` | Liveness status | 200 | 503 |
| `GET /health/ready` | Readiness status | 200 | 503 |
| `GET /health` | Readiness-based smoke endpoint | 200 | 503 |
| `GET /version` | Release metadata | 200 | — |

```bash
curl -i http://localhost:8080/health
curl -i http://localhost:8080/version
```

See [Health endpoints](docs/HEALTHCHECKS.md) for response semantics and fault injection configuration.

## Automated tests

```bash
npm test
```

Tests use the built-in Node.js test runner. The suite covers task operations, configuration validation, health state transitions and HTTP integration. Integration tests start isolated loopback HTTP servers on ephemeral ports. No external services or credentials are required.

`npm run test:ci` runs the same suite for CI environments. A failed assertion produces a non-zero process exit code.

## Architecture

A static HTML/CSS/JavaScript frontend is served by a Node.js HTTP server. Task data is stored per browser origin; there is no server-side task database or authentication. Data is not shared between users, devices or environment URLs.

See [Architecture](docs/ARCHITECTURE.md) for component boundaries and runtime behavior.
