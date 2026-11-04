export function formatDuration(sec) {
  if (!sec || Number.isNaN(Number(sec))) return '0:00';
  const s = Math.max(0, Math.floor(Number(sec)));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r < 10 ? '0' : ''}${r}`;
}

export function formatViews(views) {
  const v = Number(views);
  if (!v || Number.isNaN(v)) return '1M+ views';
  if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M views';
  if (v >= 1000) return (v / 1000).toFixed(1) + 'K views';
  return v + ' views';
}

export function sanitizeFilename(name) {
  return (name || 'TubeDeck_Media')
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
}

/** Strictly allow only YouTube hosts (youtube.com + youtu.be), https/http only. */
export function isValidYouTubeUrl(raw) {
  if (!raw || typeof raw !== 'string') return false;
  const s = raw.trim();
  if (!s) return false;
  let u;
  try {
    u = new URL(s);
  } catch {
    return false;
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
  const host = u.hostname.toLowerCase();
  if (host === 'youtu.be' || host === 'www.youtu.be') return true;
  if (host === 'youtube.com' || host === 'www.youtube.com' ||
      host === 'm.youtube.com' || host === 'music.youtube.com') return true;
  if (host.endsWith('.youtube.com')) return true;
  return false;
}

export function isPlaylistUrl(url) {
  return /[?&]list=/.test(url) || url.includes('/playlist');
}

export function parseJobId(name) {
  // "job_1678123456789_123" -> "job_1678123456789"
  const m = name.match(/^(job_\d+)/);
  return m ? m[1] : null;
}
