import { spawn } from 'node:child_process';
import { config } from './config.js';
import { logger } from './logger.js';
import { sanitizeFilename } from './utils.js';

/** Run yt-dlp with `args`, capture all stdout/stderr, resolve with { code, stdout, stderr }. */
export function runYtDlp(args, { timeoutMs = 120000 } = {}) {
  return new Promise((resolve) => {
    const proc = spawn(config.ytDlpPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    let done = false;

    const finish = (code) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    };

    const timer = setTimeout(() => {
      logger.warn('yt-dlp timed out, killing', { args: args.join(' ') });
      proc.kill('SIGKILL');
      finish(1);
    }, timeoutMs);

    proc.stdout.on('data', (c) => { stdout += c.toString(); });
    proc.stderr.on('data', (c) => { stderr += c.toString(); });
    proc.on('error', (err) => {
      logger.error('yt-dlp spawn error', { error: err.message });
      finish(1);
    });
    proc.on('close', (code) => finish(code ?? 1));
  });
}

/** Parse a yt-dlp download progress line. Tolerates locale commas and missing ETA. */
export function parseProgressLine(text) {
  const match = text.match(/\[download\]\s+([\d.,]+)%\s+of\s+~?([^\s]+)\s+at\s+([^\s]+)(?:\s+ETA\s+([^\s]+))?/);
  if (match) {
    return {
      progress: Math.min(99, parseFloat(match[1].replace(',', '.'))),
      speed: match[3],
      eta: match[4] || undefined,
    };
  }
  const pctMatch = text.match(/(\d{1,3}(?:[.,]\d+)?)%/);
  if (pctMatch) {
    return { progress: Math.min(99, parseFloat(pctMatch[1].replace(',', '.'))) };
  }
  return null;
}

/** Build the yt-dlp CLI for a single download job. */
export function buildDownloadArgs({ url, quality = '1080p', format = 'mp4', type = 'video', targetFilePath }) {
  const isAudio = type === 'audio' || /^(mp3|flac|wav|m4a)/.test(quality);
  const extension = isAudio
    ? (quality.includes('flac') ? 'flac' : (quality.includes('wav') ? 'wav' : (quality.includes('m4a') ? 'm4a' : 'mp3')))
    : (format || 'mp4').toLowerCase();

  const args = [
    '--newline',
    '--no-warnings',
    '--no-check-certificates',
  ];

  if (config.ffmpegPath) {
    args.push('--ffmpeg-location', config.ffmpegPath, '--postprocessor-args', 'ffmpeg:-nostdin');
  }

  if (isAudio) {
    args.push('-x', '--audio-format', extension);
    if (extension === 'mp3') args.push('--audio-quality', '0');
  } else {
    let maxHeight = 1080;
    if (/2160|4K/.test(quality)) maxHeight = 2160;
    else if (/1440|2K/.test(quality)) maxHeight = 1440;
    else if (/720/.test(quality)) maxHeight = 720;
    else if (/480/.test(quality)) maxHeight = 480;
    else if (/360/.test(quality)) maxHeight = 360;

    args.push(
      '-f',
      `bestvideo[height<=${maxHeight}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${maxHeight}]+bestaudio/best[height<=${maxHeight}]/best`,
      '--merge-output-format', extension,
    );
  }

  args.push('-o', targetFilePath, url);
  return { isAudio, extension, args };
}

export function sanitizeTitle(title) {
  return sanitizeFilename(title || 'TubeDeck_Media');
}
