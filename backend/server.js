import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import { config } from './src/config.js';
import { logger } from './src/logger.js';
import { jobStore } from './src/jobs.js';
import api from './src/routes.js';
import { requestLogger } from './src/logger.js';
import { notFoundHandler, errorHandler, securityHeaders } from './src/middleware.js';

const app = express();

app.disable('x-powered-by');
app.use(securityHeaders);
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);

// API routes
app.use('/api', api);

// Serve production static frontend if built.
if (fs.existsSync(config.distPath)) {
  app.use(express.static(config.distPath, { index: 'index.html' }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(config.distPath + '/index.html');
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

// Boot sweep (clears stale jobs + orphaned temp files), then periodic.
jobStore.sweep();
const sweepTimer = setInterval(() => jobStore.sweep(), config.jobSweepIntervalMs);
sweepTimer.unref?.();

const server = app.listen(config.port, config.host, () => {
  logger.info('TubeDeck Precision Backend Online', {
    url: `http://localhost:${config.port}`,
    env: config.nodeEnv,
    ytDlp: config.ytDlpPath,
    ffmpeg: config.ffmpegPath || 'not-found',
  });
});

// Graceful shutdown.
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    logger.info(`Received ${sig}, shutting down`);
    clearInterval(sweepTimer);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000).unref?.();
  });
}
