import path from 'node:path';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import ffmpeg from 'ffmpeg-static';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');
const projectRoot = path.resolve(backendRoot, '..');

/**
 * Minimal .env loader (no extra dependency). Values already present in
 * process.env are never overwritten. Lines are `KEY=VALUE`; `#` starts a
 * comment; quotes are stripped. Malformed lines are skipped silently.
 */
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const idx = line.indexOf('=');
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(backendRoot, '.env'));

const bool = (v, dflt) => (v === undefined ? dflt : ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase()));

/**
 * Cross-platform yt-dlp resolution:
 *  1. explicit YT_DLP_PATH env override, else
 *  2. bin/yt-dlp.exe on Windows, bin/yt-dlp on POSIX, else
 *  3. an installed `yt-dlp` on PATH.
 */
function resolveYtDlp() {
  const override = process.env.YT_DLP_PATH;
  if (override && fs.existsSync(override)) return override;

  const isWin = process.platform === 'win32';
  const local = path.join(backendRoot, 'bin', isWin ? 'yt-dlp.exe' : 'yt-dlp');
  if (fs.existsSync(local)) return local;

  // Fall back to PATH lookup.
  try {
    const probe = spawnSync(isWin ? 'where' : 'which', [isWin ? 'yt-dlp.exe' : 'yt-dlp'], { shell: isWin });
    if (probe.status === 0 && probe.stdout) {
      return probe.stdout.toString().split(/\r?\n/)[0].trim();
    }
  } catch { /* ignore */ }

  return local; // will fail at spawn time with a clear error
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',

  corsOrigin: process.env.CORS_ORIGIN || '*',
  enableRateLimit: bool(process.env.ENABLE_RATE_LIMIT, true),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '120', 10),

  jobTtlMs: parseInt(process.env.JOB_TTL_MS || String(30 * 60 * 1000), 10),
  jobSweepIntervalMs: parseInt(process.env.JOB_SWEEP_INTERVAL_MS || String(10 * 60 * 1000), 10),
  persistJobs: bool(process.env.PERSIST_JOBS, true),

  maxDownloadBytes: parseInt(process.env.MAX_DOWNLOAD_BYTES || String(4 * 1024 * 1024 * 1024), 10),

  backendRoot,
  projectRoot,
  tempDir: path.join(backendRoot, 'temp'),
  dataDir: path.join(backendRoot, 'data'),
  jobsFile: path.join(backendRoot, 'data', 'jobs.json'),
  distPath: process.env.DIST_PATH || path.join(projectRoot, 'frontend', 'dist'),

  ytDlpPath: resolveYtDlp(),
  ffmpegPath: ffmpeg || null,
};

for (const dir of [config.tempDir, config.dataDir]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
