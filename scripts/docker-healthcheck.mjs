import http from 'node:http';
const port = process.env.PORT || '8080';
const request = http.get({
  hostname: '127.0.0.1',
  port,
  path: '/health/ready',
  timeout: 2500,
  agent: false
}, (response) => {
  response.resume();
  process.exitCode = response.statusCode === 200 ? 0 : 1;
});
request.on('timeout', () => request.destroy(new Error('timeout')));
request.on('error', () => { process.exitCode = 1; });
