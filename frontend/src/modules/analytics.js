/**
 * Analytics module — privacy-friendly by default, with optional Google
 * Analytics integration (enabled by setting VITE_GA_ID at build time).
 *
 * - Without VITE_GA_ID: events are recorded locally (localStorage) and, when
 *   the backend is reachable, sent to the /api/stats endpoint. No third-party
 *   cookies or network calls to Google are made.
 * - With VITE_GA_ID: the standard gtag snippet is loaded and events are also
 *   forwarded to Google Analytics 4.
 */

const GA_ID = import.meta.env.VITE_GA_ID || '';

const STORAGE_KEY = 'tubedeck_analytics_events';

function getLocalEvents() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function pushLocalEvent(event) {
  const events = getLocalEvents();
  events.push({
    ...event,
    ts: Date.now(),
  });
  // Keep the last 500 events to bound storage.
  if (events.length > 500) events.splice(0, events.length - 500);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    /* storage might be full; ignore */
  }
}

function initGA() {
  if (!GA_ID || window.gtag) return;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID);
}

export const analytics = {
  init() {
    initGA();
    this.track('page_view', { page: location.hash || '/' });
  },

  track(eventName, params = {}) {
    const event = { name: eventName, ...params };
    pushLocalEvent(event);

    if (window.gtag) {
      window.gtag('event', eventName, params);
    }

    // Best-effort report to the backend for local dashboards.
    try {
      const url = `${import.meta.env.VITE_API_URL || ''}/api/stats`;
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: eventName, params, ts: Date.now() }),
        keepalive: true,
      }).catch(() => { });
    } catch {
      /* ignore network errors */
    }
  },
};

export default analytics;
