import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import { config } from './config.js';
import { jobStore } from './jobs.js';
import { logger } from './logger.js';
import { runYtDlp, parseProgressLine, buildDownloadArgs, sanitizeTitle } from './extractor.js';
import { rateLimiter } from './middleware.js';
import { isValidYouTubeUrl, isPlaylistUrl, formatDuration, formatViews } from './utils.js';

const api = Router();
api.use(rateLimiter());

// ---------------------------------------------------------------- health
api.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    engine: 'TubeDeck Precision Node Engine',
    ytdlp: true,
    ffmpeg: !!config.ffmpegPath,
    timestamp: Date.now(),
  });
});

// ---------------------------------------------------------------- info
api.post('/info', async (req, res) => {
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'URL is required' });
  if (!isValidYouTubeUrl(url)) {
    return res.status(400).json({ error: 'Only YouTube URLs are allowed (youtube.com / youtu.be).' });
  }

  try {
    const args = ['--dump-single-json', '--no-warnings', '--no-check-certificates'];
    if (isPlaylistUrl(url)) args.push('--flat-playlist');
    args.push(url);

    const { code, stdout, stderr } = await runYtDlp(args);
    if (code !== 0) {
      logger.warn('yt-dlp info failed', { code, stderr: stderr.slice(-800) });
      return res.status(502).json({ error: 'Failed to inspect stream URL', details: stderr.slice(-800) });
    }

    const data = JSON.parse(stdout);
    if (data._type === 'playlist' || Array.isArray(data.entries)) {
      return res.json(buildPlaylistApi(url, data));
    }
    return res.json(buildVideoApi(url, data));
  } catch (err) {
    logger.error('Error in /api/info', { message: err.message });
    return res.status(500).json({ error: 'Failed to inspect stream', details: err.message });
  }
});

function buildPlaylistApi(url, data) {
  const rawEntries = data.entries || [];
  let totalSecs = 0;
  const videos = rawEntries.map((entry, idx) => {
    const sec = entry.duration || 210;
    totalSecs += sec;
    const title = entry.title || `Track ${idx + 1}`;
    const artist = entry.uploader || entry.channel || data.uploader || 'YouTube Artist';
    const thumb = entry.thumbnails?.[0]?.url || (entry.id ? `https://i.ytimg.com/vi/${entry.id}/hqdefault.jpg` : data.thumbnail);
    const videoUrl = entry.url || (entry.id ? `https://www.youtube.com/watch?v=${entry.id}` : null);
    return {
      id: entry.id || `track-${idx + 1}`,
      url: videoUrl,
      title,
      duration: formatDuration(sec),
      durationSec: sec,
      artist,
      thumbnail: thumb,
      sizeVideo: `${Math.round(sec * 0.45)} MB`,
      sizeAudio: `${(sec * 0.04).toFixed(1)} MB`,
      selected: true,
    };
  });

  const totalHours = Math.floor(totalSecs / 3600);
  const totalMins = Math.floor((totalSecs % 3600) / 60);
  const durationStr = totalHours > 0 ? `${totalHours}h ${totalMins}m` : `${totalMins}m`;

  return {
    id: data.id || 'playlist',
    url,
    title: data.title || 'YouTube Playlist',
    channel: data.uploader || data.channel || 'YouTube Channel',
    channelAvatar: data.thumbnails?.[0]?.url || videos[0]?.thumbnail,
    totalVideos: videos.length,
    totalDuration: durationStr,
    estimatedZipSize: `~${(videos.length * 11.2).toFixed(0)} MB (MP3)`,
    thumbnail: videos[0]?.thumbnail || data.thumbnail,
    isPlaylist: true,
    videos,
  };
}

function buildVideoApi(url, data) {
  const durationSec = data.duration || 0;
  const bestThumb = data.thumbnail || data.thumbnails?.[data.thumbnails.length - 1]?.url ||
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800';

  const rawFormats = data.formats || [];
  const videoStreams = rawFormats.filter((f) => f.vcodec && f.vcodec !== 'none');

  const QUALITY_PRESETS = [
    { minHeight: 2160, id: '2160p', label: '4K Ultra HD', resolution: '3840x2160', badge: '4K UHD', codec: 'AV1 / VP9', color: '#ff5500' },
    { minHeight: 1440, id: '1440p', label: '2K Quad HD', resolution: '2560x1440', badge: '2K QHD', codec: 'VP9', color: '#ffaa00' },
    { minHeight: 1080, id: '1080p', label: '1080p Full HD', resolution: '1920x1080', badge: 'FHD', codec: 'H.264', color: '#0099ff' },
    { minHeight: 720, id: '720p', label: '720p HD', resolution: '1280x720', badge: 'HD', codec: 'H.264', color: '#38bdf8' },
    { minHeight: 480, id: '480p', label: '480p Standard', resolution: '854x480', badge: 'SD', codec: 'H.264', color: '#8e96a5' },
    { minHeight: 360, id: '360p', label: '360p Mobile', resolution: '640x360', badge: 'LOW', codec: 'H.264', color: '#545b6b' },
  ];

  const availableQualities = [];
  for (const preset of QUALITY_PRESETS) {
    const match = videoStreams.find((f) => f.height === preset.minHeight);
    if (!match) continue;
    const fps = match.fps ? `${match.fps}fps` : '30fps';
    const is60 = match.fps && match.fps >= 50;
    const label = preset.minHeight === 1080 && is60 ? '1080p 60FPS' : (preset.minHeight === 2160 && is60 ? '4K 60FPS Ultra HD' : preset.label);
    const badge = preset.minHeight === 1080 && is60 ? 'FHD 60' : preset.badge;

    let sizeMb = 0;
    if (match.filesize) sizeMb = Math.round(match.filesize / (1024 * 1024));
    else if (match.filesize_approx) sizeMb = Math.round(match.filesize_approx / (1024 * 1024));
    else {
      const defaultRates = { 2160: 3.5, 1440: 2.0, 1080: 1.1, 720: 0.55, 480: 0.28, 360: 0.15 };
      sizeMb = Math.max(5, Math.round(durationSec * (defaultRates[preset.minHeight] || 0.5)));
    }

    availableQualities.push({
      id: preset.id,
      label,
      resolution: match.resolution || preset.resolution,
      fps,
      badge,
      sizeMb: Math.max(1, sizeMb),
      format: 'MP4',
      codec: match.vcodec?.startsWith('avc') ? 'H.264' : (match.vcodec?.startsWith('vp9') ? 'VP9' : 'AV1'),
      color: preset.color,
    });
  }

  if (availableQualities.length === 0) {
    availableQualities.push({
      id: '720p', label: '720p HD', resolution: '1280x720', fps: '30fps',
      badge: 'HD', sizeMb: Math.max(10, Math.round(durationSec * 0.5)),
      format: 'MP4', codec: 'H.264', color: '#38bdf8',
    });
  }

  return {
    id: data.id,
    url,
    title: data.title || 'YouTube Stream',
    channel: data.uploader || data.channel || 'Creator',
    channelAvatar: data.thumbnails?.[0]?.url || bestThumb,
    views: formatViews(data.view_count),
    published: data.upload_date ? `${data.upload_date.slice(0, 4)}-${data.upload_date.slice(4, 6)}-${data.upload_date.slice(6, 8)}` : 'Recently',
    duration: formatDuration(durationSec),
    thumbnail: bestThumb,
    isPlaylist: false,
    availableQualities,
  };
}

// ---------------------------------------------------------------- download
api.post('/download/start', (req, res) => {
  const { url, quality = '1080p', format = 'mp4', type = 'video', title } = req.body || {};
  if (!url) return res.status(400).json({ error: 'URL is required' });
  if (!isValidYouTubeUrl(url)) {
    return res.status(400).json({ error: 'Only YouTube URLs are allowed (youtube.com / youtu.be).' });
  }

  const jobId = 'job_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
  // Secret token so only the downloader that created the job can poll/fetch it.
  const token = crypto.randomBytes(18).toString('hex');
  const cleanTitle = sanitizeTitle(title);
  const { isAudio, extension, args } = buildDownloadArgs({ url, quality, format, type, targetFilePath: '' });
  const filename = `${cleanTitle}_[${quality}].${extension}`;
  const targetFilePath = path.join(config.tempDir, `${jobId}.${extension}`);

  const job = {
    id: jobId,
    url,
    title: cleanTitle,
    filename,
    filePath: targetFilePath,
    status: 'downloading',
    progress: 1,
    speed: '0.0 MB/s',
    eta: 'Starting...',
    error: null,
    createdAt: Date.now(),
    isAudio,
    token,
  };
  jobStore.create(job);

  // Rebuild args with the real target path.
  const fullArgs = buildDownloadArgs({ url, quality, format, type, targetFilePath }).args;
  const proc = spawn(config.ytDlpPath, fullArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
  job.proc = proc;

  let stdoutBuf = '';

  proc.stdout.on('data', (chunk) => {
    stdoutBuf += chunk.toString();
    const parsed = parseProgressLine(stdoutBuf);
    if (parsed) {
      stdoutBuf = '';
      jobStore.update(jobId, {
        progress: parsed.progress,
        speed: parsed.speed ?? job.speed,
        eta: parsed.eta ?? job.eta,
      });
    }
  });
  proc.stderr.on('data', (chunk) => {
    const parsed = parseProgressLine(chunk.toString());
    if (parsed) {
      jobStore.update(jobId, { progress: parsed.progress, speed: parsed.speed ?? job.speed, eta: parsed.eta ?? job.eta });
    }
  });
  proc.on('error', (err) => {
    logger.error('Download spawn error', { jobId, error: err.message });
    jobStore.update(jobId, { status: 'error', error: `Failed to start download: ${err.message}` });
    jobStore.delete(jobId);
  });
  proc.on('close', (code) => {
    if (code === 0 && fs.existsSync(targetFilePath)) {
      jobStore.update(jobId, { status: 'ready', progress: 100, speed: 'Done', eta: 'Ready' });
    } else {
      jobStore.update(jobId, { status: 'error', error: `Download failed with exit code ${code}` });
      // Best-effort cleanup of partial file.
      setTimeout(() => {
        try { if (fs.existsSync(targetFilePath)) fs.unlinkSync(targetFilePath); } catch { /* ignore */ }
        jobStore.delete(jobId);
      }, 1000);
    }
  });

  res.json({ jobId, filename, token });
});

api.get('/download/status/:jobId', (req, res) => {
  const job = jobStore.get(req.params.jobId);
  if (!job || String(job.token) !== String(req.query.token || '')) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json({
    status: job.status,
    progress: job.progress,
    speed: job.speed,
    eta: job.eta,
    filename: job.filename,
    error: job.error,
  });
});

api.get('/download/file/:jobId', (req, res) => {
  const job = jobStore.get(req.params.jobId);
  if (!job || String(job.token) !== String(req.query.token || '') || job.status !== 'ready' || !fs.existsSync(job.filePath)) {
    return res.status(404).send('File not found or still processing');
  }
  res.download(job.filePath, job.filename, () => {
    // Cleanup after the transfer settles.
    setTimeout(() => {
      try { if (fs.existsSync(job.filePath)) fs.unlinkSync(job.filePath); } catch { /* ignore */ }
      jobStore.delete(job.id);
    }, 5000);
  });
});

// ---------------------------------------------------------------- stats
// Lightweight, privacy-friendly analytics endpoint. The frontend sends events
// here for a local dashboard; no personal data or third-party sharing.
const statsEvents = [];
const STATS_CAP = 2000;

api.post('/stats', (req, res) => {
  const { event, params, ts } = req.body || {};
  if (event) {
    statsEvents.push({ event, params: params || {}, ts: ts || Date.now() });
    if (statsEvents.length > STATS_CAP) statsEvents.splice(0, statsEvents.length - STATS_CAP);
  }
  res.status(204).end();
});

api.get('/stats', (req, res) => {
  const counts = {};
  for (const e of statsEvents) {
    counts[e.event] = (counts[e.event] || 0) + 1;
  }
  res.json({ total: statsEvents.length, counts, recent: statsEvents.slice(-50) });
});

export default api;
