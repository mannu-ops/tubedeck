import './style.css';
import { icons } from './modules/icons.js';
import { hardwareAudio } from './modules/cyberAudio.js';
import { VIDEO_QUALITIES, AUDIO_QUALITIES } from './modules/mockData.js';
import { apiService } from './modules/apiService.js';
import { downloadManager } from './modules/downloadManager.js';
import { initI18n } from './modules/i18n.js';
import { renderTopHeader, renderHeroHighlights, renderLandingContent, renderSiteFooter } from './modules/landingContent.js';
import { renderBlogIndex, renderArticle, renderAbout, renderContact, renderPrivacy, renderTerms, renderNotFound } from './modules/contentPages.js';
import { analytics } from './modules/analytics.js';

// Application State
const state = {
  activeModule: 'download', // 'download', 'queue'
  activeMediaView: 'video', // 'video' | 'playlist'
  videoViewMode: 'video', // 'video' | 'audio'
  playlistSubTab: 'tracks', // 'tracks' | 'zip'
  urlInput: '',
  currentMedia: null,
  selectedVideoQuality: VIDEO_QUALITIES[0], // 4K default
  selectedVideoFormat: 'MP4',
  selectedMuxAudio: AUDIO_QUALITIES[0], // 320k MP3 default for Video+Audio muxing
  selectedAudioQuality: AUDIO_QUALITIES[0], // 320k MP3 default for Audio-only
  audioOptions: {
    embedTags: true,
    normalizeGain: true,
    trimSilence: false
  },
  playlist: null,
  playlistFilter: '',
  playlistPage: 1,
  playlistPageSize: 50,
  playlistMasterVideo: '1080p', // '1080p', '720p', '480p', '360p'
  playlistMasterAudio: 'mp3-320', // 'mp3-320', 'mp3-256', 'mp3-128', 'flac-lossless'
  isAnalyzing: false,
  isDrawerOpen: false,
  drawerTab: 'queue', // 'queue' | 'history'
  route: '/' // hash route: '/' (tool) | '/blog' | '/blog/<slug>' | '/about' | '/contact' | '/privacy' | '/terms'
};

// Site / AdSense configuration (Track C). Flip `enabled` to true and paste your
// publisher + slot IDs once Google AdSense approves your site.
const siteConfig = {
  adsense: {
    enabled: false, // TODO: set to true after AdSense approval for    clientId: 'ca-pub-XXXXXXXXXXXXXXXX', // your publisher ID
    slots: {
      belowHeader: '1234567890',
      belowHero: '1234567891',
      inContent: '1234567892'
    }
  }
};

const CONSENT_KEY = 'tubedeck_consent';
const AD_SLOT_IDS = new Set(Object.values(siteConfig.adsense.slots));

// Escape untrusted strings before injecting into HTML templates (prevents XSS)
function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// Tactical Notification Toast (Bottom-Right Corner)
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const isSuccess = type === 'success';
  const isError = type === 'error' || type === 'alert';

  const toast = document.createElement('div');
  toast.className = `tactical-toast ${isSuccess ? 'toast-success' : (isError ? 'toast-error' : 'toast-info')}`;

  const iconHtml = isSuccess
    ? `<span style="color:#32d74b; display:flex; align-items:center;">${icons.checkCircle}</span>`
    : (isError
      ? `<span style="color:#ff3344; display:flex; align-items:center;">${icons.alertTriangle}</span>`
      : `<span style="color:var(--signal-orange); display:flex; align-items:center;">${icons.bolt}</span>`);

  toast.innerHTML = `
    ${iconHtml}
    <span style="font-weight:600;">${escapeHtml(message)}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

// Main Render Function
function renderApp() {
  const app = document.getElementById('app');
  if (!app) return;

  const downloadState = downloadManager.getState();
  const activeCount = downloadState.activeCount;
  const historyCount = downloadState.history ? downloadState.history.length : 0;

  // Content/legal routes (#/blog, #/privacy, ...) render their own shell.
  if (state.route !== '/') {
    app.innerHTML = renderContentShell(state.route);
    attachEventHandlers();
    ensureConsentBanner();
    return;
  }

  app.innerHTML = `
    <!-- Top Global Sticky Header with Navigation -->
    ${renderTopHeader(activeCount, icons, historyCount)}

    <!-- Hero Feature Highlights Bar -->
    ${renderHeroHighlights(icons)}
    ${renderAdSlot('belowHeader')}

    <div class="deck-workbench" id="main-downloader">
      <!-- Master Hardware Chassis -->
      <div class="deck-chassis">
        <!-- Corner Hex Screws -->
        <div class="screw tl"></div>
        <div class="screw tr"></div>
        <div class="screw bl"></div>
        <div class="screw br"></div>

        <!-- Input Bay -->
        <section class="input-bay">
          <div class="bay-label-row">
            <div class="bay-label-group">
              <span class="bay-status-dot"></span>
              <span class="bay-label">ENTER YOUTUBE URL</span>
            </div>
            <div class="bay-formats-pill">
              <span>VIDEOS</span>
              <span class="pill-divider">•</span>
              <span>SHORTS</span>
              <span class="pill-divider">•</span>
              <span>PLAYLISTS</span>
            </div>
          </div>

          <div class="bay-dock-frame">
            <div class="bay-input-row">
              <span class="bay-search-icon">
                ${icons.search}
              </span>
              <input 
                type="text" 
                class="bay-input" 
                id="main-url-input" 
                placeholder="Paste YouTube link here..." 
                value="${state.urlInput}"
                autocomplete="off"
                spellcheck="false"
                autocorrect="off"
                autocapitalize="off"
              />
              <button class="bay-clear-btn" id="btn-clear-url" title="Clear link" style="display: ${state.urlInput ? 'flex' : 'none'};">
                ${icons.close}
              </button>
            </div>
            <div class="bay-actions">
              <button class="tactile-btn bay-paste-btn" id="btn-paste-clipboard" title="Paste link from clipboard">
                ${icons.paste} <span>PASTE</span>
              </button>
              <button class="tactile-btn orange-accent bay-fetch-btn" id="btn-analyze-stream" title="Analyze link and fetch info">
                ${state.isAnalyzing ? icons.layers : icons.bolt}
                <span>${state.isAnalyzing ? 'FETCHING...' : 'FETCH INFO'}</span>
              </button>
            </div>
          </div>
        </section>

        <!-- Module Active Viewport -->
        <main class="cartridge-stage" id="module-viewport">
          ${renderActiveModule()}
        </main>
      </div>
    </div>

    <!-- Rich Landing Page Content Sections (How-to, Features, Devices, Pro Tips, FAQ, Compliance, Footer) -->
    ${renderLandingContent(icons)}

    ${renderDrawerPanel(activeCount, historyCount)}
  `;

  attachEventHandlers();
  ensureConsentBanner();
}

// ---------------------------------------------------------------------------
// Content route shell (Track A) + legal/meta pages via the hash router
// ---------------------------------------------------------------------------
const CONTENT_ROUTES = ['/blog', '/about', '/contact', '/privacy', '/terms'];

function resolveRoute(hash) {
  let p = (hash || '#/').replace(/^#/, '') || '/';
  if (!p.startsWith('/')) p = '/' + p;
  if (p.startsWith('/blog/')) return { page: p, anchor: null };
  if (CONTENT_ROUTES.includes(p)) return { page: p, anchor: null };
  // anything else is the tool page, optionally with an in-page anchor
  return { page: '/', anchor: p === '/' ? null : p };
}

function applyRoute() {
  const { page, anchor } = resolveRoute(location.hash);
  const changed = page !== state.route;
  state.route = page;
  if (changed) {
    renderApp();
  }
  if (anchor) {
    requestAnimationFrame(() => {
      const el = document.querySelector(anchor);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  } else if (changed) {
    window.scrollTo(0, 0);
  }
}

function renderContentPage(path) {
  if (path === '/blog') return renderBlogIndex();
  if (path.startsWith('/blog/')) return renderArticle(path.slice(6));
  switch (path) {
    case '/about': return renderAbout();
    case '/contact': return renderContact();
    case '/privacy': return renderPrivacy();
    case '/terms': return renderTerms();
    default: return renderNotFound();
  }
}

function renderContentShell(path) {
  const downloadState = downloadManager.getState();
  const activeCount = downloadState.activeCount;
  const historyCount = downloadState.history ? downloadState.history.length : 0;
  const page = renderContentPage(path);
  return `
    ${renderTopHeader(activeCount, icons, historyCount)}
    ${renderAdSlot('belowHeader')}
    <main class="content-shell-main">
      ${page}
    </main>
    ${renderSiteFooter(icons)}
    ${renderDrawerPanel(activeCount, historyCount)}
  `;
}

function renderDrawerPanel(activeCount, historyCount) {
  return `
    <!-- Drawer Backdrop Overlay -->
    <div class="drawer-backdrop ${state.isDrawerOpen ? 'open' : ''}" id="drawer-backdrop"></div>

    <!-- Slide-out Transfer Queue & History Drawer -->
    <aside class="queue-drawer-panel ${state.isDrawerOpen ? 'open' : ''}" id="queue-drawer">
      <div class="drawer-header-bar">
        <div class="drawer-nav-tabs">
          <button class="drawer-tab-btn ${state.drawerTab === 'queue' ? 'active' : ''}" id="drawer-tab-queue">
            ${icons.download}
            <span>QUEUE</span>
            <span class="drawer-tab-badge" id="drawer-queue-count">${activeCount}</span>
          </button>
          <button class="drawer-tab-btn ${state.drawerTab === 'history' ? 'active' : ''}" id="drawer-tab-history">
            ${icons.history}
            <span>HISTORY</span>
            <span class="drawer-tab-badge lime" id="drawer-history-count">${historyCount}</span>
          </button>
        </div>
        <button class="tactile-btn drawer-close-btn" id="btn-close-drawer" title="Close Drawer">
          ${icons.close}
        </button>
      </div>

      <div style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:10px;" id="drawer-queue-items">
        ${renderDrawerItems()}
      </div>
    </aside>
  `;
}

// ---------------------------------------------------------------------------
// AdSense (Track C) — placeholder slots + loader. Disabled until approval.
// ---------------------------------------------------------------------------
function renderAdSlot(key) {
  if (!siteConfig.adsense.enabled) {
    return `
      <div class="ad-slot ad-placeholder" data-ad-slot="${key}">
        <div class="ad-placeholder-inner">
          <span>ADVERTISEMENT</span>
          <small>Your ad can appear here — enable AdSense in siteConfig after approval.</small>
        </div>
      </div>
    `;
  }
  const slotId = siteConfig.adsense.slots[key] || siteConfig.adsense.slots.belowHeader;
  return `
    <ins class="adsbygoogle ad-slot"
      style="display:block; min-height:90px;"
      data-ad-client="${siteConfig.adsense.clientId}"
      data-ad-slot="${slotId}"
      data-ad-format="auto"
      data-full-width-responsive="true"></ins>
  `;
}

function loadAdSense() {
  if (!siteConfig.adsense.enabled) return;
  if (document.getElementById('adsense-script')) return;
  if (!hasConsent()) return;
  const s = document.createElement('script');
  s.id = 'adsense-script';
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${siteConfig.adsense.clientId}`;
  document.head.appendChild(s);
}

function pushAdSlots() {
  if (!siteConfig.adsense.enabled) return;
  const pending = document.querySelectorAll('ins.adsbygoogle:not([data-pushed])');
  if (pending.length === 0) return;
  pending.forEach(el => el.setAttribute('data-pushed', '1'));
  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// GDPR-style cookie consent banner (required when ads are enabled)
// ---------------------------------------------------------------------------
function hasConsent() {
  return localStorage.getItem(CONSENT_KEY) === 'accepted';
}

function ensureConsentBanner() {
  if (hasConsent() || document.getElementById('consent-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'consent-banner';
  banner.className = 'consent-banner';
  banner.innerHTML = `
    <div class="consent-banner-inner">
      <p>We use cookies to personalise content and serve relevant ads. See our <a href="#/privacy">Privacy Policy</a>.</p>
      <div class="consent-actions">
        <button type="button" class="tactile-btn orange-accent" id="btn-consent-accept">Accept</button>
        <button type="button" class="tactile-btn" id="btn-consent-decline">Decline</button>
      </div>
    </div>
  `;
  document.body.appendChild(banner);
  banner.querySelector('#btn-consent-accept')?.addEventListener('click', () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    banner.remove();
    loadAdSense();
    pushAdSlots();
  });
  banner.querySelector('#btn-consent-decline')?.addEventListener('click', () => {
    localStorage.setItem(CONSENT_KEY, 'declined');
    banner.remove();
  });
}

// Active Module Switcher
function renderActiveModule() {
  switch (state.activeModule) {
    case 'download':
    case 'video':
    case 'playlist':
    case 'zip':
      return renderDownloadModule();
    case 'audio':
      return renderDownloadModule();
    case 'queue':
      return renderQueueModule();
    default:
      return renderDownloadModule();
  }
}

// UNIFIED DOWNLOAD CONSOLE (SMART AUTO-DETECT: VIDEO / PLAYLIST / ZIP)
function renderDownloadModule() {
  const hasVideo = !!state.currentMedia;
  const hasPlaylist = !!(state.playlist && state.playlist.videos && state.playlist.videos.length > 0);

  // Standby State: Neither video nor playlist loaded yet
  if (!hasVideo && !hasPlaylist) {
    return `
      <div class="deck-standby-state">
        <div class="standby-radar-ring">
          ${icons.download}
        </div>
        <div class="standby-status-label">READY TO DOWNLOAD</div>
        <p class="standby-instruction">
          Paste any YouTube video, Shorts, or playlist link in the box above and click <strong style="color:var(--signal-orange);">FETCH INFO</strong>.
        </p>
        <div class="standby-spec-tags">
          <span>4K & 1080p VIDEO</span>
          <span>MP3 / FLAC AUDIO</span>
          <span>PLAYLIST & ZIP</span>
        </div>
      </div>
    `;
  }

  // Auto-resolve active view
  let currentView = state.activeMediaView || 'video';
  if (hasPlaylist && !hasVideo) {
    currentView = 'playlist';
  } else if (hasVideo && !hasPlaylist) {
    currentView = 'video';
  }

  // Dual Switcher Bar (only visible when both single video and playlist are loaded in this session)
  let dualSwitcherHtml = '';
  if (hasVideo && hasPlaylist) {
    const videoTitle = state.currentMedia.title || 'Single Video';
    const shortVidTitle = videoTitle.length > 26 ? videoTitle.substring(0, 23) + '...' : videoTitle;
    const plCount = state.playlist.totalVideos || state.playlist.videos.length;

    dualSwitcherHtml = `
      <div class="unified-mode-switcher">
        <button class="unified-switch-btn ${currentView === 'video' ? 'active' : ''}" id="btn-show-video-view">
          ${icons.video}
          <span class="switch-btn-label">SINGLE VIDEO</span>
          <span class="switch-btn-sub">${escapeHtml(shortVidTitle)}</span>
        </button>
        <button class="unified-switch-btn ${currentView === 'playlist' ? 'active' : ''}" id="btn-show-playlist-view">
          ${icons.playlist}
          <span class="switch-btn-label">PLAYLIST</span>
          <span class="switch-btn-badge">${plCount} VIDEOS</span>
        </button>
      </div>
    `;
  }

  const contentHtml = (currentView === 'playlist') ? renderPlaylistModule() : renderVideoModule();

  return `
    ${dualSwitcherHtml}
    ${contentHtml}
  `;
}

// 1. VIDEO CONSOLE (SMART UNIFIED: VIDEO + AUDIO CONVERTER)
function renderVideoModule() {
  const item = state.currentMedia;
  if (!item) {
    return `
      <div class="deck-standby-state">
        <div class="standby-radar-ring">
          ${icons.video}
        </div>
        <div class="standby-status-label">NO MEDIA LOADED</div>
        <p class="standby-instruction">
          Paste any YouTube video or Shorts link in the box above and click <strong style="color:var(--signal-orange);">FETCH INFO</strong>.
        </p>
        <div class="standby-spec-tags">
          <span>4K / 1080p HD</span>
          <span>MP3 320k AUDIO</span>
          <span>FAST DOWNLOAD</span>
        </div>
      </div>
    `;
  }

  const allActiveTasks = downloadManager.getState().active;
  const activeTask = allActiveTasks.find(t =>
    ((item.id && t.mediaId === item.id) ||
      (item.title && t.title === item.title) ||
      (item.url && t.url === item.url)) &&
    !t.format?.includes('ZIP')
  );
  const activeZipTask = allActiveTasks.find(t =>
    ((item.id && t.mediaId === item.id) ||
      (item.title && (t.title === item.title || t.title?.includes(item.title))) ||
      (item.url && t.url === item.url)) &&
    t.format?.includes('ZIP')
  );

  const isDlActive = activeTask && (activeTask.status === 'downloading' || activeTask.status === 'paused');
  const isZipActive = activeZipTask && (activeZipTask.status === 'downloading' || activeZipTask.status === 'paused');
  const isAnyActive = isDlActive || isZipActive;

  const currentTask = activeZipTask || activeTask;
  const currentProgress = isZipActive ? activeZipTask.progress : (isDlActive ? activeTask.progress : 0);
  const dlProgress = isDlActive ? activeTask.progress : 0;
  const zipProgress = isZipActive ? activeZipTask.progress : 0;

  return `
    <!-- Media Cassette Viewport -->
    <div class="media-cartridge ${isDlActive ? 'downloading' : ''}" id="active-media-cartridge">
      <div class="cartridge-sleeve">
        <img src="${escapeHtml(item.thumbnail)}" class="sleeve-img" alt="${escapeHtml(item.title)}" />
        <div style="position:absolute; bottom:6px; right:6px; background:rgba(0,0,0,0.85); padding:2px 6px; font-family:var(--font-mono); font-size:var(--font-2xs); color:var(--signal-orange); border-radius:3px; font-weight:700; letter-spacing:0.5px;">
          ${escapeHtml(item.duration || '0:00')}
        </div>
      </div>

      <div class="cartridge-meta">
        <span class="tape-index-label">[ MEDIA DETAILS ]</span>
        <h2 class="cartridge-title">${escapeHtml(item.title)}</h2>
        <div class="cartridge-channel-row">
          <img src="${escapeHtml(item.channelAvatar) || 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' fill=\'%23555\'><rect width=\'32\' height=\'32\'/></svg>'}" class="channel-stamp" alt="${escapeHtml(item.channel) || 'Channel'}" />
          <span>${escapeHtml(item.channel) || 'YouTube Video'}</span>
        </div>
        <div class="technical-specs-strip">
          <span>VIEWS: ${escapeHtml(item.views) || 'N/A'}</span>
          <span>•</span>
          <span>DURATION: ${escapeHtml(item.duration) || 'N/A'}</span>
          <span>•</span>
          <span>FORMAT: MP4 / WEBM</span>
        </div>

        <!-- Live In-Front Telemetry Bar for downloading state -->
        <div class="cartridge-live-status-bar ${isAnyActive ? 'active' : ''}" id="cartridge-live-status-bar">
          <div class="cartridge-status-left">
            <span class="status-pulse-dot ${currentTask?.status === 'paused' ? 'pulse-lime' : (isZipActive ? 'pulse-lime' : 'pulse-orange')}" id="cartridge-status-dot"></span>
            <span class="cartridge-status-badge" id="cartridge-status-text">${isZipActive ? `PACKAGING ZIP ${zipProgress}%` : (isDlActive ? `${currentTask?.status === 'paused' ? 'PAUSED' : 'DOWNLOADING'} ${dlProgress}%` : 'READY')}</span>
            <span class="cartridge-status-metrics" id="cartridge-status-metrics">${currentTask?.speed || '0 MB/s'} • ETA: ${currentTask?.eta || '--'}</span>
          </div>
          <div class="cartridge-status-right">
            <span class="cartridge-status-bytes" id="cartridge-status-bytes">${((currentTask?.downloadedBytes || 0) / (1024 * 1024)).toFixed(1)} / ${((currentTask?.totalBytes || 1) / (1024 * 1024)).toFixed(1)} MB</span>
            <button class="tactile-btn mini-status-btn" id="btn-cartridge-cancel" title="Cancel Download">
              ${icons.close}
            </button>
          </div>
        </div>
      </div>

      <!-- Border Bottom Live 0-100% Progress Bar -->
      <div class="cartridge-border-progress ${isAnyActive ? 'active' : ''}" id="cartridge-border-progress">
        <div class="cartridge-border-progress-fill ${isZipActive ? 'zip-mode' : ''}" id="cartridge-border-progress-fill" style="width: ${currentProgress}%;"></div>
      </div>
    </div>

    <!-- Compact Zero-Scroll Download Control Hub -->
    <div class="download-control-hub">
      <div class="hub-selectors-grid">
        <!-- Video Quality Dropdown -->
        <div class="hub-field-card">
          <div class="hub-field-header">
            <span class="hub-field-label">
              <span class="hub-dot"></span> [ 1. SELECT VIDEO RESOLUTION ]
            </span>
            <div class="hub-format-pills">
              <span style="font-family:var(--font-mono); font-size:10px; color:var(--text-dim); margin-right:4px;">FORMAT:</span>
              ${['MP4', 'MKV', 'WEBM'].map(fmt => `
                <button class="tactile-btn mini-fmt-btn ${state.selectedVideoFormat === fmt ? 'active' : ''}" data-fmt="${fmt}">
                  ${fmt}
                </button>
              `).join('')}
            </div>
          </div>
          <div class="tactical-select-wrap">
            <select class="tactical-select" id="select-video-quality">
              ${((item.availableQualities && item.availableQualities.length > 0) ? item.availableQualities : VIDEO_QUALITIES).map(q => `
                <option value="${escapeHtml(q.id)}" ${state.selectedVideoQuality && state.selectedVideoQuality.id === q.id ? 'selected' : ''}>
                  ${escapeHtml(q.label)} (${escapeHtml(q.resolution)} • ${escapeHtml(q.fps)} • ${escapeHtml(q.codec)}) — ~${escapeHtml(q.sizeMb)} MB
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- Audio Track Dropdown -->
        <div class="hub-field-card lime-accent">
          <div class="hub-field-header">
            <span class="hub-field-label">
              <span class="hub-dot lime"></span> [ 2. SELECT AUDIO TRACK QUALITY ]
            </span>
            <span class="hub-badge-note">MERGES INTO VIDEO</span>
          </div>
          <div class="tactical-select-wrap">
            <select class="tactical-select" id="select-mux-audio-quality">
              ${AUDIO_QUALITIES.map(q => `
                <option value="${escapeHtml(q.id)}" ${state.selectedMuxAudio && state.selectedMuxAudio.id === q.id ? 'selected' : ''}>
                  ${escapeHtml(q.label)} (${escapeHtml(q.qualityName || q.desc)} • ${escapeHtml(q.sampleRate)}) — +~${escapeHtml(q.sizeMb)} MB
                </option>
              `).join('')}
            </select>
          </div>
        </div>
      </div>

      <!-- Master Trigger Bar (Zero Scroll) -->
      <div class="hub-action-bar">
        <div class="hub-summary-row">
          <div class="hub-pill-group">
            <span class="summary-chip video-chip">${escapeHtml(state.selectedVideoQuality.label)} • ${state.selectedVideoFormat}</span>
            <span class="chip-plus">+</span>
            <span class="summary-chip audio-chip">${escapeHtml(state.selectedMuxAudio.label)}</span>
            <span class="summary-chip size-chip">EST. ~${(state.selectedVideoQuality.sizeMb + (state.selectedMuxAudio.sizeMb || 12)).toFixed(0)} MB</span>
          </div>
          <div class="hub-subtext">High quality video and audio merged in one fast download</div>
        </div>

        <div class="hub-action-buttons">
          <button class="tactile-btn orange-accent hub-download-btn ${isDlActive ? 'downloading' : ''}" id="btn-primary-video-download">
            <div class="btn-progress-fill" id="btn-download-progress-fill" style="width: ${dlProgress}%;"></div>
            <span class="btn-content-relative" id="btn-download-label">
              ${isDlActive
      ? `${icons.download} <span>${dlProgress}% • ${activeTask?.status === 'paused' ? 'PAUSED' : 'DOWNLOADING...'}</span>`
      : `${icons.download} <span>DOWNLOAD (${state.selectedVideoFormat})</span>`}
            </span>
          </button>
          <button class="tactile-btn hub-download-btn ${isZipActive ? 'downloading' : ''}" id="btn-video-download-zip" style="position:relative; overflow:hidden; color:var(--signal-lime); border-color:rgba(212,255,0,0.35);" title="Download media package as ZIP">
            <div class="btn-progress-fill zip-fill" id="btn-video-zip-fill" style="width: ${zipProgress}%;"></div>
            <span class="btn-content-relative" id="btn-video-zip-label" style="display:inline-flex; align-items:center; gap:7px;">
              ${isZipActive
      ? `${icons.zip} <span>${zipProgress}% • PACKAGING ZIP...</span>`
      : `${icons.zip} <span>DOWNLOAD AS ZIP</span>`}
            </span>
          </button>
        </div>
      </div>
    </div>
  `;
}

// 3. PLAYLIST CRATE
function renderPlaylistModule() {
  const pl = state.playlist;
  if (!pl || !pl.videos || pl.videos.length === 0) {
    return `
      <div class="deck-standby-state">
        <div class="standby-radar-ring">
          ${icons.playlist}
        </div>
        <div class="standby-status-label">NO PLAYLIST LOADED</div>
        <p class="standby-instruction">
          Paste any YouTube playlist link in the box above and click <strong style="color:var(--signal-orange);">FETCH INFO</strong>.
        </p>
        <div class="standby-spec-tags">
          <span>ALL TRACKS</span>
          <span>BATCH DOWNLOAD</span>
          <span>ZIP ARCHIVE</span>
        </div>
      </div>
    `;
  }

  const filteredVideos = pl.videos.filter(v =>
    (v.title && v.title.toLowerCase().includes(state.playlistFilter.toLowerCase())) ||
    (v.artist && v.artist.toLowerCase().includes(state.playlistFilter.toLowerCase()))
  );
  const selectedCount = pl.videos.filter(v => v.selected).length;

  // Pagination for playlists with more than 50 videos
  const totalFiltered = filteredVideos.length;
  const isPaginated = totalFiltered > 50;
  const pageSize = state.playlistPageSize || 50;
  const totalPages = Math.ceil(totalFiltered / pageSize) || 1;

  if (state.playlistPage > totalPages) state.playlistPage = totalPages;
  if (state.playlistPage < 1) state.playlistPage = 1;

  const currentPage = state.playlistPage;
  const startIndex = isPaginated ? (currentPage - 1) * pageSize : 0;
  const endIndex = isPaginated ? Math.min(startIndex + pageSize, totalFiltered) : totalFiltered;
  const visibleVideos = isPaginated ? filteredVideos.slice(startIndex, endIndex) : filteredVideos;

  const activePlZipTask = downloadManager.getState().active.find(t =>
    t.id.startsWith('zip-pl') || (t.format?.includes('ZIP') && t.title?.includes(pl.title))
  );
  const isPlZipActive = activePlZipTask && (activePlZipTask.status === 'downloading' || activePlZipTask.status === 'paused');
  const plZipProgress = isPlZipActive ? activePlZipTask.progress : 0;

  return `
    <!-- Playlist Header -->
    <div class="playlist-rack-header ${isPlZipActive ? 'downloading' : ''}" id="playlist-rack-header">
      <div style="aspect-ratio:16/10; border-radius:6px; overflow:hidden; border:1px solid #000;">
        <img src="${escapeHtml(pl.thumbnail)}" style="width:100%; height:100%; object-fit:cover;" alt="${escapeHtml(pl.title)}" />
      </div>

      <div>
        <span class="tape-index-label">[ PLAYLIST DETAILS ]</span>
        <h3 style="font-size:var(--font-xl); font-weight:700; color:#fff; margin-bottom:6px;">${escapeHtml(pl.title)}</h3>
        <div style="font-family:var(--font-mono); font-size:var(--font-xs); color:var(--text-medium); margin-bottom:8px;">
          CHANNEL: ${escapeHtml(pl.channel) || 'YouTube'}
        </div>
        <div style="font-family:var(--font-mono); font-size:var(--font-xs); color:var(--text-dim); display:flex; flex-wrap:wrap; gap:8px 14px;">
          <span style="white-space:nowrap; color:var(--signal-orange); font-weight:700;">${pl.totalVideos || pl.videos.length} VIDEOS</span>
          <span>•</span>
          <span style="white-space:nowrap;">${escapeHtml(pl.totalDuration) || 'Unknown'} TOTAL DURATION</span>
          <span>•</span>
          <span style="white-space:nowrap; color:var(--signal-lime); font-weight:700;">${selectedCount} SELECTED</span>
        </div>
      </div>

      <div class="playlist-header-actions">
        <button class="tactile-btn orange-accent" id="btn-batch-download" style="width:100%; justify-content:center; padding:10px 16px; font-weight:700;">
          ${icons.download} <span>DOWNLOAD SELECTED (${selectedCount})</span>
        </button>
        <button class="tactile-btn ${isPlZipActive ? 'downloading' : ''}" id="btn-download-zip" style="position:relative; overflow:hidden; width:100%; justify-content:center; padding:10px 16px; font-weight:700; color:var(--signal-lime); border-color:rgba(212,255,0,0.35);">
          <div class="btn-progress-fill zip-fill" id="btn-playlist-zip-fill" style="width: ${plZipProgress}%;"></div>
          <span class="btn-content-relative" id="btn-playlist-zip-label" style="display:inline-flex; align-items:center; gap:8px;">
            ${isPlZipActive
      ? `${icons.zip} <span>${plZipProgress}% • PACKAGING ZIP...</span>`
      : `${icons.zip} <span>DOWNLOAD AS ZIP</span>`}
          </span>
        </button>
      </div>

      <!-- Border bottom live progress bar for playlist ZIP packaging -->
      <div class="playlist-border-progress ${isPlZipActive ? 'active' : ''}" id="playlist-border-progress">
        <div class="playlist-border-progress-fill" id="playlist-border-progress-fill" style="width: ${plZipProgress}%;"></div>
      </div>
    </div>

    <!-- GENERAL QUALITY BAR (MASTER RESOLUTION & BITRATE SELECTOR) -->
    <div class="playlist-master-bar">
      <div class="master-quality-controls">
        <div class="master-quality-field">
          <span class="bay-status-dot" style="background:var(--signal-orange); box-shadow:0 0 6px var(--signal-orange);"></span>
          <label class="master-quality-label" for="playlist-master-video-quality">DEFAULT VIDEO QUALITY:</label>
          <select id="playlist-master-video-quality" class="tactical-select-mini">
            <option value="1080p" ${state.playlistMasterVideo === '1080p' ? 'selected' : ''}>1080p Full HD</option>
            <option value="720p" ${state.playlistMasterVideo === '720p' ? 'selected' : ''}>720p HD</option>
            <option value="480p" ${state.playlistMasterVideo === '480p' ? 'selected' : ''}>480p Standard</option>
            <option value="360p" ${state.playlistMasterVideo === '360p' ? 'selected' : ''}>360p Compact</option>
          </select>
        </div>

        <div class="master-quality-field">
          <span class="bay-status-dot" style="background:var(--signal-lime); box-shadow:0 0 6px var(--signal-lime);"></span>
          <label class="master-quality-label" for="playlist-master-audio-quality">DEFAULT AUDIO QUALITY:</label>
          <select id="playlist-master-audio-quality" class="tactical-select-mini lime-focus">
            <option value="mp3-320" ${state.playlistMasterAudio === 'mp3-320' ? 'selected' : ''}>MP3 320 kbps (Best)</option>
            <option value="mp3-256" ${state.playlistMasterAudio === 'mp3-256' ? 'selected' : ''}>MP3 256 kbps (High)</option>
            <option value="mp3-128" ${state.playlistMasterAudio === 'mp3-128' ? 'selected' : ''}>MP3 128 kbps (Standard)</option>
            <option value="flac-lossless" ${state.playlistMasterAudio === 'flac-lossless' ? 'selected' : ''}>FLAC Lossless</option>
          </select>
        </div>
      </div>

      <div style="font-family:var(--font-mono); font-size:10.5px; color:var(--text-dim); letter-spacing:0.4px;">
        [ GENERAL SETTINGS APPLY TO BATCH DOWNLOADS ]
      </div>
    </div>

    <!-- Controls Bar (Select All / Deselect All / Search Filter) -->
    <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; margin-bottom:14px; background:#12141a; padding:10px 16px; border-radius:6px; border:1px solid #20242e;">
      <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
        <button class="tactile-btn" id="btn-playlist-select-all">SELECT ALL (${pl.videos.length})</button>
        ${isPaginated ? `
          <button class="tactile-btn" id="btn-playlist-select-page">SELECT THIS PAGE (${visibleVideos.length})</button>
        ` : ''}
        <button class="tactile-btn" id="btn-playlist-deselect-all">DESELECT ALL</button>
        <button class="tactile-btn ${isPlZipActive ? 'downloading' : ''}" id="btn-playlist-zip-quick" style="position:relative; overflow:hidden; color:var(--signal-lime); border-color:rgba(212,255,0,0.3); font-weight:600;">
          <div class="btn-progress-fill zip-fill" id="btn-playlist-zip-quick-fill" style="width: ${plZipProgress}%;"></div>
          <span class="btn-content-relative" id="btn-playlist-zip-quick-label" style="display:inline-flex; align-items:center; gap:6px;">
            ${isPlZipActive
      ? `${icons.zip} <span>${plZipProgress}% ZIP</span>`
      : `${icons.zip} <span>DOWNLOAD AS ZIP</span>`}
          </span>
        </button>
        <span style="font-family:var(--font-mono); font-size:var(--font-xs); color:var(--signal-orange); font-weight:700;">
          ${selectedCount} OF ${pl.videos.length} SELECTED
        </span>
        ${isPaginated ? `
          <span style="font-family:var(--font-mono); font-size:11px; color:var(--signal-lime); background:rgba(212,255,0,0.1); border:1px solid rgba(212,255,0,0.3); padding:2px 7px; border-radius:4px; font-weight:700;">
            PAGE ${currentPage} / ${totalPages} (${startIndex + 1}–${endIndex})
          </span>
        ` : ''}
      </div>

      <div style="background:#090b0d; border:1px solid #232733; border-radius:4px; padding:4px 10px; display:flex; align-items:center; gap:6px;">
        ${icons.search}
        <input 
          type="text" 
          id="input-filter-playlist" 
          placeholder="Filter tracks by title or artist..." 
          value="${state.playlistFilter}" 
          style="background:transparent; border:none; outline:none; color:#fff; font-family:var(--font-mono); font-size:var(--font-xs); width:200px;"
        />
      </div>
    </div>

    <!-- Track List with Individual Video & Audio Quality Options -->
    <div class="crate-track-list">
      ${visibleVideos.map((vid, idx) => {
        const vidQual = vid.videoQual || state.playlistMasterVideo;
        const audQual = vid.audioQual || state.playlistMasterAudio;
        return `
          <div class="crate-track-item ${vid.selected ? 'checked' : ''}" data-track-id="${vid.id}">
            <input type="checkbox" class="track-checkbox" data-track-id="${vid.id}" ${vid.selected ? 'checked' : ''} style="accent-color:var(--signal-orange); width:16px; height:16px; cursor:pointer;" />
            
            <img src="${escapeHtml(vid.thumbnail) || 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'32\' fill=\'%23333\'><rect width=\'48\' height=\'32\'/></svg>'}" class="track-minithumb" alt="${escapeHtml(vid.title)}" />
            
            <div style="min-width:0;">
              <div style="font-weight:600; font-size:var(--font-base); color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeHtml(vid.title)}">
                ${escapeHtml(vid.title)}
              </div>
              <div style="font-family:var(--font-mono); font-size:var(--font-2xs); color:var(--text-dim); margin-top:2px;">
                ${escapeHtml(vid.artist) || escapeHtml(pl.channel) || 'Artist'} • ${escapeHtml(vid.duration) || '0:00'}
              </div>
            </div>

            <!-- Per-Track Controls: Video Quality, Audio Quality, and Single Download Button -->
            <div class="track-controls-strip">
              <div class="track-select-wrap">
                <span class="track-select-tag">VIDEO:</span>
                <select class="tactical-select-mini track-video-qual" data-track-id="${vid.id}" title="Select video quality for this track">
                  <option value="1080p" ${vidQual === '1080p' ? 'selected' : ''}>1080p</option>
                  <option value="720p" ${vidQual === '720p' ? 'selected' : ''}>720p</option>
                  <option value="480p" ${vidQual === '480p' ? 'selected' : ''}>480p</option>
                  <option value="360p" ${vidQual === '360p' ? 'selected' : ''}>360p</option>
                </select>
              </div>

              <div class="track-select-wrap">
                <span class="track-select-tag lime">AUDIO:</span>
                <select class="tactical-select-mini lime-focus track-audio-qual" data-track-id="${vid.id}" title="Select audio quality for this track">
                  <option value="mp3-320" ${audQual === 'mp3-320' ? 'selected' : ''}>320k</option>
                  <option value="mp3-256" ${audQual === 'mp3-256' ? 'selected' : ''}>256k</option>
                  <option value="mp3-128" ${audQual === 'mp3-128' ? 'selected' : ''}>128k</option>
                  <option value="flac-lossless" ${audQual === 'flac-lossless' ? 'selected' : ''}>FLAC</option>
                </select>
              </div>

              <button class="tactile-btn orange-accent btn-track-download" data-track-id="${vid.id}" title="Download Track">
                ${icons.download} <span class="track-dl-label">DOWNLOAD</span>
              </button>
            </div>

            <!-- Border bottom live progress bar for track -->
            <div class="crate-track-progress" data-track-progress-id="${vid.id}">
              <div class="crate-track-progress-fill" style="width: 0%;"></div>
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <!-- Pagination Controls (Only shown if playlist > 50 videos) -->
    ${isPaginated ? renderPaginationBar(currentPage, totalPages, startIndex, endIndex, totalFiltered) : ''}
  `;
}

// Tactical Pagination Bar for large playlists (> 50 items)
function renderPaginationBar(currentPage, totalPages, startIndex, endIndex, totalFiltered) {
  let pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  const pageButtonsHtml = pages.map(p => {
    if (p === '...') return `<span class="page-ellipsis">•••</span>`;
    return `<button class="page-number-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
  }).join('');

  return `
    <div class="playlist-pagination-bar">
      <div class="pagination-info">
        <span class="pagination-pill">PAGE ${currentPage} / ${totalPages}</span>
        <span class="pagination-range">SHOWING ${startIndex + 1}–${endIndex} OF ${totalFiltered} VIDEOS (50 PER PAGE)</span>
      </div>

      <div class="pagination-controls">
        <button class="tactile-btn btn-page-nav" id="btn-page-first" data-page="1" ${currentPage <= 1 ? 'disabled' : ''} title="First Page">
          « FIRST
        </button>
        <button class="tactile-btn btn-page-nav" id="btn-page-prev" data-page="${currentPage - 1}" ${currentPage <= 1 ? 'disabled' : ''} title="Previous Page">
          ${icons.chevronLeft} PREV
        </button>

        <div class="pagination-page-numbers">
          ${pageButtonsHtml}
        </div>

        <button class="tactile-btn btn-page-nav" id="btn-page-next" data-page="${currentPage + 1}" ${currentPage >= totalPages ? 'disabled' : ''} title="Next Page">
          NEXT ${icons.chevronRight}
        </button>
        <button class="tactile-btn btn-page-nav" id="btn-page-last" data-page="${totalPages}" ${currentPage >= totalPages ? 'disabled' : ''} title="Last Page">
          LAST »
        </button>
      </div>
    </div>
  `;
}

// 5. DOWNLOADS QUEUE (ADVANCED HARDWARE BUS CONSOLE)
function renderQueueModule() {
  const downloadState = downloadManager.getState();
  const activeTasks = downloadState.active;
  const historyItems = downloadState.history;
  const isIdle = activeTasks.length === 0;

  return `
    <div class="queue-console-chassis">
      <!-- Queue Hardware Telemetry Bay -->
      <div class="queue-telemetry-strip">
        <div class="telemetry-chip">
          <span class="telemetry-label">SYSTEM BUS STATUS</span>
          <div class="telemetry-value-row">
            <span class="status-pulse-dot ${!isIdle ? 'pulse-orange' : 'pulse-lime'}"></span>
            <span class="telemetry-value ${!isIdle ? 'text-orange' : 'text-lime'}">
              ${!isIdle ? 'DOWNLOADING' : 'IDLE / STANDBY'}
            </span>
          </div>
        </div>

        <div class="telemetry-chip">
          <span class="telemetry-label">ACTIVE TRANSFERS</span>
          <div class="telemetry-value-row">
            <span class="telemetry-value">${activeTasks.length}</span>
            <span class="telemetry-sub">JOBS</span>
          </div>
        </div>

        <div class="telemetry-chip">
          <span class="telemetry-label">DOWNLOAD HISTORY</span>
          <div class="telemetry-value-row">
            <span class="telemetry-value text-orange">${historyItems.length}</span>
            <span class="telemetry-sub">FILES</span>
          </div>
        </div>
      </div>

      <!-- Active Downloads Card -->
      <div class="queue-hardware-card">
        <div class="queue-card-header">
          <div class="queue-header-title">
            <span class="tape-index-label">[ ACTIVE DOWNLOADS ]</span>
            <span class="queue-count-badge ${!isIdle ? 'active' : ''}">${activeTasks.length} ACTIVE</span>
          </div>
        </div>

        ${isIdle ? `
          <div class="queue-empty-radar">
            <div class="queue-radar-circle">
              ${icons.download}
            </div>
            <div class="queue-empty-title">QUEUE IS IDLE</div>
            <p class="queue-empty-desc">
              No files are downloading right now. Enter any YouTube video, Shorts, or playlist link above to start downloading.
            </p>
            <button class="tactile-btn orange-accent" id="btn-queue-goto-download">
              ${icons.bolt} <span>START A DOWNLOAD</span>
            </button>
          </div>
        ` : `
          <div class="queue-tasks-rack">
            ${activeTasks.map(task => `
              <div class="queue-task-card">
                <div class="task-card-top">
                  <div class="task-info-block">
                    <span class="task-file-name" title="${escapeHtml(task.filename)}">${escapeHtml(task.filename)}</span>
                    <span class="task-badge-pill">${escapeHtml(task.qualityLabel) || escapeHtml(task.format)}</span>
                  </div>
                  <span class="oled-text">${task.status.toUpperCase()}</span>
                </div>

                <div class="segmented-progress-track">
                  <div class="segmented-progress-fill" style="width:${task.progress}%; background:var(--signal-orange); box-shadow:0 0 10px var(--signal-orange);"></div>
                </div>

                <div class="task-card-footer">
                  <div class="task-metrics">
                    <span>${task.progress}%</span>
                    <span>•</span>
                    <span>${escapeHtml(task.speed) || '0 KB/s'}</span>
                    <span>•</span>
                    <span>ETA: ${escapeHtml(task.eta) || '--'}</span>
                  </div>
                  <div class="task-actions-row">
                    ${task.status === 'paused' ? `
                      <button class="tactile-btn btn-resume-task" data-task-id="${task.id}" title="Resume">
                        ${icons.play} <span>RESUME</span>
                      </button>
                    ` : `
                      <button class="tactile-btn btn-pause-task" data-task-id="${task.id}" title="Pause">
                        ${icons.pause} <span>PAUSE</span>
                      </button>
                    `}
                    <button class="tactile-btn btn-cancel-task" data-task-id="${task.id}" title="Cancel">
                      ${icons.close} <span>CANCEL</span>
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <!-- Download History Card -->
      <div class="queue-hardware-card">
        <div class="queue-card-header">
          <div class="queue-header-title">
            <span class="tape-index-label">[ DOWNLOAD HISTORY ]</span>
            <span class="queue-count-badge lime">${historyItems.length} SAVED</span>
          </div>

          ${historyItems.length > 0 ? `
            <button class="tactile-btn" id="btn-clear-history" style="color:var(--signal-red);">
              ${icons.trash} <span>CLEAR HISTORY</span>
            </button>
          ` : ''}
        </div>

        ${historyItems.length === 0 ? `
          <div class="queue-history-empty">
            <span class="history-empty-icon">${icons.checkCircle}</span>
            <span class="history-empty-text">Download history is empty. Your completed downloads will appear here.</span>
          </div>
        ` : `
          <div class="history-list-wrapper">
            ${historyItems.map(item => `
              <div class="history-track-row">
                <span style="color:var(--signal-lime); display:flex;">${icons.checkCircle}</span>
                <span style="font-family:var(--font-mono); font-size:var(--font-sm); font-weight:600; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                  ${escapeHtml(item.filename) || escapeHtml(item.title)}
                </span>
                <span style="font-family:var(--font-mono); font-size:var(--font-2xs); color:var(--text-dim); text-align:center; white-space:nowrap;">${escapeHtml(item.qualityLabel) || escapeHtml(item.format)}</span>
                <span class="history-size" style="font-family:var(--font-mono); font-size:var(--font-xs); color:var(--signal-orange); text-align:right; white-space:nowrap;">${escapeHtml(item.size)}</span>
                <span class="history-date" style="font-family:var(--font-mono); font-size:var(--font-2xs); color:var(--text-dim); text-align:right; white-space:nowrap;">${escapeHtml(item.date)}</span>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </div>
  `;
}

// Drawer items rendering (Active Queue or Download History)
function renderDrawerItems() {
  const downloadState = downloadManager.getState();
  const activeTasks = downloadState.active;
  const historyItems = downloadState.history || [];

  // 1. History Tab View
  if (state.drawerTab === 'history') {
    if (historyItems.length === 0) {
      return `
        <div class="queue-drawer-empty">
          <span class="drawer-empty-icon" style="color:var(--signal-lime);">${icons.history}</span>
          <span class="drawer-empty-title">NO DOWNLOAD HISTORY</span>
          <span class="drawer-empty-sub">Your completed video and ZIP packages will appear here</span>
        </div>
      `;
    }

    return `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:2px 4px 10px 4px; border-bottom:1px solid #1c212c; margin-bottom:6px;">
        <span style="font-family:var(--font-mono); font-size:11px; font-weight:700; color:var(--text-dim); text-transform:uppercase; letter-spacing:0.5px;">
          ${historyItems.length} COMPLETED ${historyItems.length === 1 ? 'PACKAGE' : 'PACKAGES'}
        </span>
        <button class="tactile-btn" id="btn-drawer-clear-history" style="font-size:10px; padding:3px 8px; color:#ff4455; display:flex; align-items:center; gap:4px; border:1px solid rgba(255,68,85,0.25);" title="Clear all history">
          ${icons.close} <span>CLEAR ALL</span>
        </button>
      </div>
      <div style="display:flex; flex-direction:column; gap:8px;">
        ${historyItems.map(item => `
          <div class="history-drawer-card" data-history-id="${item.id}">
            ${item.thumbnail ? `
              <img src="${escapeHtml(item.thumbnail)}" alt="" class="history-drawer-thumb" loading="lazy" onerror="this.style.display='none'" />
            ` : `
              <div class="history-drawer-thumb" style="display:flex; align-items:center; justify-content:center; color:var(--text-dim);">
                ${item.format?.includes('ZIP') ? icons.zip : (item.format?.includes('MP3') || item.format?.includes('AUDIO') ? icons.music : icons.video)}
              </div>
            `}
            <div class="history-card-info">
              <div class="history-card-title" title="${escapeHtml(item.filename) || escapeHtml(item.title) || 'Downloaded Item'}">
                ${escapeHtml(item.title) || escapeHtml(item.filename) || 'Downloaded Item'}
              </div>
              <div class="history-card-meta">
                <span class="history-card-badge ${item.format?.includes('ZIP') ? 'lime' : 'orange'}">
                  ${escapeHtml(item.qualityLabel) || escapeHtml(item.format) || 'HD'}
                </span>
                <span class="history-card-size">${escapeHtml(item.size) || ''}</span>
                <span class="history-card-date">• ${escapeHtml(item.date) || ''}</span>
              </div>
            </div>
            <div class="history-card-actions">
              ${item.url ? `
                <button class="tactile-btn btn-reanalyze-history" data-url="${escapeHtml(item.url)}" title="Analyze / Download Again" style="padding:6px; color:var(--signal-orange);">
                  ${icons.bolt}
                </button>
              ` : ''}
              <button class="tactile-btn btn-delete-history-item" data-history-id="${item.id}" title="Remove from history" style="padding:6px; color:var(--text-dim);">
                ${icons.close}
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // 2. Active Queue Tab View
  if (activeTasks.length === 0) {
    return `
      <div class="queue-drawer-empty">
        <span class="drawer-empty-icon">${icons.download}</span>
        <span class="drawer-empty-title">QUEUE IS IDLE</span>
        <span class="drawer-empty-sub">No files currently downloading</span>
        ${historyItems.length > 0 ? `
          <button class="tactile-btn" id="btn-switch-to-history" style="margin-top:12px; font-size:11px; padding:6px 12px; color:var(--signal-lime); border:1px solid rgba(212, 255, 0, 0.3); display:inline-flex; align-items:center; gap:6px;">
            ${icons.history} <span>VIEW HISTORY (${historyItems.length})</span>
          </button>
        ` : ''}
      </div>
    `;
  }

  return activeTasks.map(task => `
    <div style="background:#0c0e12; border:1px solid #232733; border-radius:6px; padding:12px;">
      <div style="font-family:var(--font-mono); font-size:var(--font-xs); font-weight:700; color:#fff; margin-bottom:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
        ${escapeHtml(task.filename)}
      </div>
      <div class="segmented-progress-track" style="margin-bottom:6px;">
        <div class="segmented-progress-fill" style="width:${task.progress}%; background:var(--signal-orange);"></div>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; font-family:var(--font-mono); font-size:var(--font-2xs); color:var(--text-dim);">
        <span>${task.progress}% // ${escapeHtml(task.speed)}</span>
        <div style="display:flex; gap:4px;">
          ${task.status === 'paused' ? `
            <button class="tactile-btn btn-resume-task" data-task-id="${task.id}" title="Resume">${icons.play}</button>
          ` : `
            <button class="tactile-btn btn-pause-task" data-task-id="${task.id}" title="Pause">${icons.pause}</button>
          `}
          <button class="tactile-btn btn-cancel-task" data-task-id="${task.id}" title="Cancel">${icons.close}</button>
        </div>
      </div>
    </div>
  `).join('');
}

// Event Listeners
// Update Drawer Tabs Header Display
function updateDrawerTabs() {
  const queueTabBtn = document.getElementById('drawer-tab-queue');
  const historyTabBtn = document.getElementById('drawer-tab-history');
  if (state.drawerTab === 'history') {
    queueTabBtn?.classList.remove('active');
    historyTabBtn?.classList.add('active');
  } else {
    queueTabBtn?.classList.add('active');
    historyTabBtn?.classList.remove('active');
  }
  const dlState = downloadManager.getState();
  const queueBadge = document.getElementById('drawer-queue-count');
  const histBadge = document.getElementById('drawer-history-count');
  if (queueBadge) queueBadge.textContent = dlState.activeCount;
  if (histBadge) histBadge.textContent = dlState.history ? dlState.history.length : 0;
}

// Queue Drawer Controls (In-place sliding without DOM destruction)
function openQueueDrawer(defaultTab = 'queue') {
  hardwareAudio.play('solenoid');
  state.drawerTab = defaultTab;
  state.isDrawerOpen = true;
  document.getElementById('queue-drawer')?.classList.add('open');
  document.getElementById('drawer-backdrop')?.classList.add('open');
  updateDrawerTabs();
  const drawerItems = document.getElementById('drawer-queue-items');
  if (drawerItems) {
    drawerItems.innerHTML = renderDrawerItems();
    attachQueueHandlers();
  }
}

function closeQueueDrawer() {
  hardwareAudio.play('click');
  state.isDrawerOpen = false;
  document.getElementById('queue-drawer')?.classList.remove('open');
  document.getElementById('drawer-backdrop')?.classList.remove('open');
}

// In-Place Playlist Batch UI Counter Update (Zero Lag)
function updatePlaylistBatchUI() {
  if (!state.playlist || !state.playlist.videos) return;
  const selected = state.playlist.videos.filter(v => v.selected);
  const batchBtn = document.getElementById('btn-batch-download');
  if (batchBtn) {
    batchBtn.innerHTML = `${icons.download} <span>DOWNLOAD SELECTED (${selected.length})</span>`;
  }
  const countBadge = document.querySelector('.rack-header-badge');
  if (countBadge) {
    countBadge.textContent = `${selected.length}/${state.playlist.videos.length} SELECTED`;
  }
}

// Targeted Viewport Re-render (High-Speed Local Update - 100x Faster than Full Page Destruction)
function renderModuleViewport() {
  const viewport = document.getElementById('module-viewport');
  if (viewport) {
    viewport.innerHTML = renderActiveModule();
    attachModuleHandlers();
  } else {
    renderApp();
  }
}

// Event Handlers for Interactive Module Viewport
function attachModuleHandlers() {
  // Dual Switcher (Single Video vs Playlist)
  document.getElementById('btn-show-video-view')?.addEventListener('click', () => {
    hardwareAudio.play('switch');
    state.activeMediaView = 'video';
    renderModuleViewport();
  });

  document.getElementById('btn-show-playlist-view')?.addEventListener('click', () => {
    hardwareAudio.play('switch');
    state.activeMediaView = 'playlist';
    renderModuleViewport();
  });

  // Video Quality Dropdown Change
  document.getElementById('select-video-quality')?.addEventListener('change', e => {
    const id = e.target.value;
    const list = state.currentMedia?.availableQualities || VIDEO_QUALITIES;
    const found = list.find(q => q.id === id) || VIDEO_QUALITIES.find(q => q.id === id);
    if (found) {
      hardwareAudio.play('click');
      state.selectedVideoQuality = found;
      renderModuleViewport();
    }
  });

  // Mux Audio Track Selection Dropdown Change
  document.getElementById('select-mux-audio-quality')?.addEventListener('change', e => {
    const id = e.target.value;
    const found = AUDIO_QUALITIES.find(q => q.id === id);
    if (found) {
      hardwareAudio.play('click');
      state.selectedMuxAudio = found;
      renderModuleViewport();
    }
  });

  // Audio-Only Quality Dropdown Change
  document.getElementById('select-audio-only-quality')?.addEventListener('change', e => {
    const id = e.target.value;
    const found = AUDIO_QUALITIES.find(q => q.id === id);
    if (found) {
      hardwareAudio.play('click');
      state.selectedAudioQuality = found;
      renderModuleViewport();
    }
  });

  // Primary Single Video Download Button
  document.getElementById('btn-primary-video-download')?.addEventListener('click', () => {
    if (!state.currentMedia) {
      showToast('Please load a video first', 'alert');
      return;
    }
    hardwareAudio.play('solenoid');
    downloadManager.startDownload(state.currentMedia, state.selectedVideoQuality, 'video', state.selectedMuxAudio);
    showToast(`Downloading: ${state.currentMedia.title} [${state.selectedVideoQuality.badge} + ${state.selectedMuxAudio.label}]`, 'info');
  });

  // Cancel Button directly on the Video Card
  document.getElementById('btn-cartridge-cancel')?.addEventListener('click', (e) => {
    e.stopPropagation();
    hardwareAudio.play('click');
    const dlState = downloadManager.getState();
    const activeTask = dlState.active.find(t =>
      (state.currentMedia?.id && t.mediaId === state.currentMedia.id) ||
      (state.currentMedia?.title && t.title === state.currentMedia.title)
    );
    if (activeTask) {
      downloadManager.cancelDownload(activeTask.id);
      showToast(`Canceled download: ${activeTask.filename}`, 'alert');
    }
  });

  // Single Media Download as ZIP
  document.getElementById('btn-video-download-zip')?.addEventListener('click', async () => {
    if (!state.currentMedia) {
      showToast('Please load a video first', 'alert');
      return;
    }
    hardwareAudio.play('solenoid');
    showToast(`Packaging ${state.currentMedia.title} into ZIP...`, 'info');

    const cartridge = document.getElementById('active-media-cartridge');
    const borderProgress = document.getElementById('cartridge-border-progress');
    const borderFill = document.getElementById('cartridge-border-progress-fill');
    const statusBar = document.getElementById('cartridge-live-status-bar');
    const statusText = document.getElementById('cartridge-status-text');
    const statusMetrics = document.getElementById('cartridge-status-metrics');
    const btnZip = document.getElementById('btn-video-download-zip');
    const btnZipFill = document.getElementById('btn-video-zip-fill');
    const btnZipLabel = document.getElementById('btn-video-zip-label');

    cartridge?.classList.add('downloading');
    if (borderProgress && borderFill) {
      borderProgress.classList.add('active');
      borderFill.classList.remove('completed');
      borderFill.style.width = '5%';
    }
    if (statusBar && statusText) {
      statusBar.classList.add('active');
      statusText.classList.remove('completed');
      statusText.textContent = 'PACKAGING ZIP 5%';
      if (statusMetrics) statusMetrics.textContent = 'Extracting stream...';
    }
    if (btnZip) {
      btnZip.classList.add('downloading');
      if (btnZipFill) btnZipFill.style.width = '5%';
      if (btnZipLabel) btnZipLabel.innerHTML = `${icons.zip} <span>5% • PACKAGING ZIP...</span>`;
    }

    try {
      await downloadManager.startSingleMediaZipDownload(
        state.currentMedia,
        state.selectedVideoQuality,
        state.selectedMuxAudio,
        state.selectedVideoFormat,
        (percent, statusMsg) => {
          if (borderFill) borderFill.style.width = percent + '%';
          if (statusText) statusText.textContent = `PACKAGING ZIP ${percent}%`;
          if (statusMetrics) statusMetrics.textContent = statusMsg || '';
          if (btnZipFill) btnZipFill.style.width = percent + '%';
          if (btnZipLabel) btnZipLabel.innerHTML = `${icons.zip} <span>${percent}% • PACKAGING ZIP...</span>`;
        }
      );
      if (borderFill) {
        borderFill.classList.add('completed');
        borderFill.style.width = '100%';
      }
      if (statusText) {
        statusText.classList.add('completed');
        statusText.textContent = '✔ ZIP PACKAGE READY (100%)';
      }
      if (btnZip) {
        btnZip.classList.remove('downloading');
        btnZip.classList.add('completed');
        if (btnZipFill) btnZipFill.style.width = '100%';
        if (btnZipLabel) btnZipLabel.innerHTML = `${icons.checkCircle} <span>100% • ZIP READY</span>`;
      }
      showToast(`ZIP package downloaded!`, 'success');
      setTimeout(() => {
        cartridge?.classList.remove('downloading');
        borderProgress?.classList.remove('active');
        statusBar?.classList.remove('active');
        statusText?.classList.remove('completed');
        btnZip?.classList.remove('completed');
        if (btnZipLabel) btnZipLabel.innerHTML = `${icons.zip} <span>DOWNLOAD AS ZIP</span>`;
      }, 5000);
    } catch (err) {
      console.error('Single ZIP error:', err);
      showToast(err.message || 'Failed to create ZIP package', 'error');
      cartridge?.classList.remove('downloading');
      borderProgress?.classList.remove('active');
      statusBar?.classList.remove('active');
      btnZip?.classList.remove('downloading');
      if (btnZipLabel) btnZipLabel.innerHTML = `${icons.zip} <span>DOWNLOAD AS ZIP</span>`;
    }
  });

  // Video Container Formats
  document.querySelectorAll('button[data-fmt]').forEach(btn => {
    btn.addEventListener('click', () => {
      hardwareAudio.play('switch');
      state.selectedVideoFormat = btn.dataset.fmt;
      renderModuleViewport();
    });
  });

  // Playlist Batch Selection Controls
  document.getElementById('btn-playlist-select-all')?.addEventListener('click', () => {
    if (!state.playlist || !state.playlist.videos) return;
    hardwareAudio.play('click');
    state.playlist.videos.forEach(v => v.selected = true);
    renderModuleViewport();
  });

  document.getElementById('btn-playlist-select-page')?.addEventListener('click', () => {
    if (!state.playlist || !state.playlist.videos) return;
    hardwareAudio.play('click');
    const filtered = state.playlist.videos.filter(v =>
      (v.title && v.title.toLowerCase().includes(state.playlistFilter.toLowerCase())) ||
      (v.artist && v.artist.toLowerCase().includes(state.playlistFilter.toLowerCase()))
    );
    const start = (state.playlistPage - 1) * (state.playlistPageSize || 50);
    const end = Math.min(start + (state.playlistPageSize || 50), filtered.length);
    const pageVideos = filtered.slice(start, end);
    pageVideos.forEach(v => { v.selected = true; });
    renderModuleViewport();
  });

  document.getElementById('btn-playlist-deselect-all')?.addEventListener('click', () => {
    if (!state.playlist || !state.playlist.videos) return;
    hardwareAudio.play('click');
    state.playlist.videos.forEach(v => v.selected = false);
    renderModuleViewport();
  });

  // Instant Checkbox Toggle (Zero Lag - No DOM Recreation)
  document.querySelectorAll('.track-checkbox').forEach(chk => {
    chk.addEventListener('change', e => {
      if (!state.playlist || !state.playlist.videos) return;
      const trackId = chk.dataset.trackId;
      const vid = state.playlist.videos.find(v => v.id === trackId);
      if (vid) {
        vid.selected = e.target.checked;
        hardwareAudio.play('click');
        const row = chk.closest('.crate-track-item');
        if (row) {
          if (vid.selected) row.classList.add('selected');
          else row.classList.remove('selected');
        }
        updatePlaylistBatchUI();
      }
    });
  });

  // Playlist search filter
  document.getElementById('input-filter-playlist')?.addEventListener('input', e => {
    state.playlistFilter = e.target.value;
    state.playlistPage = 1;
    renderModuleViewport();
    const filterInput = document.getElementById('input-filter-playlist');
    if (filterInput) {
      filterInput.focus();
      filterInput.setSelectionRange(filterInput.value.length, filterInput.value.length);
    }
  });

  // Pagination Navigation Event Listeners
  document.querySelectorAll('.btn-page-nav').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const targetPage = parseInt(btn.dataset.page);
      if (targetPage && targetPage !== state.playlistPage) {
        hardwareAudio.play('switch');
        state.playlistPage = targetPage;
        renderModuleViewport();
        document.querySelector('.crate-track-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  document.querySelectorAll('.page-number-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const targetPage = parseInt(btn.dataset.page);
      if (targetPage && targetPage !== state.playlistPage) {
        hardwareAudio.play('switch');
        state.playlistPage = targetPage;
        renderModuleViewport();
        document.querySelector('.crate-track-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Master Playlist Quality Controls
  document.getElementById('playlist-master-video-quality')?.addEventListener('change', e => {
    hardwareAudio.play('click');
    state.playlistMasterVideo = e.target.value;
    if (state.playlist && state.playlist.videos) {
      state.playlist.videos.forEach(v => { v.videoQual = e.target.value; });
    }
    showToast(`Default video quality set to ${e.target.value} for all tracks`, 'info');
    renderModuleViewport();
  });

  document.getElementById('playlist-master-audio-quality')?.addEventListener('change', e => {
    hardwareAudio.play('click');
    state.playlistMasterAudio = e.target.value;
    if (state.playlist && state.playlist.videos) {
      state.playlist.videos.forEach(v => { v.audioQual = e.target.value; });
    }
    const label = AUDIO_QUALITIES.find(q => q.id === e.target.value)?.label || e.target.value;
    showToast(`Default audio quality set to ${label} for all tracks`, 'info');
    renderModuleViewport();
  });

  // Batch Download Selected Tracks (Video + Audio merged)
  document.getElementById('btn-batch-download')?.addEventListener('click', () => {
    if (!state.playlist || !state.playlist.videos) {
      showToast('Please load a playlist first', 'alert');
      return;
    }
    const selected = state.playlist.videos.filter(v => v.selected);
    if (selected.length === 0) {
      showToast('Please select at least one video in the playlist', 'error');
      return;
    }
    hardwareAudio.play('solenoid');
    selected.forEach((track, i) => {
      setTimeout(() => {
        const vidQualId = track.videoQual || state.playlistMasterVideo;
        const audQualId = track.audioQual || state.playlistMasterAudio;
        const vidQualObj = VIDEO_QUALITIES.find(q => q.id === vidQualId) || VIDEO_QUALITIES[3];
        const audQualObj = AUDIO_QUALITIES.find(q => q.id === audQualId) || AUDIO_QUALITIES[0];
        downloadManager.startDownload(track, vidQualObj, 'video', audQualObj);
      }, i * 200);
    });
    showToast(`Queued ${selected.length} tracks for download!`, 'success');
    openQueueDrawer('queue');
  });

  // Playlist Download as ZIP
  const handlePlaylistZipDownload = async () => {
    if (!state.playlist || !state.playlist.videos) {
      showToast('Please load a playlist first', 'alert');
      return;
    }
    const selected = state.playlist.videos.filter(v => v.selected);
    if (selected.length === 0) {
      showToast('Please select at least one track to package into ZIP', 'error');
      return;
    }

    hardwareAudio.play('solenoid');
    showToast(`Preparing ZIP package for ${selected.length} tracks...`, 'info');

    const rackHeader = document.getElementById('playlist-rack-header');
    const plBorderProgress = document.getElementById('playlist-border-progress');
    const plBorderFill = document.getElementById('playlist-border-progress-fill');
    const btnZipMain = document.getElementById('btn-download-zip');
    const btnZipMainFill = document.getElementById('btn-playlist-zip-fill');
    const btnZipMainLabel = document.getElementById('btn-playlist-zip-label');
    const btnZipQuick = document.getElementById('btn-playlist-zip-quick');
    const btnZipQuickFill = document.getElementById('btn-playlist-zip-quick-fill');
    const btnZipQuickLabel = document.getElementById('btn-playlist-zip-quick-label');

    // Activate visual progress rails
    rackHeader?.classList.add('downloading');
    plBorderProgress?.classList.add('active');
    btnZipMain?.classList.add('downloading');
    btnZipQuick?.classList.add('downloading');

    try {
      await downloadManager.startPlaylistZipDownload(
        state.playlist,
        selected,
        {
          format: 'video',
          quality: state.playlistMasterVideo || '1080p'
        },
        progress => {
          const pct = progress.percent || 0;
          if (plBorderFill) plBorderFill.style.width = pct + '%';
          if (btnZipMainFill) btnZipMainFill.style.width = pct + '%';
          if (btnZipQuickFill) btnZipQuickFill.style.width = pct + '%';
          if (btnZipMainLabel) {
            btnZipMainLabel.innerHTML = `${icons.zip} <span>${pct}% • PACKAGING ZIP...</span>`;
          }
          if (btnZipQuickLabel) {
            btnZipQuickLabel.innerHTML = `${icons.zip} <span>${pct}% ZIP</span>`;
          }

          // Highlight current track being packaged in playlist
          if (progress.trackId) {
            const trackItem = document.querySelector(`.crate-track-item[data-track-id="${progress.trackId}"]`);
            if (trackItem) {
              const trackProg = trackItem.querySelector('.crate-track-progress');
              const trackProgFill = trackItem.querySelector('.crate-track-progress-fill');
              if (trackProg && trackProgFill) {
                trackProg.classList.add('active');
                trackProgFill.style.width = '100%';
              }
            }
          }
        }
      );

      // Complete state
      if (plBorderFill) plBorderFill.style.width = '100%';
      if (btnZipMain) {
        btnZipMain.classList.remove('downloading');
        btnZipMain.classList.add('completed');
        if (btnZipMainLabel) btnZipMainLabel.innerHTML = `${icons.checkCircle} <span>100% • ZIP READY</span>`;
      }
      if (btnZipQuick) {
        btnZipQuick.classList.remove('downloading');
        btnZipQuick.classList.add('completed');
        if (btnZipQuickLabel) btnZipQuickLabel.innerHTML = `${icons.checkCircle} <span>100% READY</span>`;
      }
      showToast(`ZIP package downloaded successfully!`, 'success');

      setTimeout(() => {
        rackHeader?.classList.remove('downloading');
        plBorderProgress?.classList.remove('active');
        btnZipMain?.classList.remove('completed');
        btnZipQuick?.classList.remove('completed');
        if (btnZipMainLabel) btnZipMainLabel.innerHTML = `${icons.zip} <span>DOWNLOAD AS ZIP</span>`;
        if (btnZipQuickLabel) btnZipQuickLabel.innerHTML = `${icons.zip} <span>DOWNLOAD AS ZIP</span>`;
        document.querySelectorAll('.crate-track-progress').forEach(p => p.classList.remove('active'));
      }, 5000);
    } catch (err) {
      console.error('Playlist ZIP error:', err);
      showToast(err.message || 'Failed to create playlist ZIP archive', 'error');
      rackHeader?.classList.remove('downloading');
      plBorderProgress?.classList.remove('active');
      btnZipMain?.classList.remove('downloading');
      btnZipQuick?.classList.remove('downloading');
    }
  };

  document.getElementById('btn-download-zip')?.addEventListener('click', handlePlaylistZipDownload);
  document.getElementById('btn-playlist-zip-quick')?.addEventListener('click', handlePlaylistZipDownload);

  // Per-Track Video Quality Selector
  document.querySelectorAll('.track-video-qual').forEach(sel => {
    sel.addEventListener('change', e => {
      e.stopPropagation();
      const track = state.playlist?.videos?.find(v => v.id === sel.dataset.trackId);
      if (track) {
        track.videoQual = e.target.value;
        hardwareAudio.play('click');
      }
    });
  });

  // Per-Track Audio Quality Selector
  document.querySelectorAll('.track-audio-qual').forEach(sel => {
    sel.addEventListener('change', e => {
      e.stopPropagation();
      const track = state.playlist?.videos?.find(v => v.id === sel.dataset.trackId);
      if (track) {
        track.audioQual = e.target.value;
        hardwareAudio.play('click');
      }
    });
  });

  // Individual Track Download Button (Single button, video + audio merged)
  document.querySelectorAll('.btn-track-download').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const track = state.playlist?.videos?.find(v => v.id === btn.dataset.trackId);
      if (track) {
        hardwareAudio.play('solenoid');
        const vidQualId = track.videoQual || state.playlistMasterVideo;
        const audQualId = track.audioQual || state.playlistMasterAudio;
        const vidQualObj = VIDEO_QUALITIES.find(q => q.id === vidQualId) || VIDEO_QUALITIES[3];
        const audQualObj = AUDIO_QUALITIES.find(q => q.id === audQualId) || AUDIO_QUALITIES[0];
        downloadManager.startDownload(track, vidQualObj, 'video', audQualObj);
        showToast(`Started download: ${track.title} [${vidQualObj.badge} + ${audQualObj.badge}]`, 'success');
        openQueueDrawer('queue');
      }
    });
  });

  attachQueueHandlers();
}

// Global Shell Event Listeners
function attachEventHandlers() {
  document.getElementById('btn-open-queue')?.addEventListener('click', () => openQueueDrawer('queue'));
  document.getElementById('btn-close-drawer')?.addEventListener('click', closeQueueDrawer);
  document.getElementById('drawer-backdrop')?.addEventListener('click', closeQueueDrawer);

  // Helper to scroll to downloader smoothly without getting cut off under sticky header
  function scrollToDownloader(focusInput = true) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (focusInput) {
      setTimeout(() => {
        const input = document.getElementById('main-url-input');
        const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        if (!isTouch) {
          input?.focus({ preventScroll: true });
        }
      }, 250);
    }
  }

  // Route back to the tool page if we are currently on a content route (e.g. blog)
  function ensureToolRoute() {
    if (state.route !== '/') {
      location.hash = '';
      applyRoute();
    }
  }

  // Top Nav Brand Click — return to the downloader tool
  document.getElementById('nav-brand-top')?.addEventListener('click', () => {
    hardwareAudio.play('switch');
    ensureToolRoute();
    scrollToDownloader(true);
  });

  // Content-route navigation (#/blog, #/privacy, ...) — handled by the hash router
  document.querySelectorAll('[data-route]').forEach(el => {
    el.addEventListener('click', e => {
      const route = el.dataset.route;
      if (!route) return;
      e.preventDefault();
      hardwareAudio.play('switch');
      location.hash = '#/' + route;
      applyRoute();
    });
  });

  // Smooth scroll for nav anchor links and footer links (skip content routes)
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;
      if (targetId.startsWith('#/')) return; // let the hash router handle it
      e.preventDefault();
      const elem = document.querySelector(targetId);
      if (elem) {
        hardwareAudio.play('switch');
        elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Top Nav Action buttons (DOWNLOADER, SHORTS, MP3 AUDIO, PLAYLISTS & ZIP)
  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      hardwareAudio.play('switch');

      // If on a content route (blog/privacy/etc.), first route back to the tool page
      if (action !== 'nav-history') ensureToolRoute();

      if (action === 'focus-downloader') {
        scrollToDownloader(true);
      } else if (action === 'nav-shorts') {
        scrollToDownloader(true);
        showToast('Paste any YouTube Shorts link to download in vertical 9:16 format', 'info');
      } else if (action === 'nav-audio') {
        scrollToDownloader(true);
        showToast('Paste any YouTube link to extract 320 kbps MP3 or FLAC audio', 'info');
      } else if (action === 'nav-playlist') {
        if (state.playlist && state.playlist.videos) {
          state.activeMediaView = 'playlist';
          renderModuleViewport();
          scrollToDownloader(false);
        } else {
          scrollToDownloader(true);
          showToast('Paste any YouTube playlist link to view with 50-track pagination & ZIP packaging', 'info');
        }
      } else if (action === 'nav-history') {
        openQueueDrawer('history');
      }
    });
  });

  // Quick Queue & History Drawer Triggers (Header & Chassis)
  document.querySelectorAll('.btn-open-queue-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openQueueDrawer('queue');
    });
  });

  document.querySelectorAll('.btn-open-history-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openQueueDrawer('history');
    });
  });

  // Mobile Navigation Drawer Toggle & Close Handlers
  const mobileNavToggleBtn = document.getElementById('btn-mobile-nav-toggle');
  const mobileNavDrawer = document.getElementById('mobile-nav-drawer');
  const mobileNavBackdrop = document.getElementById('mobile-nav-backdrop');
  const mobileNavCloseBtn = document.getElementById('btn-close-mobile-nav');

  function openMobileNav() {
    hardwareAudio.play('switch');
    mobileNavDrawer?.classList.add('open');
    mobileNavBackdrop?.classList.add('open');
    const barsIcon = mobileNavToggleBtn?.querySelector('.mobile-toggle-icon-bars');
    const closeIcon = mobileNavToggleBtn?.querySelector('.mobile-toggle-icon-close');
    if (barsIcon) barsIcon.style.display = 'none';
    if (closeIcon) closeIcon.style.display = 'block';
  }

  function closeMobileNav() {
    mobileNavDrawer?.classList.remove('open');
    mobileNavBackdrop?.classList.remove('open');
    const barsIcon = mobileNavToggleBtn?.querySelector('.mobile-toggle-icon-bars');
    const closeIcon = mobileNavToggleBtn?.querySelector('.mobile-toggle-icon-close');
    if (barsIcon) barsIcon.style.display = 'block';
    if (closeIcon) closeIcon.style.display = 'none';
  }

  mobileNavToggleBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (mobileNavDrawer?.classList.contains('open')) {
      closeMobileNav();
    } else {
      openMobileNav();
    }
  });

  mobileNavCloseBtn?.addEventListener('click', () => {
    hardwareAudio.play('click');
    closeMobileNav();
  });

  mobileNavBackdrop?.addEventListener('click', () => {
    closeMobileNav();
  });

  document.querySelectorAll('.mobile-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      closeMobileNav();
    });
  });

  // FAQ Accordion click toggles
  document.querySelectorAll('.faq-item').forEach(item => {
    item.querySelector('.faq-question-btn')?.addEventListener('click', () => {
      hardwareAudio.play('click');
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!wasOpen) {
        item.classList.add('open');
      }
    });
  });

  // Module Tabs
  document.querySelectorAll('.module-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mod = btn.dataset.mod;
      if (mod && mod !== state.activeModule) {
        hardwareAudio.play('switch');
        state.activeModule = mod;
        renderModuleViewport();
      }
    });
  });

  // URL Input & Engage
  const urlInput = document.getElementById('main-url-input');
  urlInput?.addEventListener('input', e => {
    state.urlInput = e.target.value;
    const clearBtn = document.getElementById('btn-clear-url');
    if (clearBtn) {
      clearBtn.style.display = e.target.value ? 'flex' : 'none';
    }
  });

  document.getElementById('btn-clear-url')?.addEventListener('click', (e) => {
    e.stopPropagation();
    hardwareAudio.play('click');
    state.urlInput = '';
    const input = document.getElementById('main-url-input');
    if (input) {
      input.value = '';
      input.focus();
    }
    const clearBtn = document.getElementById('btn-clear-url');
    if (clearBtn) clearBtn.style.display = 'none';
  });

  urlInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      triggerAnalysis();
    } else if (e.key === 'Escape') {
      hardwareAudio.play('click');
      state.urlInput = '';
      if (urlInput) urlInput.value = '';
      const clearBtn = document.getElementById('btn-clear-url');
      if (clearBtn) clearBtn.style.display = 'none';
    }
  });

  document.getElementById('btn-analyze-stream')?.addEventListener('click', triggerAnalysis);

  // Paste from clipboard
  document.getElementById('btn-paste-clipboard')?.addEventListener('click', async () => {
    hardwareAudio.play('click');
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        state.urlInput = text;
        const inputElem = document.getElementById('main-url-input');
        if (inputElem) inputElem.value = text;
        const clearBtn = document.getElementById('btn-clear-url');
        if (clearBtn) clearBtn.style.display = 'flex';
        showToast('Link pasted from clipboard', 'info');
        triggerAnalysis();
      }
    } catch {
      showToast('Clipboard access unavailable', 'alert');
    }
  });

  attachModuleHandlers();
  pushAdSlots();
}

// Dedicated Queue & History Controls Event Handlers
function attachQueueHandlers() {
  const updateDrawerTabDisplay = () => {
    const queueTabBtn = document.getElementById('drawer-tab-queue');
    const historyTabBtn = document.getElementById('drawer-tab-history');
    if (state.drawerTab === 'history') {
      queueTabBtn?.classList.remove('active');
      historyTabBtn?.classList.add('active');
    } else {
      queueTabBtn?.classList.add('active');
      historyTabBtn?.classList.remove('active');
    }

    const dlState = downloadManager.getState();
    const queueBadge = document.getElementById('drawer-queue-count');
    const histBadge = document.getElementById('drawer-history-count');
    if (queueBadge) queueBadge.textContent = dlState.activeCount;
    if (histBadge) histBadge.textContent = dlState.history ? dlState.history.length : 0;

    const drawerItems = document.getElementById('drawer-queue-items');
    if (drawerItems) {
      drawerItems.innerHTML = renderDrawerItems();
      attachQueueHandlers();
    }
  };

  // Drawer Tab Switches
  const drawerTabQueue = document.getElementById('drawer-tab-queue');
  if (drawerTabQueue) {
    drawerTabQueue.onclick = (e) => {
      e.stopPropagation();
      hardwareAudio.play('switch');
      state.drawerTab = 'queue';
      updateDrawerTabDisplay();
    };
  }

  const drawerTabHistory = document.getElementById('drawer-tab-history');
  if (drawerTabHistory) {
    drawerTabHistory.onclick = (e) => {
      e.stopPropagation();
      hardwareAudio.play('switch');
      state.drawerTab = 'history';
      updateDrawerTabDisplay();
    };
  }

  const btnSwitchToHistory = document.getElementById('btn-switch-to-history');
  if (btnSwitchToHistory) {
    btnSwitchToHistory.onclick = (e) => {
      e.stopPropagation();
      hardwareAudio.play('switch');
      state.drawerTab = 'history';
      updateDrawerTabDisplay();
    };
  }

  // Active Task Controls
  document.querySelectorAll('.btn-pause-task').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      downloadManager.pauseDownload(btn.dataset.taskId);
    };
  });

  document.querySelectorAll('.btn-resume-task').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      downloadManager.resumeDownload(btn.dataset.taskId);
    };
  });

  document.querySelectorAll('.btn-cancel-task').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      downloadManager.cancelDownload(btn.dataset.taskId);
    };
  });

  // History Controls
  const clearBtn = document.getElementById('btn-clear-history');
  if (clearBtn) {
    clearBtn.onclick = (e) => {
      e.stopPropagation();
      downloadManager.clearHistory();
    };
  }

  const clearDrawerHistoryBtn = document.getElementById('btn-drawer-clear-history');
  if (clearDrawerHistoryBtn) {
    clearDrawerHistoryBtn.onclick = (e) => {
      e.stopPropagation();
      downloadManager.clearHistory();
      showToast('Download history cleared', 'info');
      updateDrawerTabDisplay();
    };
  }

  document.querySelectorAll('.btn-delete-history-item').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const id = btn.dataset.historyId;
      if (id) {
        downloadManager.deleteHistoryItem(id);
        showToast('Item removed from history', 'info');
        updateDrawerTabDisplay();
      }
    };
  });

  document.querySelectorAll('.btn-reanalyze-history').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const url = btn.dataset.url;
      if (url) {
        state.urlInput = url;
        const input = document.getElementById('main-url-input');
        if (input) input.value = url;
        closeQueueDrawer();
        triggerAnalysis();
      }
    };
  });

  const gotoDownloadBtn = document.getElementById('btn-queue-goto-download');
  if (gotoDownloadBtn) {
    gotoDownloadBtn.onclick = (e) => {
      e.stopPropagation();
      hardwareAudio.play('switch');
      state.activeModule = 'download';
      renderModuleViewport();
      const input = document.getElementById('main-url-input');
      if (input) input.focus();
    };
  }
}

// Media URL Analysis
async function triggerAnalysis() {
  const url = state.urlInput.trim();
  if (!url) {
    showToast('Please paste a YouTube link first', 'error');
    return;
  }

  // Validate format
  if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
    showToast('Please enter a valid YouTube link', 'error');
    return;
  }

  hardwareAudio.play('latch');
  state.isAnalyzing = true;

  const fetchBtn = document.getElementById('btn-analyze-stream');
  if (fetchBtn) {
    fetchBtn.innerHTML = `${icons.layers} <span>FETCHING...</span>`;
    fetchBtn.disabled = true;
  }

  try {
    const data = await apiService.fetchMediaInfo(url);
    state.isAnalyzing = false;

    if (data.isPlaylist) {
      state.playlist = data;
      state.playlistPage = 1;
      state.activeMediaView = 'playlist';
      state.playlistSubTab = 'tracks';
      state.activeModule = 'download';
      showToast(`Playlist loaded: ${data.title} (${data.totalVideos || data.videos.length} videos)`, 'success');
    } else {
      state.currentMedia = data;
      if (data.availableQualities && data.availableQualities.length > 0) {
        state.selectedVideoQuality = data.availableQualities[0];
      }
      state.activeMediaView = 'video';
      state.videoViewMode = 'video';
      state.activeModule = 'download';
      showToast(`Video loaded: ${data.title}`, 'success');
    }
  } catch (err) {
    state.isAnalyzing = false;
    showToast(err.message || 'Could not fetch video info. Verify backend server is running.', 'error');
  } finally {
    if (fetchBtn) {
      fetchBtn.innerHTML = `${icons.bolt} <span>FETCH INFO</span>`;
      fetchBtn.disabled = false;
    }
  }

  renderModuleViewport();
}

// Download Manager Subscription (Lightweight Throttled Updates)
downloadManager.subscribe((dlState, event) => {
  const count = dlState.activeCount;
  const historyCount = dlState.history ? dlState.history.length : 0;

  // Real-time badge counter updates
  const headerBadge = document.getElementById('header-queue-badge');
  if (headerBadge) headerBadge.textContent = count;

  const headerHistBadge = document.getElementById('header-history-badge');
  if (headerHistBadge) headerHistBadge.textContent = historyCount;

  const navBadge = document.getElementById('nav-queue-count');
  if (navBadge) navBadge.textContent = count;

  const drawerBadge = document.getElementById('drawer-queue-count');
  if (drawerBadge) drawerBadge.textContent = count;

  const drawerHistBadge = document.getElementById('drawer-history-count');
  if (drawerHistBadge) drawerHistBadge.textContent = historyCount;

  const pageBadge = document.getElementById('queue-page-count');
  if (pageBadge) pageBadge.textContent = count;

  if (event) {
    if (event.type === 'completed') {
      showToast(`✔ Download Complete: ${event.task.filename}`, 'success');
    } else if (event.type === 'canceled') {
      showToast(`✖ Download Canceled: ${event.task.filename}`, 'error');
    }
  }

  // 1. Live In-Front Feedback for the currently displayed Video Card (.media-cartridge)
  const cartridge = document.getElementById('active-media-cartridge');
  const borderProgress = document.getElementById('cartridge-border-progress');
  const borderFill = document.getElementById('cartridge-border-progress-fill');
  const statusBar = document.getElementById('cartridge-live-status-bar');
  const statusDot = document.getElementById('cartridge-status-dot');
  const statusText = document.getElementById('cartridge-status-text');
  const statusMetrics = document.getElementById('cartridge-status-metrics');
  const statusBytes = document.getElementById('cartridge-status-bytes');

  const mainDlBtn = document.getElementById('btn-primary-video-download');
  const btnFill = document.getElementById('btn-download-progress-fill');
  const btnLabel = document.getElementById('btn-download-label');

  const btnZip = document.getElementById('btn-video-download-zip');
  const btnZipFill = document.getElementById('btn-video-zip-fill');
  const btnZipLabel = document.getElementById('btn-video-zip-label');

  if (state.currentMedia) {
    const activeDlTask = dlState.active.find(t =>
      ((state.currentMedia.id && t.mediaId === state.currentMedia.id) ||
        (state.currentMedia.title && t.title === state.currentMedia.title) ||
        (state.currentMedia.url && t.url === state.currentMedia.url)) &&
      !t.format?.includes('ZIP')
    );

    const activeZipTask = dlState.active.find(t =>
      ((state.currentMedia.id && t.mediaId === state.currentMedia.id) ||
        (state.currentMedia.title && (t.title === state.currentMedia.title || t.title?.includes(state.currentMedia.title))) ||
        (state.currentMedia.url && t.url === state.currentMedia.url)) &&
      t.format?.includes('ZIP')
    );

    const currentTask = activeZipTask || activeDlTask;

    if (currentTask && (currentTask.status === 'downloading' || currentTask.status === 'paused')) {
      cartridge?.classList.add('downloading');
      cartridge?.classList.remove('completed');

      // Live border-bottom 0-100% progress
      if (borderProgress && borderFill) {
        borderProgress.classList.add('active');
        borderFill.classList.remove('completed');
        if (activeZipTask) {
          borderFill.classList.add('zip-mode');
        } else {
          borderFill.classList.remove('zip-mode');
        }
        borderFill.style.width = currentTask.progress + '%';
      }

      // Live telemetry status bar
      if (statusBar) {
        statusBar.classList.add('active');
        if (statusText) {
          statusText.classList.remove('completed');
          statusText.textContent = activeZipTask
            ? `PACKAGING ZIP ${currentTask.progress}%`
            : `${currentTask.status === 'paused' ? 'PAUSED' : 'DOWNLOADING'} ${currentTask.progress}%`;
        }
        if (statusMetrics) {
          statusMetrics.textContent = `${currentTask.speed} • ETA: ${currentTask.eta}`;
        }
        if (statusBytes) {
          const mbDown = (currentTask.downloadedBytes / (1024 * 1024)).toFixed(1);
          const mbTotal = (currentTask.totalBytes / (1024 * 1024)).toFixed(1);
          statusBytes.textContent = `${mbDown} / ${mbTotal} MB`;
        }
        if (statusDot) {
          statusDot.className = `status-pulse-dot ${currentTask.status === 'paused' ? 'pulse-lime' : (activeZipTask ? 'pulse-lime' : 'pulse-orange')}`;
        }
      }

      // Update active ZIP button if ZIP task is running
      if (activeZipTask && btnZip) {
        btnZip.classList.add('downloading');
        btnZip.classList.remove('completed');
        if (btnZipFill) btnZipFill.style.width = activeZipTask.progress + '%';
        if (btnZipLabel) {
          btnZipLabel.innerHTML = `${icons.zip} <span>${activeZipTask.progress}% • PACKAGING ZIP...</span>`;
        }
      }

      // Update active regular download button if regular task is running
      if (activeDlTask && mainDlBtn) {
        mainDlBtn.classList.add('downloading');
        mainDlBtn.classList.remove('completed');
        if (btnFill) btnFill.style.width = activeDlTask.progress + '%';
        if (btnLabel) {
          btnLabel.innerHTML = `${icons.download} <span>${activeDlTask.progress}% • ${activeDlTask.status === 'paused' ? 'PAUSED' : 'DOWNLOADING...'}</span>`;
        }
      }
    } else if (event && event.type === 'completed' && event.task) {
      const isEventZip = event.task.format?.includes('ZIP');
      if (isEventZip && btnZip) {
        btnZip.classList.remove('downloading');
        btnZip.classList.add('completed');
        if (btnZipFill) btnZipFill.style.width = '100%';
        if (btnZipLabel) {
          btnZipLabel.innerHTML = `${icons.checkCircle} <span>100% • ZIP READY</span>`;
        }
        setTimeout(() => {
          btnZip?.classList.remove('completed');
          if (btnZipLabel) btnZipLabel.innerHTML = `${icons.zip} <span>DOWNLOAD AS ZIP</span>`;
        }, 5000);
      }
      if (!isEventZip && mainDlBtn) {
        mainDlBtn.classList.remove('downloading');
        mainDlBtn.classList.add('completed');
        if (btnFill) btnFill.style.width = '100%';
        if (btnLabel) {
          btnLabel.innerHTML = `${icons.checkCircle} <span>100% • COMPLETED</span>`;
        }
        setTimeout(() => {
          mainDlBtn?.classList.remove('completed');
          if (btnLabel) btnLabel.innerHTML = `${icons.download} <span>DOWNLOAD (${state.selectedVideoFormat})</span>`;
        }, 5000);
      }

      if (borderProgress && borderFill) {
        borderProgress.classList.add('active');
        borderFill.classList.add('completed');
        borderFill.style.width = '100%';
      }
      if (statusBar) {
        statusBar.classList.add('active');
        if (statusText) {
          statusText.classList.add('completed');
          statusText.textContent = isEventZip ? '✔ ZIP PACKAGE READY (100%)' : '✔ DOWNLOAD COMPLETE (100%)';
        }
      }
      setTimeout(() => {
        borderProgress?.classList.remove('active');
        statusBar?.classList.remove('active');
        cartridge?.classList.remove('completed');
      }, 5000);
    } else if (!currentTask && !event) {
      if (!mainDlBtn?.classList.contains('completed') && !btnZip?.classList.contains('completed')) {
        borderProgress?.classList.remove('active');
        statusBar?.classList.remove('active');
        cartridge?.classList.remove('downloading');
      }
      if (!mainDlBtn?.classList.contains('completed')) {
        mainDlBtn?.classList.remove('downloading');
        if (btnFill) btnFill.style.width = '0%';
        if (btnLabel) {
          btnLabel.innerHTML = `${icons.download} <span>DOWNLOAD (${state.selectedVideoFormat})</span>`;
        }
      }
      if (!btnZip?.classList.contains('completed')) {
        btnZip?.classList.remove('downloading');
        if (btnZipFill) btnZipFill.style.width = '0%';
        if (btnZipLabel) {
          btnZipLabel.innerHTML = `${icons.zip} <span>DOWNLOAD AS ZIP</span>`;
        }
      }
    }
  }

  // 2. Live In-Front Feedback for Playlist Track Items (.crate-track-item) - Only when active
  if (state.playlist && state.activeMediaView === 'playlist' && dlState.activeCount > 0) {
    document.querySelectorAll('.crate-track-item').forEach(trackItem => {
      const trackId = trackItem.dataset.trackId;
      if (!trackId) return;

      const task = dlState.active.find(t => t.mediaId === trackId);
      const progressContainer = trackItem.querySelector('.crate-track-progress');
      const progressFill = trackItem.querySelector('.crate-track-progress-fill');
      const dlBtn = trackItem.querySelector('.btn-track-download');
      const dlLabel = trackItem.querySelector('.track-dl-label');

      if (task && (task.status === 'downloading' || task.status === 'paused')) {
        if (progressContainer && progressFill) {
          progressContainer.classList.add('active');
          progressFill.style.width = task.progress + '%';
        }
        if (dlLabel) dlLabel.textContent = `${task.progress}%`;
        if (dlBtn) dlBtn.style.opacity = '0.9';
      } else {
        if (progressContainer) progressContainer.classList.remove('active');
        if (dlLabel && dlLabel.textContent !== 'SAVED') dlLabel.textContent = 'DOWNLOAD';
        if (dlBtn) dlBtn.style.opacity = '1';
      }
    });
  }

  // 3. Live Feedback for Playlist ZIP Packaging
  if (state.playlist) {
    const plZipTask = dlState.active.find(t => t.id.startsWith('zip-pl') || t.format?.includes('ZIP ARCHIVE'));
    const btnPlZip = document.getElementById('btn-download-zip');
    const btnPlZipFill = document.getElementById('btn-playlist-zip-fill');
    const btnPlZipLabel = document.getElementById('btn-playlist-zip-label');
    const btnPlQuick = document.getElementById('btn-playlist-zip-quick');
    const btnPlQuickFill = document.getElementById('btn-playlist-zip-quick-fill');
    const btnPlQuickLabel = document.getElementById('btn-playlist-zip-quick-label');
    const plBorder = document.getElementById('playlist-border-progress');
    const plBorderFill = document.getElementById('playlist-border-progress-fill');
    const plHeader = document.getElementById('playlist-rack-header');

    if (plZipTask && (plZipTask.status === 'downloading' || plZipTask.status === 'paused')) {
      plHeader?.classList.add('downloading');
      if (plBorder && plBorderFill) {
        plBorder.classList.add('active');
        plBorderFill.style.width = plZipTask.progress + '%';
      }
      if (btnPlZip) {
        btnPlZip.classList.add('downloading');
        if (btnPlZipFill) btnPlZipFill.style.width = plZipTask.progress + '%';
        if (btnPlZipLabel) btnPlZipLabel.innerHTML = `${icons.zip} <span>${plZipTask.progress}% • PACKAGING ZIP...</span>`;
      }
      if (btnPlQuick) {
        btnPlQuick.classList.add('downloading');
        if (btnPlQuickFill) btnPlQuickFill.style.width = plZipTask.progress + '%';
        if (btnPlQuickLabel) btnPlQuickLabel.innerHTML = `${icons.zip} <span>${plZipTask.progress}% ZIP</span>`;
      }
    } else if (!plZipTask && !event) {
      if (!btnPlZip?.classList.contains('completed')) {
        plHeader?.classList.remove('downloading');
        plBorder?.classList.remove('active');
        btnPlZip?.classList.remove('downloading');
        if (btnPlZipFill) btnPlZipFill.style.width = '0%';
        if (btnPlZipLabel) btnPlZipLabel.innerHTML = `${icons.zip} <span>DOWNLOAD AS ZIP</span>`;
      }
      if (!btnPlQuick?.classList.contains('completed')) {
        btnPlQuick?.classList.remove('downloading');
        if (btnPlQuickFill) btnPlQuickFill.style.width = '0%';
        if (btnPlQuickLabel) btnPlQuickLabel.innerHTML = `${icons.zip} <span>DOWNLOAD AS ZIP</span>`;
      }
    }
  }

  if (state.activeModule === 'queue') {
    const viewport = document.getElementById('module-viewport');
    if (viewport) {
      viewport.innerHTML = renderQueueModule();
      attachQueueHandlers();
    }
  }

  // 4. Update Drawer ONLY when drawer is actually OPEN
  if (state.isDrawerOpen) {
    const drawerItems = document.getElementById('drawer-queue-items');
    if (drawerItems) {
      drawerItems.innerHTML = renderDrawerItems();
      attachQueueHandlers();
    }
  }
});

// App Bootstrap
let __initRan = false;
function bootstrap() {
  if (__initRan) return;
  __initRan = true;

  initI18n(); // set <html lang> + expose t()
  renderApp();
  applyRoute();
  loadAdSense();
  analytics.init(); // privacy-friendly + optional GA

  // Offline detection UX: probe health once at boot; warn clearly if the
  // backend is not reachable (the app then runs in simulated preview mode).
  apiService.checkHealth().then((online) => {
    state.backendOnline = online;
    if (!online && !state.__offlineNotified) {
      state.__offlineNotified = true;
      showToast(
        import.meta.env.DEV
          ? 'Backend offline — start it with: cd backend && npm start'
          : 'Server temporarily unreachable — showing preview mode.',
        'alert'
      );
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}

// Hash router — navigate between the tool and content/legal pages
window.addEventListener('hashchange', () => {
  analytics.track('page_view', { page: location.hash || '/' });
  applyRoute();
});
