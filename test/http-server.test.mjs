import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { loadConfig } from '../src/config.mjs';
import { createTaskBoardServer } from '../src/http-server.mjs';

async function withServer(env, fn) {
  const server = createTaskBoardServer(loadConfig(env));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await fn(base);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
}

test('serves HTML and static assets with security headers', async () => {
  await withServer({}, async base => {
    const page = await fetch(base);
    assert.equal(page.status, 200);
    assert.match(page.headers.get('content-type'), /text\/html/);
    assert.match(page.headers.get('content-security-policy'), /default-src/);
    assert.match(await page.text(), /TaskBoard/);
    const js = await fetch(base + '/assets/app.mjs');
    assert.equal(js.status, 200);
    assert.match(await js.text(), /localStorage/);
  });
});

test('all health endpoints return HTTP 200 by default', async () => {
  await withServer({}, async base => {
    for (const path of ['/health/startup', '/health/live', '/health/ready', '/health']) {
      const response = await fetch(base + path);
      assert.equal(response.status, 200, path);
      const body = await response.json();
      assert.equal(body.status, 'healthy');
    }
  });
});

test('smoke endpoint reports HTTP 503 during readiness failure', async () => {
  await withServer({ DEMO_READINESS_FAIL_AFTER_MS: '0' }, async base => {
    const ready = await fetch(base + '/health/ready');
    const smoke = await fetch(base + '/health');
    const live = await fetch(base + '/health/live');
    assert.equal(ready.status, 503);
    assert.equal(smoke.status, 503);
    assert.equal(live.status, 200);
    assert.equal(ready.headers.get('cache-control'), 'no-store');
  });
});

test('reports release metadata and rejects unknown routes and methods', async () => {
  await withServer({ APP_ENV: 'dev', APP_VERSION: '1.2.3', BUILD_SHA: 'abc123' }, async base => {
    const version = await (await fetch(base + '/version')).json();
    assert.deepEqual(version, { application: 'TaskBoard', version: '1.2.3', environment: 'dev', commit: 'abc123' });
    assert.equal((await fetch(base + '/does-not-exist')).status, 404);
    const post = await fetch(base + '/health', { method: 'POST' });
    assert.equal(post.status, 405);
    assert.equal(post.headers.get('allow'), 'GET, HEAD');
  });
});
