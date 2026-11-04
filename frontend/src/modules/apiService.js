// Production-Ready API Service connecting to the TubeDeck Node.js backend
const getInitialBackendUrl = () => {
  // 1. If explicit environment variable is set at build time (e.g. VITE_API_URL=https://api.yourdomain.com)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }
  // 2. Local Vite development mode -> connect to Node server on same host/IP port 5000
  if (import.meta.env.DEV) {
    const host = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : 'localhost';
    return `http://${host}:5000`;
  }
  // 3. Production mode -> use same-origin relative path (e.g. /api/...)
  return '';
};

class ApiService {
  constructor() {
    this.backendUrl = getInitialBackendUrl();
    this.isBackendOnline = false;
  }

  getBackendUrl() {
    return this.backendUrl;
  }

  setBackendUrl(url) {
    this.backendUrl = (url || '').replace(/\/+$/, '');
    return this.checkHealth();
  }

  async checkHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const url = this.backendUrl ? `${this.backendUrl}/api/health` : '/api/health';
      const res = await fetch(url, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      this.isBackendOnline = res.ok;
      return this.isBackendOnline;
    } catch {
      this.isBackendOnline = false;
      return false;
    }
  }

  async fetchMediaInfo(url) {
    await this.checkHealth();

    if (!this.isBackendOnline) {
      throw new Error(import.meta.env.DEV
        ? 'Backend offline. Please start the backend: cd backend && npm start'
        : 'Server is temporarily unreachable. Please check your connection and try again.');
    }

    const apiUrl = this.backendUrl ? `${this.backendUrl}/api/info` : '/api/info';
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to inspect stream. Verify YouTube URL.');
    }

    return await res.json();
  }

  async startDownloadJob(payload) {
    await this.checkHealth();
    if (!this.isBackendOnline) {
      throw new Error(import.meta.env.DEV
        ? 'Backend offline. Please start the backend.'
        : 'Server is temporarily unreachable. Please try again in a moment.');
    }

    const apiUrl = this.backendUrl ? `${this.backendUrl}/api/download/start` : '/api/download/start';
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to start download job');
    }

    return await res.json();
  }

  async getDownloadJobStatus(jobId, token) {
    const q = token ? `?token=${encodeURIComponent(token)}` : '';
    const apiUrl = this.backendUrl ? `${this.backendUrl}/api/download/status/${jobId}${q}` : `/api/download/status/${jobId}${q}`;
    const res = await fetch(apiUrl);
    if (!res.ok) {
      throw new Error('Job not found');
    }
    return await res.json();
  }

  getFileDownloadUrl(jobId, token) {
    const q = token ? `?token=${encodeURIComponent(token)}` : '';
    return this.backendUrl ? `${this.backendUrl}/api/download/file/${jobId}${q}` : `/api/download/file/${jobId}${q}`;
  }
}

export const apiService = new ApiService();
