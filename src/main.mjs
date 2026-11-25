import { loadConfig } from './config.mjs';
import { createTaskBoardServer } from './http-server.mjs';

let config;
try {
  config = loadConfig();
} catch (error) {
  console.error('[taskboard] Invalid configuration:', error.message);
  process.exit(1);
}
const server = createTaskBoardServer(config);
server.listen(config.port, '0.0.0.0', () => {
  console.log(`[taskboard] Listening on http://0.0.0.0:${config.port} (env=${config.appEnv}, version=${config.appVersion})`);
});
server.on('error', (error) => {
  console.error('[taskboard] Server error:', error.message);
  process.exitCode = 1;
});

function shutdown(signal) {
  console.log(`[taskboard] ${signal}: shutting down server`);
  server.close(() => {
    console.log('[taskboard] Server stopped');
  });
  // Close idle connections during graceful shutdown.
  server.closeIdleConnections();
}
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
