import { config } from './config.js';
import { logger } from './logger.js';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Sliding-window rate limiter (per IP) with disk persistence.
 * Ticks are saved to data/ratelimit.json on an interval, so restarts do
 * NOT reset the counters. No extra dependency.
 */
export function rateLimiter({ windowMs = config.rateLimitWindowMs, max = config.rateLimitMax } = {}) {
  const hits = new Map();
  const file = path.join(config.dataDir, 'ratelimit.json');

  // Load persisted counters on boot.
  try {
    if (fs.existsSync(file)) {
      const saved = JSON.parse(fs.readFileSync(file, 'utf8'));
      const now = Date.now();
      for (const [key, arr] of Object.entries(saved)) {
        const fresh = (arr || []).filter((t) => now - t < windowMs);
        if (fresh.length) hits.set(key, fresh);
      }
    }
  } catch { /* best-effort */ }

  const persist = () => {
    try {
      const snapshot = {};
      for (const [key, arr] of hits) snapshot[key] = arr;
      fs.writeFileSync(file, JSON.stringify(snapshot));
    } catch { /* best-effort */ }
  };

  const persistTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, arr] of hits) {
      const filtered = arr.filter((t) => now - t < windowMs);
      if (filtered.length === 0) hits.delete(key);
      else hits.set(key, filtered);
    }
    persist();
  }, windowMs);
  persistTimer.unref?.();

  return (req, res, next) => {
    if (!config.enableRateLimit) return next();
    const key = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (arr.length >= max) {
      res.set('Retry-After', String(Math.ceil(windowMs / 1000)));
      return res.status(429).json({ error: 'Too many requests, slow down.' });
    }
    arr.push(now);
    hits.set(key, arr);
    next();
  };
}

/**
 * Security hardening headers (equivalent of helmet defaults) applied to every
 * response. CSP is intentionally permissive for fonts/one inline SVG data uri
 * (favicon) but forbids remote script execution other than our own origin.
 */
export function securityHeaders(req, res, next) {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'X-DNS-Prefetch-Control': 'off',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https://i.ytimg.com https://img.youtube.com https://*.ytimg.com https://images.unsplash.com https://lh3.googleusercontent.com",
      "connect-src 'self' https://*.youtube.com https://*.ytimg.com",
      "frame-src 'none'",
    ].join('; '),
  });
  next();
}

/** Centralized JSON error handler + 404 fallback. */
export function notFoundHandler(req, res) {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.status(404).send('Not found');
}

export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  logger.error('Unhandled error', { message: err?.message, stack: err?.stack });
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Internal server error' });
}
