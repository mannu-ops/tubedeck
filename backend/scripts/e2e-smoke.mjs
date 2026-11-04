// Real end-to-end smoke test: hits the LIVE backend with a real YouTube URL.
// Usage: node scripts/e2e-smoke.mjs [videoUrl]
// NOTE: requires the backend to be running (npm start in backend/).
import { writeFileSync } from 'node:fs';

const BASE = process.env.BACKEND_URL || 'http://localhost:5000';
const URL = process.argv[2] || 'https://www.youtube.com/watch?v=aqz-KE-bPso';

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text };
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text };
}

function step(name, cond, extra = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name} ${extra}`);
  if (!cond) process.exitCode = 1;
}

console.log('=== Real YouTube end-to-end smoke ===');
console.log(`Backend: ${BASE}`);
console.log(`Video:   ${URL}\n`);

// 1. info
const info = await post('/api/info', { url: URL });
step('GET /api/info returns 200', info.status === 200, `(http ${info.status})`);
const title = info.json && info.json.title;
step('info parsed a real title', !!title, `title="${(title || '').slice(0, 50)}"`);
const q = info.json && info.json.availableQualities;
step('info returned qualities', Array.isArray(q) && q.length > 0, `(${(q || []).length} qualities)`);

if (!info.json || !info.json.title) {
  console.log('\nCould not inspect video (network/youtube may be unreachable). Aborting download test.');
  process.exit(process.exitCode || 1);
}

// 2. start download
const start = await post('/api/download/start', {
  url: URL,
  quality: 'video',
  videoQuality: q.find(x => x.label && /1080/.test(x.label)) || q[0],
  muxAudio: false,
});
step('POST /api/download/start returns 200', start.status === 200, `(http ${start.status})`);
const jobId = start.json && start.json.jobId;
const token = start.json && start.json.token;
step('job created with id+token', !!jobId && !!token, `job=${jobId}`);

if (!jobId || !token) {
  console.log('\nDownload start failed. Aborting.');
  process.exit(process.exitCode || 1);
}

// 3. poll status until terminal
const deadline = Date.now() + 90000; // 90s
let last = null;
while (Date.now() < deadline) {
  const st = await get(`/api/download/status/${jobId}?token=${encodeURIComponent(token)}`);
  last = st.json || {};
  if (last.status === 'ready') { step('download reached ready', true); break; }
  if (last.status === 'error' || last.status === 'failed') {
    step('download did NOT error', false, `status=${last.status} err=${last.error}`);
    writeFileSync('e2e-last-status.json', JSON.stringify(last, null, 2));
    process.exit(1);
  }
  await new Promise(r => setTimeout(r, 2500));
}

if (!last || last.status !== 'ready') {
  console.log('\nTimed out waiting for ready. Last status:');
  console.log(JSON.stringify(last, null, 2));
  process.exit(1);
}

// 4. fetch the file (headers only to avoid huge writes) — token required
const fileRes = await fetch(`${BASE}/api/download/file/${jobId}?token=${encodeURIComponent(token)}`);
step('GET /api/download/file (with token) returns 200', fileRes.status === 200, `(http ${fileRes.status})`);
const contentLength = fileRes.headers.get('content-length');
step('served file has bytes', !!contentLength && Number(contentLength) > 1000, `(${contentLength} bytes)`);
if (!fileRes.ok) {
  console.log('\nFile fetch failed. Full response:');
  console.log(await fileRes.text());
}

// 5. unauthorized file access must be denied
const noTok = await fetch(`${BASE}/api/download/file/${jobId}`);
step('file without token is denied', noTok.status === 404, `(http ${noTok.status})`);

console.log('\n=== Done ===');
writeFileSync('e2e-result.json', JSON.stringify({ ok: process.exitCode !== 1, url: URL, jobId, title }, null, 2));
