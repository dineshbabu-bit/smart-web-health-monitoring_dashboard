import app from './app.js';
import { config } from './config/index.js';

const HOST = '0.0.0.0';
const REQUEST_TIMEOUT_MS = Math.max(config.lighthouseTimeoutMs + 30000, 210000);

const server = app.listen(config.port, HOST);
let shuttingDown = false;

server.requestTimeout = REQUEST_TIMEOUT_MS;
server.setTimeout(REQUEST_TIMEOUT_MS);
server.keepAliveTimeout = 65000;
server.headersTimeout = 75000; // MUST be strictly greater than keepAliveTimeout (65s) to prevent ECONNRESET

server.on('timeout', (socket) => {
  console.warn(`[HTTP Server] Request socket timed out after ${REQUEST_TIMEOUT_MS}ms`);
  if (!socket.destroyed) {
    socket.destroy();
  }
});

server.on('listening', () => {
  console.log('====================================================');
  console.log('🚀 Smart Web Health Monitoring Backend is running');
  console.log(`📡 Environment : ${config.nodeEnv}`);
  console.log('⚡ Performance : Sequential Lighthouse audit queue');
  console.log(`🌐 Port        : ${config.port} (Host: ${HOST})`);
  console.log(`📊 Audit API   : http://localhost:${config.port}/api/audit/analyze`);
  console.log(`❤️  Health Check: http://localhost:${config.port}/api/health`);
  console.log('====================================================');
});

server.on('error', (error) => {
  if (error?.code === 'EADDRINUSE') {
    console.error(`\n❌ [PORT IN USE] Port ${config.port} is already occupied.`);
    console.error('The existing process has NOT been terminated.');
    console.error('Check the owner before stopping it:');
    console.error(`  Windows: netstat -ano | findstr ":${config.port}"`);
    console.error('  Then:    tasklist /FI "PID eq <PID>"');
    console.error('Stop only an old instance of this application, then start the backend once.\n');
  } else {
    console.error('❌ Backend server error:', error);
  }
  process.exit(1);
});

function shutdown(signal, exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n[${signal}] Initiating graceful backend shutdown...`);

  const forceExitTimer = setTimeout(() => {
    console.error('[Shutdown] Timed out waiting for active HTTP connections to close.');
    process.exit(exitCode || 1);
  }, 10000);
  forceExitTimer.unref();

  if (!server.listening) {
    clearTimeout(forceExitTimer);
    process.exit(exitCode);
    return;
  }

  server.close((error) => {
    clearTimeout(forceExitTimer);
    if (error) {
      console.error('[Shutdown] Error while closing HTTP server:', error);
      process.exit(1);
      return;
    }
    console.log('[Shutdown] HTTP server closed cleanly.');
    process.exit(exitCode);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM', 0));
process.on('SIGINT', () => shutdown('SIGINT', 0));

// Process-level unhandled rejection handler.
// Ordinary audit errors, Chrome terminations, or CDP disconnections must NOT terminate the Express server.
process.on('unhandledRejection', (reason) => {
  const errMsg = reason?.message || String(reason || '');
  console.error('[Unhandled Rejection Caught]:', errMsg);
  if (reason?.stack && config.nodeEnv === 'development') {
    console.error(reason.stack);
  }

  // Non-fatal background rejections from Chrome, CDP, or Lighthouse must not crash Express
  const isBrowserArtifact =
    errMsg.includes('Target closed') ||
    errMsg.includes('Session closed') ||
    errMsg.includes('Protocol error') ||
    errMsg.includes('WebSocket') ||
    errMsg.includes('lighthouse') ||
    errMsg.includes('chrome-launcher') ||
    errMsg.includes('EPERM') ||
    errMsg.includes('EBUSY') ||
    errMsg.includes('ESRCH') ||
    Boolean(reason?.isOperational);

  if (isBrowserArtifact) {
    console.warn('[Process Resilience] Non-fatal browser/audit artifact safely handled. Express server remains online.');
    return;
  }

  // True unexpected fatal process-level error
  console.error('[Fatal Unhandled Rejection]: Critical process failure, initiating shutdown');
  shutdown('UNHANDLED_REJECTION', 1);
});

process.on('uncaughtException', (error) => {
  console.error('[Fatal Uncaught Exception]:', error);
  shutdown('UNCAUGHT_EXCEPTION', 1);
});
