// TubeDeck Content Pages — Track A (original content for AdSense eligibility) + legal pages
// Each renderer returns an HTML string for the page body (the global shell adds header + footer).

import { icons } from './icons.js';

// ---------------------------------------------------------------------------
// BLOG CONTENT (original, human-written guides)
// ---------------------------------------------------------------------------
export const BLOG_POSTS = [
  {
    slug: 'how-to-download-youtube-videos',
    title: 'How to Download YouTube Videos on Any Device (2025 Guide)',
    excerpt: 'A practical, step-by-step walkthrough for saving YouTube videos, Shorts, and playlists as offline files on both desktop and mobile.',
    category: 'Guides',
    date: '2025-06-14',
    readTime: '6 min',
    tags: ['youtube', 'download', 'guide'],
    body: [
      '<p><strong>Why download YouTube videos?</strong> Whether you are travelling, commuting through a tunnel, or simply want to keep a copy of a tutorial before it is removed, having an offline file is genuinely useful. In this guide we will show you the cleanest way to save videos in the highest available quality, with no watermarks and no account required.</p>',
      '<h2>What you will need</h2>',
      '<ul><li>A web browser (Chrome, Edge, Firefox, or Safari)</li><li>A stable internet connection for the duration of the fetch</li><li>A YouTube link (video, Short, or playlist)</li></ul>',
      '<h2>Step 1 — Copy your YouTube link</h2>',
      '<p>Open YouTube, find the video or Short you want, and copy its URL from the address bar. You can also right-click a video and choose "Copy video URL".</p>',
      '<h2>Step 2 — Paste the link and fetch info</h2>',
      '<p>Go to the TubeDeck downloader section, paste the link into the input bay, and press <strong>FETCH INFO</strong>. The engine inspects the video and lists every available quality and format — from 4K down to 360p, plus audio-only options.</p>',
      '<h2>Step 3 — Choose a quality and download</h2>',
      '<p>Select the resolution you want (for example 1080p MP4 for a good balance between size and sharpness). If you want the sound only, pick an MP3 quality such as 320 kbps. Press <strong>DOWNLOAD</strong> and the file will be saved to your machine.</p>',
      '<h2>Pro tips</h2>',
      '<ul><li>Choose <strong>MP4</strong> for the broadest device compatibility.</li><li>For large playlists, use the dedicated ZIP packaging feature to grab everything in one archive.</li><li>Keep an eye on the live progress rail — it shows speed and estimated time remaining.</li></ul>',
      '<p>That is all there is to it. The whole process takes a few seconds and you end up with a clean, re-usable file that plays offline anywhere.</p>'
    ]
  },
  {
    slug: 'youtube-shorts-downloader-guide',
    title: 'YouTube Shorts Downloader: Save Vertical HD Videos in Seconds',
    excerpt: 'Shorts are quick to make but easy to lose. Learn the fastest way to store vertical 9:16 Shorts as HD video or high-quality audio.',
    category: 'Guides',
    date: '2025-05-30',
    readTime: '4 min',
    tags: ['shorts', 'vertical', 'mp4'],
    body: [
      '<p>YouTube Shorts are everywhere — and because they are short and ephemeral, they are exactly the kind of content you may want to keep for reference, inspiration, or offline viewing.</p>',
      '<h2>How Shorts downloads differ</h2>',
      '<p>Shorts are vertical (9:16) and often capped at 1080p. The downloader detects this automatically, so you get a correctly-oriented file without any manual cropping.</p>',
      '<h2>Downloading a Short</h2>',
      '<p>Copy the Short link (it usually looks like <code>youtube.com/shorts/VIDEO_ID</code>), paste it into TubeDeck, and press <strong>FETCH INFO</strong>. The engine will present video and audio options tailored to the Short — just pick a quality and press <strong>DOWNLOAD</strong>.</p>',
      '<h2>Audio-only from Shorts</h2>',
      '<p>If you only want the sound — for example a trending audio clip — choose an MP3 quality. You will get a compact audio file that is perfect for ringtones or remixes.</p>',
      '<p>Vertical, HD, and ready in seconds — that is the whole Shorts workflow.</p>'
    ]
  },
  {
    slug: 'convert-youtube-to-mp3-320kbps',
    title: 'Convert YouTube to MP3 at 320 kbps: The Complete Guide',
    excerpt: 'Everything you need to know about extracting studio-quality audio from YouTube, including bitrate choices and how to avoid quality loss.',
    category: 'Audio',
    date: '2025-05-18',
    readTime: '5 min',
    tags: ['mp3', 'audio', '320kbps'],
    body: [
      '<p>Sometimes you do not need the video — you just want the music. Converting a YouTube video to MP3 is one of the most common requests, and getting the bitrate right makes all the difference to sound quality.</p>',
      '<h2>Understanding bitrate</h2>',
      '<p>Bitrate is roughly a measure of audio detail. The standard choice is <strong>320 kbps</strong>, the highest MP3 quality, which is indistinguishable from the source for most listeners. Lower options such as 256 or 192 kbps shrink the file but reduce fidelity.</p>',
      '<h2>Picking a format</h2>',
      '<p>For the best balance of quality and file size, choose <strong>MP3 at 320 kbps</strong>. If you are an audiophile or plan to edit the audio, FLAC (lossless) is a better option because it keeps every bit of the original.</p>',
      '<h2>Steps</h2>',
      '<ol><li>Copy the YouTube link.</li><li>Paste it into TubeDeck and press <strong>FETCH INFO</strong>.</li><li>Choose <strong>MP3 320 kbps</strong> (or FLAC for lossless).</li><li>Press <strong>DOWNLOAD</strong> and save the audio file.</li></ol>',
      '<p>That is it. In under a minute you have a clean audio file ready for your playlist, podcast, or editing session.</p>'
    ]
  },
  {
    slug: 'download-entire-youtube-playlists-zip',
    title: 'How to Download an Entire YouTube Playlist as a ZIP Archive',
    excerpt: 'Batch-download all tracks in a playlist at once, get an indexed ZIP with a playlist file and manifest, and never hunt for individual videos again.',
    category: 'Playlists',
    date: '2025-04-22',
    readTime: '6 min',
    tags: ['playlist', 'zip', 'batch'],
    body: [
      '<p>Playlists can run to dozens or even hundreds of videos. Downloading them one by one is tedious. The ZIP packaging feature solves this by grabbing everything and packing it into a single, well-organised archive.</p>',
      '<h2>How it works</h2>',
      '<p>When you paste a playlist link and fetch info, TubeDeck lists every entry with a per-track quality selector. You can pick a master quality for the whole batch or fine-tune individual tracks.</p>',
      '<h2>Selecting tracks</h2>',
      '<p>Use the <strong>Select All</strong> control to include the full list, or tick specific tracks. A live counter shows how many are selected.</p>',
      '<h2>Building the ZIP</h2>',
      '<p>Press <strong>DOWNLOAD AS ZIP</strong>. The engine processes each selected track and packages them into an indexed archive that also contains:</p>',
      '<ul><li>A <code>playlist.m3u</code> playlist file for your media player</li><li>A <code>manifest.json</code> with track metadata</li><li>A <code>README.txt</code> explaining the contents</li></ul>',
      '<h2>Large playlists</h2>',
      '<p>Playlists over 50 tracks are paginated, so you can page through results and select across pages before building your archive.</p>',
      '<p>One click, one organised file — that is the cleanest way to keep a whole playlist offline.</p>'
    ]
  },
  {
    slug: 'is-it-legal-to-download-youtube-videos',
    title: 'Is It Legal to Download YouTube Videos? (2025 Straight Talk)',
    excerpt: 'A balanced, honest look at the legal side of downloading YouTube content, plus practical guidance on what is safe and what to avoid.',
    category: 'Legal',
    date: '2025-04-05',
    readTime: '5 min',
    tags: ['legal', 'copyright', 'fair-use'],
    body: [
      '<p>This is the question people ask most, and the honest answer is: <strong>it depends on what you are downloading and why</strong>. Nobody can give you blanket legal advice, but here is a clear breakdown of the common scenarios.</p>',
      '<h2>Your own content</h2>',
      '<p>Downloading your own videos or content you created is totally fine. You are simply keeping a backup of work you own.</p>',
      '<h2>Creative Commons and public-domain content</h2>',
      '<p>Many creators publish under Creative Commons or release content into the public domain. Downloading and reusing that content is generally permitted, often with attribution.</p>',
      '<h2>Copyrighted content</h2>',
      '<p>Downloading copyrighted music, films, or TV maintained for redistribution, resale, or re-upload is against both YouTube\u2019s terms and copyright law in most jurisdictions. This is where legal trouble starts.</p>',
      '<h2>Personal use</h2>',
      '<p>Keeping a private copy for offline personal viewing is a grey area that varies by country. Some jurisdictions allow limited personal copies; others do not. When in doubt, stick to content you are sure you have the right to use.</p>',
      '<h2>Practical guidance</h2>',
      '<ul><li>Use downloads for personal, offline access — not for redistribution.</li><li>Respect the creator\u2019s intent and channel rules.</li><li>Do not resell or re-upload content you did not create.</li></ul>',
      '<p>This site is a tool. Please use it responsibly and in line with your local laws and YouTube\u2019s terms of service.</p>'
    ]
  },
  {
    slug: 'best-video-quality-settings-offline',
    title: 'Best Video Quality Settings for Offline Viewing',
    excerpt: 'Which resolution and format should you pick? A practical comparison of 4K, 1080p, 720p and more, with file-size trade-offs.',
    category: 'Tips',
    date: '2025-03-12',
    readTime: '4 min',
    tags: ['quality', '4k', '1080p'],
    body: [
      '<p>More resolution is not always better. The right choice depends on your screen, your storage, and your data plan. Here is a simple guide to picking the sweet spot.</p>',
      '<h2>4K (2160p)</h2>',
      '<p>Best on large 4K TVs and monitors. Files are large — expect several GB per hour — so only choose this if you have storage to spare and a screen that can actually show it.</p>',
      '<h2>1080p (Full HD)</h2>',
      '<p>The everyday winner. Great quality on almost every screen, with reasonable file sizes. This is our recommended default.</p>',
      '<h2>720p</h2>',
      '<p>A great choice for phones, tablets, and slower connections. Much smaller files while still looking crisp on small displays.</p>',
      '<h2>360p–480p</h2>',
      '<p>Use these for low-storage devices or when you just need audio-relevant visuals, e.g. a lecture or podcast-style video.</p>',
      '<h2>Format matters too</h2>',
      '<p><strong>MP4</strong> is the safest for compatibility with phones, TVs, and players. MKV and WEBM are also available if you need codec-specific features.</p>',
      '<p>Rule of thumb: 1080p MP4 is the best all-round choice for most people.</p>'
    ]
  }
];

export function findPost(slug) {
  return BLOG_POSTS.find(p => p.slug === slug);
}

// ---------------------------------------------------------------------------
// PAGE RENDERERS
// ---------------------------------------------------------------------------

function blogCard(post) {
  return `
    <article class="content-card">
      <div class="content-card-meta">
        <span class="content-badge">${escapeHtml(post.category)}</span>
        <span class="content-card-meta-text">${escapeHtml(post.readTime)} read</span>
      </div>
      <h3 class="content-card-title">
        <a href="#/blog/${escapeHtml(post.slug)}">${escapeHtml(post.title)}</a>
      </h3>
      <p class="content-card-excerpt">${escapeHtml(post.excerpt)}</p>
      <div class="content-card-footer">
        <span class="content-card-date">${escapeHtml(post.date)}</span>
        <a class="brand-btn-link" href="#/blog/${escapeHtml(post.slug)}">Read guide →</a>
      </div>
    </article>
  `;
}

export function renderBlogIndex() {
  const cards = BLOG_POSTS.map(blogCard).join('');
  return `
    <div class="content-page-wrap">
      <div class="content-page-hero">
        <div class="content-eyebrow">${icons.eye} TUBEDECK GUIDES</div>
        <h1 class="content-h1">Guides &amp; Help Center</h1>
        <p class="content-lede">Practical, original walkthroughs for downloading videos, Shorts, audio, and playlists — plus a plain-English look at the legal side.</p>
      </div>
      <div class="content-grid">
        ${cards}
      </div>
      <div class="content-note">
        <strong>New here?</strong> Start with the <a href="#/blog/how-to-download-youtube-videos">How to download YouTube videos</a> guide.
      </div>
    </div>
  `;
}

export function renderArticle(slug) {
  const post = findPost(slug);
  if (!post) {
    return renderNotFound();
  }
  const tags = post.tags.map(t => `<span class="content-tag">#${escapeHtml(t)}</span>`).join('');
  const body = post.body.join('\n');
  return `
    <div class="content-page-wrap prose-wrap">
      <a class="brand-btn-link back-link" href="#/blog">← All guides</a>
      <div class="content-article-head">
        <div class="content-card-meta">
          <span class="content-badge">${escapeHtml(post.category)}</span>
          <span class="content-card-date">${escapeHtml(post.date)}</span>
          <span class="content-card-date">${escapeHtml(post.readTime)} read</span>
        </div>
        <h1 class="content-h1">${escapeHtml(post.title)}</h1>
        <div class="content-tags">${tags}</div>
      </div>
      <div class="prose">${body}</div>
      <div class="content-cta-box">
        <strong>Want to put this into practice?</strong>
        <a class="tactile-btn orange-accent cta-inline" href="#/">Open the downloader →</a>
      </div>
    </div>
  `;
}

export function renderAbout() {
  return simplePage(
    'About TubeDeck',
    'A fast, browser-based downloader built for creators and offline listeners.',
    `
      <p>TubeDeck is a free, in-browser tool for downloading YouTube videos, Shorts, and playlists. It was built with a single goal: make the process as fast and reliable as possible, without watermarks, without accounts, and without clutter.</p>
      <h2>What we focus on</h2>
      <ul>
        <li><strong>Quality</strong> — up to 4K video and 320 kbps / FLAC audio.</li>
        <li><strong>Batch workflows</strong> — package whole playlists into indexed ZIP archives.</li>
        <li><strong>Transparency</strong> — a live progress rail shows speed and remaining time.</li>
        <li><strong>User privacy</strong> — downloads happen directly on your own device.</li>
      </ul>
      <h2>Who is it for?</h2>
      <p>Creators saving reference clips, teachers preparing offline lessons, travellers building offline libraries, and anyone who prefers to keep a copy of content they love. Use the tool responsibly and in line with your local laws.</p>
    `
  );
}

export function renderContact() {
  return simplePage(
    'Contact & Support',
    'Questions, feedback, or a bug report? We read everything.',
    `
      <p>If you hit a problem, have a feature idea, or just want to say hello, send us a note. For bug reports, please include the link you were using and the browser you are on.</p>
      <div class="contact-methods">
        <div class="contact-method">
          <div class="content-eyebrow">${icons.bolt} GENERAL</div>
          <p>hello@tubedeck.example</p>
        </div>
        <div class="contact-method">
          <div class="content-eyebrow">${icons.alertTriangle} SUPPORT</div>
          <p>support@tubedeck.example</p>
        </div>
      </div>
      <p><em>Please note: we cannot help with downloading content you do not have the right to use.</em></p>
    `
  );
}

export function renderPrivacy() {
  return legalPage(
    'Privacy Policy',
    'Last updated: 2025-06-14',
    `
      <p>This privacy policy explains how TubeDeck handles information when you use this website.</p>
      <h2>What we collect</h2>
      <p>TubeDeck is a client-side tool. Video and playlist data you enter is sent to your backend server only to process a download; we do not store your download history on our servers beyond what is required to complete a single in-flight transfer. Your download history lives in your own browser\u2019s local storage.</p>
      <h2>Cookies and advertising</h2>
      <p>If and when advertising is enabled, third-party ad networks (such as Google AdSense) may use cookies to serve ads relevant to you. You can opt out of personalised advertising via your Google Ads settings. We ask for your consent before loading any ad or tracking scripts.</p>
      <h2>Analytics</h2>
      <p>We may use privacy-respecting, aggregated analytics to understand which guides are useful. No personally identifying data is collected.</p>
      <h2>Third-party links</h2>
      <p>This site may link to external pages. We are not responsible for the privacy practices of those sites.</p>
      <h2>Contact</h2>
      <p>Privacy questions: privacy@tubedeck.example</p>
    `
  );
}

export function renderTerms() {
  return legalPage(
    'Terms of Service',
    'Last updated: 2025-06-14',
    `
      <p>By using TubeDeck you agree to these terms. Please read them carefully.</p>
      <h2>Acceptable use</h2>
      <p>You agree to use this tool only for lawful purposes and in accordance with YouTube\u2019s terms of service and applicable copyright law. Do not use downloads to infringe the rights of others, resell content you do not own, or re-upload protected material.</p>
      <h2>No warranty</h2>
      <p>The tool is provided "as is" without warranties of any kind. We do not guarantee that every video is downloadable, that quality estimates are exact, or that the service will be uninterrupted.</p>
      <h2>Liability</h2>
      <p>To the maximum extent permitted by law, we are not liable for any indirect or consequential loss arising from your use of the tool.</p>
      <h2>Intellectual property</h2>
      <p>All guides, text, and design on this site are our property or used with permission. You may not republish them without permission.</p>
      <h2>Changes</h2>
      <p>We may update these terms from time to time. Continued use after changes means you accept the updated terms.</p>
    `
  );
}

export function renderNotFound() {
  return simplePage(
    'Page not found',
    'The page you are looking for does not exist.',
    `
      <p>It may have moved or never existed. Try heading back to the <a href="#/">downloader</a> or browse the <a href="#/blog">guides</a>.</p>
    `
  );
}

// ---------------------------------------------------------------------------
// HELPERS (kept local so main.js stays lean)
// ---------------------------------------------------------------------------

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function simplePage(title, lede, body) {
  return `
    <div class="content-page-wrap">
      <div class="content-page-hero">
        <div class="content-eyebrow">${icons.sparkles} TUBEDECK</div>
        <h1 class="content-h1">${escapeHtml(title)}</h1>
        <p class="content-lede">${escapeHtml(lede)}</p>
      </div>
      <div class="prose simple-page-box">${body}</div>
    </div>
  `;
}

function legalPage(title, updated, body) {
  return `
    <div class="content-page-wrap">
      <div class="content-page-hero">
        <div class="content-eyebrow">${icons.folder} TUBEDECK LEGAL</div>
        <h1 class="content-h1">${escapeHtml(title)}</h1>
        <div class="content-card-date">${escapeHtml(updated)}</div>
      </div>
      <div class="prose simple-page-box">${body}</div>
    </div>
  `;
}
