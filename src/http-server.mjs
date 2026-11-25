import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHealthChecks } from './health.mjs';

const staticRoutes = new Map([
  ['/', { filename: 'index.html', contentType: 'text/html; charset=utf-8' }],
  ['/assets/styles.css', { filename: 'styles.css', contentType: 'text/css; charset=utf-8' }],
  ['/assets/app.mjs', { filename: 'app.mjs', contentType: 'text/javascript; charset=utf-8' }],
  ['/assets/board-model.mjs', { filename: 'board-model.mjs', contentType: 'text/javascript; charset=utf-8' }],
  ['/favicon.svg', { filename: 'favicon.svg', contentType: 'image/svg+xml' }]
]);
const publicDir = new URL('../public/', import.meta.url);

function json(res, code, data, omitBody) {
  const body = JSON.stringify(data);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    ...(code === 503 ? { 'Retry-After': '2' } : {})
  });
  res.end(omitBody ? undefined : body);
}

export function createTaskBoardServer(config, { now } = {}) {
  const checks = createHealthChecks(config, now);
  const server = createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'");

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.setHeader('Allow', 'GET, HEAD');
      json(res, 405, { error: 'method_not_allowed' }, false);
      return;
    }

    const omitBody = req.method === 'HEAD';
    let path;
    try {
      path = new URL(req.url || '/', 'http://localhost').pathname;
    } catch {
      json(res, 400, { error: 'bad_request' }, omitBody);
      return;
    }
    if (path === '/health/startup') {
      const probe = checks.startup();
      json(res, probe.code, probe.body, omitBody);
      return;
    }
    if (path === '/health/live') {
      const probe = checks.liveness();
      json(res, probe.code, probe.body, omitBody);
      return;
    }
    if (path === '/health/ready' || path === '/health') {
      const probe = checks.readiness();
      json(res, probe.code, { ...probe.body, check: path === '/health' ? 'smoke' : 'readiness' }, omitBody);
      return;
    }
    if (path === '/version') {
      json(res, 200, {
        application: 'TaskBoard',
        version: config.appVersion,
        environment: config.appEnv,
        commit: config.buildSha
      }, omitBody);
      return;
    }

    const asset = staticRoutes.get(path);
    if (!asset) {
      json(res, 404, { error: 'not_found' }, omitBody);
      return;
    }
    try {
      const file = await readFile(new URL(asset.filename, publicDir));
      res.writeHead(200, {
        'Content-Type': asset.contentType,
        'Content-Length': file.byteLength,
        'Cache-Control': path === '/' ? 'no-store' : 'public, max-age=300'
      });
      res.end(omitBody ? undefined : file);
    } catch (error) {
      console.error('[taskboard] Failed to serve static asset:', asset.filename, error.message);
      json(res, 500, { error: 'static_resource_error' }, omitBody);
    }
  });
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  return server;
}
