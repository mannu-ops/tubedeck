// Comprehensive Landing Content & Navigation for TubeDeck Downloader
// Adapted with precision for YouTube Shorts, 4K Videos, MP3 Audio, and 50+ Playlist Pagination & ZIP Packaging

export function renderTopHeader(activeCount, icons, historyCount = 0) {
  return `
    <header class="top-navbar-header">
      <div class="nav-brand-group" id="nav-brand-top" title="TubeDeck Home">
        <div class="nav-brand-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon>
          </svg>
        </div>
        <div class="nav-brand-text">
          <div class="nav-brand-name">
            <span>TUBEDECK</span>
            <span class="nav-brand-pill">PRO v2.5</span>
          </div>
          <span class="nav-brand-sub">FAST YOUTUBE & PLAYLIST DOWNLOADER</span>
        </div>
      </div>

      <!-- Desktop Center Menu (Visible on Desktop >= 881px) -->
      <nav class="nav-center-menu" aria-label="Main Navigation">
        <button class="nav-link-btn" data-action="focus-downloader" title="Go to Downloader Input">
          ${icons.download} <span>DOWNLOADER</span>
        </button>
        <button class="nav-link-btn" data-action="nav-shorts" title="Download YouTube Shorts">
          ${icons.video} <span>SHORTS</span>
        </button>
        <button class="nav-link-btn" data-action="nav-audio" title="Extract 320k MP3 Audio">
          ${icons.music} <span>MP3 AUDIO</span>
        </button>
        <button class="nav-link-btn" data-action="nav-playlist" title="Batch Download Playlists with ZIP">
          ${icons.playlist} <span>PLAYLISTS & ZIP</span>
        </button>
        <a href="#how-to-section" class="nav-link-btn" data-scroll="#how-to-section">
          ${icons.eye} <span>HOW TO</span>
        </a>
        <a href="#features-section" class="nav-link-btn" data-scroll="#features-section">
          ${icons.bolt} <span>FEATURES</span>
        </a>
        <a href="#faq-section" class="nav-link-btn" data-scroll="#faq-section">
          ${icons.sparkles} <span>FAQ</span>
        </a>
        <a href="#/blog" class="nav-link-btn" data-route="blog" title="Guides & Help Center">
          ${icons.eye} <span>BLOG</span>
        </a>
      </nav>

      <!-- Right Utilities: Downloads Queue + History + Mobile Hamburger Menu Toggle -->
      <div class="nav-right-actions">
        <button class="tactile-btn btn-open-history-trigger lime-accent header-queue-btn" style="font-weight:700;" title="View Download History">
          ${icons.history}
          <span>HISTORY</span>
          <span class="header-queue-counter-badge lime" id="header-history-badge">
            ${historyCount}
          </span>
        </button>

        <button class="tactile-btn btn-open-queue-trigger orange-accent header-queue-btn" style="font-weight:700;" title="View Downloads Queue">
          ${icons.download}
          <span>QUEUE</span>
          <span class="header-queue-counter-badge" id="header-queue-badge">
            ${activeCount}
          </span>
        </button>

        <button class="tactile-btn nav-mobile-toggle-btn" id="btn-mobile-nav-toggle" aria-label="Toggle navigation menu" title="Open Menu">
          <span class="mobile-toggle-icon-bars">${icons.menu}</span>
          <span class="mobile-toggle-icon-close" style="display:none;">${icons.close}</span>
        </button>
      </div>
    </header>

    <!-- Slide-in Mobile Navigation Drawer & Backdrop -->
    <div class="mobile-nav-backdrop" id="mobile-nav-backdrop"></div>
    <aside class="mobile-nav-drawer" id="mobile-nav-drawer" aria-label="Mobile Navigation">
      <div class="mobile-nav-drawer-header">
        <div class="mobile-nav-drawer-brand">
          <div class="nav-brand-logo small">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon>
            </svg>
          </div>
          <span class="mobile-nav-drawer-title">TUBEDECK MENU</span>
        </div>
        <button class="mobile-nav-close-btn" id="btn-close-mobile-nav" title="Close Menu" aria-label="Close menu">
          ${icons.close}
        </button>
      </div>

      <div class="mobile-nav-links-list">
        <button class="mobile-nav-item" data-action="focus-downloader">
          <span class="mobile-nav-icon orange">${icons.download}</span>
          <div class="mobile-nav-info">
            <span class="mobile-nav-label">Downloader</span>
            <span class="mobile-nav-hint">Paste YouTube link to analyze</span>
          </div>
        </button>

        <button class="mobile-nav-item" data-action="nav-shorts">
          <span class="mobile-nav-icon red">${icons.video}</span>
          <div class="mobile-nav-info">
            <span class="mobile-nav-label">YouTube Shorts</span>
            <span class="mobile-nav-hint">Vertical 9:16 HD & audio</span>
          </div>
        </button>

        <button class="mobile-nav-item" data-action="nav-audio">
          <span class="mobile-nav-icon lime">${icons.music}</span>
          <div class="mobile-nav-info">
            <span class="mobile-nav-label">MP3 Audio (320 kbps)</span>
            <span class="mobile-nav-hint">High-bitrate sound extraction</span>
          </div>
        </button>

        <button class="mobile-nav-item" data-action="nav-playlist">
          <span class="mobile-nav-icon lime">${icons.playlist}</span>
          <div class="mobile-nav-info">
            <span class="mobile-nav-label">Playlists & ZIP</span>
            <span class="mobile-nav-hint">50-track pagination & batch ZIP</span>
          </div>
        </button>

        <button class="mobile-nav-item" data-action="nav-history">
          <span class="mobile-nav-icon lime">${icons.history}</span>
          <div class="mobile-nav-info">
            <span class="mobile-nav-label">Download History</span>
            <span class="mobile-nav-hint">View completed downloads</span>
          </div>
        </button>

        <a href="#/blog" class="mobile-nav-item mobile-nav-scroll-link" data-route="blog">
          <span class="mobile-nav-icon">${icons.eye}</span>
          <div class="mobile-nav-info">
            <span class="mobile-nav-label">Blog & Guides</span>
            <span class="mobile-nav-hint">Help center articles</span>
          </div>
        </a>

        <div class="mobile-nav-divider"></div>

        <a href="#how-to-section" class="mobile-nav-item mobile-nav-scroll-link">
          <span class="mobile-nav-icon">${icons.eye}</span>
          <div class="mobile-nav-info">
            <span class="mobile-nav-label">How To Download</span>
            <span class="mobile-nav-hint">4-step quick guide</span>
          </div>
        </a>

        <a href="#features-section" class="mobile-nav-item mobile-nav-scroll-link">
          <span class="mobile-nav-icon">${icons.bolt}</span>
          <div class="mobile-nav-info">
            <span class="mobile-nav-label">Features & Specs</span>
            <span class="mobile-nav-hint">Supported resolutions & formats</span>
          </div>
        </a>

        <a href="#faq-section" class="mobile-nav-item mobile-nav-scroll-link">
          <span class="mobile-nav-icon">${icons.sparkles}</span>
          <div class="mobile-nav-info">
            <span class="mobile-nav-label">FAQ & Help</span>
            <span class="mobile-nav-hint">Questions & compliance</span>
          </div>
        </a>
      </div>
    </aside>
  `;
}

export function renderHeroHighlights(icons) {
  return `
    <div class="hero-highlights-strip">
      <div class="hero-pill-badge">
        <span class="hero-pill-icon">${icons.bolt}</span>
        <span>Lightning-Fast YouTube Fetch</span>
      </div>
      <div class="hero-pill-badge">
        <span class="hero-pill-icon">${icons.video}</span>
        <span>Up to 4K UHD & 1080p Full HD</span>
      </div>
      <div class="hero-pill-badge">
        <span class="hero-pill-icon lime">${icons.music}</span>
        <span>Studio MP3 Audio (320 kbps)</span>
      </div>
      <div class="hero-pill-badge">
        <span class="hero-pill-icon lime">${icons.zip}</span>
        <span>Playlist Batch & ZIP</span>
      </div>
      <div class="hero-pill-badge">
        <span class="hero-pill-icon">${icons.checkCircle}</span>
        <span>100% Free • No Sign-Up • No App</span>
      </div>
    </div>
  `;
}

export function renderLandingContent(icons) {
  return `
    <div class="landing-content-wrap">
      <!-- 1. HOW TO DOWNLOAD SECTION -->
      <section class="landing-section" id="how-to-section">
        <div class="landing-section-header">
          <span class="section-tag-pill">${icons.sparkles} [ EASY 4-STEP WORKFLOW ]</span>
          <h2 class="section-title">How to Download YouTube Videos & Shorts</h2>
          <p class="section-subtitle">
            A clean, professional workflow to save single videos, vertical Shorts, and entire multi-track playlists on mobile and desktop without any third-party app.
          </p>
        </div>

        <div class="steps-grid-4">
          <div class="step-card">
            <div class="step-number-badge">01</div>
            <h3 class="step-card-title">Copy YouTube Link</h3>
            <p class="step-card-desc">
              Open the video, Shorts, or playlist in YouTube. Copy the full URL from the browser address bar, or tap <strong>Share → Copy link</strong> in the mobile app.
            </p>
          </div>

          <div class="step-card">
            <div class="step-number-badge">02</div>
            <h3 class="step-card-title">Paste & Fetch Stream</h3>
            <p class="step-card-desc">
              Paste the link into the URL input box above and tap <strong style="color:var(--signal-orange);">FETCH INFO</strong>. Our high-speed engine parses all formats in seconds.
            </p>
          </div>

          <div class="step-card">
            <div class="step-number-badge">03</div>
            <h3 class="step-card-title">Choose Quality & Format</h3>
            <p class="step-card-desc">
              Select your desired video resolution (4K, 1440p, 1080p, 720p) or studio MP3 audio bitrate (320k, 256k, FLAC lossless) from the dropdown selectors.
            </p>
          </div>

          <div class="step-card">
            <div class="step-number-badge">04</div>
            <h3 class="step-card-title">Download or Package ZIP</h3>
            <p class="step-card-desc">
              Tap <strong style="color:var(--signal-orange);">DOWNLOAD</strong> for instant offline saving, or tap <strong style="color:var(--signal-lime);">DOWNLOAD AS ZIP</strong> to bundle multi-track playlists with automatic numbering.
            </p>
          </div>
        </div>
      </section>

      <!-- 2. FEATURES GRID SECTION -->
      <section class="landing-section" id="features-section">
        <div class="landing-section-header">
          <span class="section-tag-pill lime">${icons.bolt} [ WHY CHOOSE TUBEDECK ]</span>
          <h2 class="section-title">Why TubeDeck Feels Like the Best Downloader</h2>
          <p class="section-subtitle">
            Engineered for pure speed, source fidelity, and robust playlist handling that ordinary downloaders simply cannot deliver.
          </p>
        </div>

        <div class="features-rich-grid">
          <div class="feature-rich-card">
            <div class="feature-icon-box">${icons.bolt}</div>
            <h3 class="feature-card-heading">Paste Link & Instant Fetch</h3>
            <p class="feature-card-body">
              Drop a YouTube video or Shorts link and retrieve available streaming variants in a few milliseconds. Zero extensions, zero spyware, and zero clutter.
            </p>
          </div>

          <div class="feature-rich-card">
            <div class="feature-icon-box">${icons.video}</div>
            <h3 class="feature-card-heading">Vertical Shorts & 4K UHD Video</h3>
            <p class="feature-card-body">
              Download vertical Shorts in native 9:16 aspect ratio and standard videos in crystal-clear 1080p, 2K, or 4K 60fps. We mirror original quality without upscaling or watermarks.
            </p>
          </div>

          <div class="feature-rich-card">
            <div class="feature-icon-box lime">${icons.music}</div>
            <h3 class="feature-card-heading">Studio MP3 Audio (320 kbps)</h3>
            <p class="feature-card-body">
              Extract high-bitrate MP3 (320k, 256k, 128k) or lossless FLAC audio. Automatically embeds track title, channel name, and album artwork into ID3 tags.
            </p>
          </div>

          <div class="feature-rich-card highlight">
            <div class="feature-icon-box lime">${icons.layers}</div>
            <h3 class="feature-card-heading" style="color:var(--signal-lime);">Smart Playlist Pagination Engine</h3>
            <p class="feature-card-body">
              While other tools crash or refuse playlists, TubeDeck handles large playlists with elegance. Automatically paginates playlists exceeding 50 videos into clean 50-track pages with FIRST, PREV, numbered buttons, NEXT, and LAST controls.
            </p>
          </div>

          <div class="feature-rich-card highlight">
            <div class="feature-icon-box lime">${icons.zip}</div>
            <h3 class="feature-card-heading" style="color:var(--signal-lime);">1-Click Indexed ZIP Archiving</h3>
            <p class="feature-card-body">
              Download an entire playlist in a single compressed .zip file. Tracks are automatically sequenced with numbering (<code style="color:var(--signal-lime);">01 - </code>, <code style="color:var(--signal-lime);">02 - </code>) plus an M3U playlist file for car stereos and media players.
            </p>
          </div>

          <div class="feature-rich-card">
            <div class="feature-icon-box">${icons.checkCircle}</div>
            <h3 class="feature-card-heading">No App, No Login & Privacy-First</h3>
            <p class="feature-card-body">
              Everything runs directly in your web browser. Requests are processed transiently on demand — we never track user browsing, preload third-party media, or require user registration.
            </p>
          </div>
        </div>
      </section>

      <!-- 3. DEVICES & COMPATIBILITY SECTION -->
      <section class="landing-section" id="devices-section">
        <div class="landing-section-header">
          <span class="section-tag-pill">${icons.cpu} [ UNIVERSAL COMPATIBILITY ]</span>
          <h2 class="section-title">Works Everywhere — iPhone, Android, Windows & Mac</h2>
          <p class="section-subtitle">
            Optimized for all modern devices and operating systems. Save your media directly with full offline access.
          </p>
        </div>

        <div class="devices-grid">
          <div class="device-card">
            <div class="device-header">
              <span>🍏</span>
              <span>iPhone & iPad (iOS Safari)</span>
            </div>
            <p class="device-desc">
              Open Safari, paste the link into TubeDeck, choose your video or audio quality, and tap Download when iOS prompts. Your file saves directly to <strong>Files → Downloads</strong> for easy camera roll saving.
            </p>
          </div>

          <div class="device-card">
            <div class="device-header">
              <span>🤖</span>
              <span>Android (Chrome & Firefox)</span>
            </div>
            <p class="device-desc">
              Open Chrome or Firefox, paste the YouTube link, select MP4 or MP3, and tap Download. The file downloads in the background directly into your device's <strong>Downloads</strong> folder.
            </p>
          </div>

          <div class="device-card">
            <div class="device-header">
              <span>💻</span>
              <span>Windows PC (Chrome / Edge / Firefox)</span>
            </div>
            <p class="device-desc">
              High-speed multi-threaded downloads. If a video opens in a new playback tab, simply right-click and choose <strong>"Save video as..."</strong> or use our 1-click ZIP archiver.
            </p>
          </div>

          <div class="device-card">
            <div class="device-header">
              <span>🍎</span>
              <span>macOS (Safari, Chrome & Brave)</span>
            </div>
            <p class="device-desc">
              Full support for native macOS browsers. Choose high-bitrate MP3 or 4K MP4 with single-click folder access and instant QuickTime / Apple Music playback.
            </p>
          </div>
        </div>
      </section>

      <!-- 4. PRO TIPS & BEST PRACTICES -->
      <section class="landing-section" id="pro-tips-section">
        <div class="landing-section-header">
          <span class="section-tag-pill lime">${icons.check} [ BEST PRACTICES ]</span>
          <h2 class="section-title">Pro Tips for Faster, Cleaner Downloads</h2>
          <p class="section-subtitle">
            Get the most out of your downloads with clean link structures and smart batch controls.
          </p>
        </div>

        <div class="steps-grid-4">
          <div class="step-card">
            <h4 class="step-card-title" style="color:var(--signal-orange);">Use Clean Links</h4>
            <p class="step-card-desc">
              Copy links directly from the video or Shorts page (e.g. <code>youtube.com/shorts/id</code> or <code>youtu.be/id</code>). Avoid parameter-heavy URLs with tracking tags for fastest stream resolution.
            </p>
          </div>

          <div class="step-card">
            <h4 class="step-card-title" style="color:var(--signal-lime);">Batch Selection</h4>
            <p class="step-card-desc">
              When working with large playlists, use <strong>SELECT THIS PAGE (50)</strong> to queue batches in increments, or use <strong>SELECT ALL</strong> to export the entire catalog.
            </p>
          </div>

          <div class="step-card">
            <h4 class="step-card-title" style="color:var(--signal-orange);">Adequate Storage</h4>
            <p class="step-card-desc">
              4K 60fps videos and multi-track playlist archives can be large (often 500MB – 2GB). Ensure sufficient local disk space before beginning large ZIP downloads.
            </p>
          </div>

          <div class="step-card">
            <h4 class="step-card-title" style="color:var(--signal-lime);">Organized ZIP Indexing</h4>
            <p class="step-card-desc">
              TubeDeck automatically prefixes files in ZIP archives with <code>01 - </code>, <code>02 - </code>, preserving original album track sequence in any offline music player.
            </p>
          </div>
        </div>
      </section>

      <!-- 5. INTERACTIVE FAQ SECTION -->
      <section class="landing-section" id="faq-section">
        <div class="landing-section-header">
          <span class="section-tag-pill">${icons.sparkles} [ FREQUENTLY ASKED QUESTIONS ]</span>
          <h2 class="section-title">Frequently Asked Questions</h2>
          <p class="section-subtitle">
            Have questions about resolutions, audio extraction, playlist pagination, or troubleshooting? Find answers below.
          </p>
        </div>

        <div class="faq-accordion-list">
          <div class="faq-item open">
            <button class="faq-question-btn" type="button">
              <span>Can I download YouTube Shorts as well as regular long videos?</span>
              <span class="faq-chevron">${icons.chevronDown}</span>
            </button>
            <div class="faq-answer-panel">
              Yes! TubeDeck seamlessly supports YouTube Shorts in native vertical 9:16 aspect ratios, standard 16:9 YouTube videos up to 4K UHD, music videos, and multi-track playlists. Simply paste any YouTube link into the box above.
            </div>
          </div>

          <div class="faq-item">
            <button class="faq-question-btn" type="button">
              <span>How do I extract high-quality MP3 audio from a video?</span>
              <span class="faq-chevron">${icons.chevronDown}</span>
            </button>
            <div class="faq-answer-panel">
              Paste the video URL into TubeDeck and click FETCH INFO. Under the quality options, select your preferred audio bitrate: <strong>MP3 320 kbps (Studio Master)</strong> for highest fidelity, 256 kbps, 128 kbps, or uncompressed FLAC. Click DOWNLOAD to save the audio file.
            </div>
          </div>

          <div class="faq-item">
            <button class="faq-question-btn" type="button">
              <span>How does playlist downloading and the 50-video pagination work?</span>
              <span class="faq-chevron">${icons.chevronDown}</span>
            </button>
            <div class="faq-answer-panel">
              Paste any YouTube playlist link. If the playlist contains more than 50 videos, TubeDeck automatically divides it into clean pages of 50 tracks each (e.g. Page 1: 1–50, Page 2: 51–100). You can navigate using FIRST, PREV, numbered buttons, NEXT, and LAST. You can choose to download all tracks or just the current page.
            </div>
          </div>

          <div class="faq-item">
            <button class="faq-question-btn" type="button">
              <span>Will files inside a downloaded ZIP archive have track numbers?</span>
              <span class="faq-chevron">${icons.chevronDown}</span>
            </button>
            <div class="faq-answer-panel">
              Yes! When you download as ZIP, all tracks are automatically indexed with numbers (e.g., <code>01 - Track Title.mp4</code>, <code>02 - Next Song.mp4</code>). The archive also includes an M3U playlist file and a manifest JSON, ensuring your tracks play in the correct sequence.
            </div>
          </div>

          <div class="faq-item">
            <button class="faq-question-btn" type="button">
              <span>What should I do if the video starts playing instead of downloading?</span>
              <span class="faq-chevron">${icons.chevronDown}</span>
            </button>
            <div class="faq-answer-panel">
              On desktop browsers (Chrome, Edge, Firefox), right-click the video and choose <strong>"Save video as..."</strong>. On iOS Safari, tap the blue Download indicator in the address bar. Alternatively, click DOWNLOAD AS ZIP to force an instant file download.
            </div>
          </div>

          <div class="faq-item">
            <button class="faq-question-btn" type="button">
              <span>Is TubeDeck free and is any installation or signup required?</span>
              <span class="faq-chevron">${icons.chevronDown}</span>
            </button>
            <div class="faq-answer-panel">
              TubeDeck is 100% free, browser-based, and does not require any account, registration, login, credit card, or browser extension. It works worldwide on iPhone, Android, Windows, and macOS.
            </div>
          </div>
        </div>
      </section>

      <!-- 6. COMPLIANCE & LEGAL NOTICE -->
      <section class="landing-section" id="legal-section">
        <div class="compliance-card">
          <div class="compliance-title">
            <span style="color:var(--signal-orange);">${icons.alertTriangle}</span>
            <span>Legal, Ethical & Compliance Notice</span>
          </div>
          <div class="compliance-text">
            <p style="margin-bottom:8px;">
              TubeDeck is engineered strictly for personal, permissioned offline use. Always respect YouTube's Terms of Service and the copyright of content creators. Do not download copyrighted material unless you own it, have explicit permission from the rights holder, or YouTube provides an official download option.
            </p>
            <p style="margin:0;">
              <strong>Disclaimer:</strong> TubeDeck is an independent software tool and is not affiliated with, sponsored, or endorsed by YouTube or Google. We do not host or store third-party media; all streaming variants are processed transiently on user demand.
            </p>
          </div>
        </div>
      </section>
    </div>

    <!-- 7. GLOBAL SITE FOOTER -->
    ${renderSiteFooter(icons)}
  `;
}

// Standalone site footer (reused on tool page AND content/legal pages)
export function renderSiteFooter(icons) {
  return `
    <footer class="app-site-footer" id="app-footer">
      <div class="footer-inner">
        <div class="footer-cols-grid">
          <div>
            <div class="nav-brand-group" style="cursor:default;">
              <div class="nav-brand-logo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon>
                </svg>
              </div>
              <div class="nav-brand-text">
                <div class="nav-brand-name">
                  <span>TUBEDECK</span>
                  <span class="nav-brand-pill">PRO</span>
                </div>
              </div>
            </div>
            <p class="footer-brand-desc">
              High-speed, browser-based YouTube video, Shorts, and playlist downloader. Extract 4K video, 320k MP3 audio, and package entire playlists into indexed ZIP archives.
            </p>
          </div>

          <div>
            <div class="footer-col-title">Tools & Converters</div>
            <div class="footer-links-list">
              <a href="#/" class="footer-link-item">YouTube Video Downloader</a>
              <a href="#/" class="footer-link-item">YouTube Shorts Downloader</a>
              <a href="#/" class="footer-link-item">YouTube MP3 320k Audio</a>
              <a href="#/" class="footer-link-item">Playlist ZIP Archiver</a>
              <span class="footer-link-item" data-action="nav-history" style="cursor:pointer; color:var(--signal-lime);">Download History Archive</span>
            </div>
          </div>

          <div>
            <div class="footer-col-title">Guides & Content</div>
            <div class="footer-links-list">
              <a href="#/blog" class="footer-link-item">All Guides</a>
              <a href="#/blog/how-to-download-youtube-videos" class="footer-link-item">How to Download</a>
              <a href="#/blog/convert-youtube-to-mp3-320kbps" class="footer-link-item">MP3 320 kbps Guide</a>
              <a href="#/blog/download-entire-youtube-playlists-zip" class="footer-link-item">Playlist ZIP Guide</a>
              <a href="#/blog/is-it-legal-to-download-youtube-videos" class="footer-link-item">Is It Legal?</a>
            </div>
          </div>

          <div>
            <div class="footer-col-title">Company & Legal</div>
            <div class="footer-links-list">
              <a href="#/about" class="footer-link-item">About</a>
              <a href="#/contact" class="footer-link-item">Contact & Support</a>
              <a href="#/privacy" class="footer-link-item">Privacy Policy</a>
              <a href="#/terms" class="footer-link-item">Terms of Service</a>
              <span class="footer-link-item">© 2026 TubeDeck</span>
            </div>
          </div>
        </div>

        <div class="footer-bottom-bar">
          <div>
            © 2026 <strong>TubeDeck</strong>. All rights reserved. Built for creators and offline listeners.
          </div>
          <div style="display:flex; gap:16px;">
            <a href="#/terms" style="color:var(--text-dim); text-decoration:none;">Terms of Service</a>
            <span>•</span>
            <a href="#/privacy" style="color:var(--text-dim); text-decoration:none;">Privacy Policy</a>
            <span>•</span>
            <a href="#/contact" style="color:var(--text-dim); text-decoration:none;">Contact & Support</a>
          </div>
        </div>
      </div>
    </footer>
  `;
}
