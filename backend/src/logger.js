/* Tiny structured logger with levels and request timing. */
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

const level = LEVELS[(process.env.LOG_LEVEL || 'info').toLowerCase()] ?? LEVELS.info;

function ts() {
  return new Date().toISOString();
}

function write(lvl, msg, meta) {
  if (LEVELS[lvl] < level) return;
  const line = {
    t: ts(),
    level: lvl.toUpperCase(),
    msg,
    ...(meta && typeof meta === 'object' ? meta : { meta }),
  };
  const out = lvl === 'error' ? process.stderr : process.stdout;
  out.write(JSON.stringify(line) + '\n');
}

export const logger = {
  debug: (msg, meta) => write('debug', msg, meta),
  info: (msg, meta) => write('info', msg, meta),
  warn: (msg, meta) => write('warn', msg, meta),
  error: (msg, meta) => write('error', msg, meta),
};

export function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    logger.info(`${req.method} ${req.originalUrl}`, {
      status: res.statusCode,
      ms: Math.round(ms * 10) / 10,
      ip: req.ip,
      ua: (req.get('user-agent') || '').slice(0, 120),
    });
  });
  next();
}
