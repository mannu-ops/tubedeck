// Format and Quality Profiles for YouTube Extraction
export const VIDEO_QUALITIES = [
  { id: '2160p', label: '4K Ultra HD', resolution: '3840x2160', fps: '60fps', badge: '4K UHD', sizeMb: 720, format: 'MP4 / MKV', codec: 'AV1 / VP9', color: '#ff5500' },
  { id: '1440p', label: '2K Quad HD', resolution: '2560x1440', fps: '60fps', badge: '2K QHD', sizeMb: 390, format: 'MP4 / MKV', codec: 'VP9', color: '#ffaa00' },
  { id: '1080p60', label: '1080p 60FPS', resolution: '1920x1080', fps: '60fps', badge: 'FHD 60', sizeMb: 210, format: 'MP4', codec: 'H.264', color: '#d4ff00' },
  { id: '1080p', label: '1080p Full HD', resolution: '1920x1080', fps: '30fps', badge: 'FHD', sizeMb: 140, format: 'MP4', codec: 'H.264', color: '#0099ff' },
  { id: '720p', label: '720p HD', resolution: '1280x720', fps: '30fps', badge: 'HD', sizeMb: 75, format: 'MP4', codec: 'H.264', color: '#38bdf8' },
  { id: '480p', label: '480p Standard', resolution: '854x480', fps: '30fps', badge: 'SD', sizeMb: 35, format: 'MP4', codec: 'H.264', color: '#8e96a5' },
  { id: '360p', label: '360p Mobile', resolution: '640x360', fps: '30fps', badge: 'LOW', sizeMb: 18, format: 'MP4', codec: 'H.264', color: '#545b6b' }
];

export const AUDIO_QUALITIES = [
  { id: 'mp3-320', format: 'MP3', bitrate: '320 kbps', label: 'MP3 320 kbps', qualityName: 'Studio Master', badge: '320K MP3', sizeMb: 14.8, sampleRate: '48 kHz', desc: 'Highest MP3 quality with song details and album art', color: '#d4ff00' },
  { id: 'flac-lossless', format: 'FLAC', bitrate: 'Lossless', label: 'FLAC Lossless', qualityName: 'Audiophile Master', badge: 'FLAC', sizeMb: 42.5, sampleRate: '96 kHz', desc: 'Original studio audio quality without compression', color: '#ff5500' },
  { id: 'wav-studio', format: 'WAV', bitrate: '1411 kbps', label: 'WAV Studio', qualityName: 'PCM Lossless', badge: 'WAV', sizeMb: 54.0, sampleRate: '44.1 kHz', desc: 'Uncompressed audio for editing and production', color: '#ffaa00' },
  { id: 'm4a-256', format: 'M4A', bitrate: '256 kbps', label: 'M4A / AAC', qualityName: 'Apple Optimized', badge: 'M4A AAC', sizeMb: 11.2, sampleRate: '44.1 kHz', desc: 'Optimized for iPhone, iPad, and Mac devices', color: '#0099ff' },
  { id: 'mp3-256', format: 'MP3', bitrate: '256 kbps', label: 'MP3 256 kbps', qualityName: 'High Fidelity', badge: '256K MP3', sizeMb: 11.8, sampleRate: '44.1 kHz', desc: 'Great sound quality with smaller file size', color: '#38bdf8' },
  { id: 'mp3-192', format: 'MP3', bitrate: '192 kbps', label: 'MP3 192 kbps', qualityName: 'Standard Quality', badge: '192K MP3', sizeMb: 8.9, sampleRate: '44.1 kHz', desc: 'Standard quality for phones and everyday listening', color: '#8e96a5' },
  { id: 'opus-160', format: 'OPUS', bitrate: '160 kbps', label: 'Opus 160 kbps', qualityName: 'Compact Stream', badge: 'OPUS', sizeMb: 6.4, sampleRate: '48 kHz', desc: 'Modern compact audio format', color: '#32d74b' }
];
