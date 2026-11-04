import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.resolve(__dirname, '..', 'server.js');
const PORT = 5199; // dedicated test port

let serverProc;

before(() => {
  // Boot the real server on a test port with persistence disabled.
  return new Promise((resolve, reject) => {
    serverProc = spawn(process.execPath, [serverPath], {
      env: { ...process.env, PORT: String(PORT), PERSIST_JOBS: 'false', ENABLE_RATE_LIMIT: 'false', LOG_LEVEL: 'info' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    serverProc.stdout.on('data', (d) => {
      out += d.toString();
      if (out.includes('Backend Online') || out.includes('online')) {
        // give the listener a moment
        setTimeout(resolve, 300);
      }
    });
    serverProc.on('exit', (code) => reject(new Error(`server exited early with ${code}`)));
    setTimeout(() => reject(new Error('server boot timeout')), 8000);
  });
});

after(() => {
  if (serverProc && !serverProc.killed) serverProc.kill();
});

async function api(pathname, opts = {}) {
  const res = await fetch(`http://localhost:${PORT}${pathname}`, {
    method: opts.method || 'GET',
    headers: { 'content-type': 'application/json', ...(opts.headers || {}) },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* non-JSON */ }
  return { status: res.status, json, text: await res.text().catch(() => '') };
}

test('GET /api/health returns ok byte both engines present', async () => {
  const { status, json } = await api('/api/health');
  assert.equal(status, 200);
  assert.equal(json.status, 'ok');
  assert.equal(json.ytdlp, true);
});

test('POST /api/info validates URL', async () => {
  const { status, json } = await api('/api/info', { method: 'POST', body: { url: 'https://evil.com/x' } });
  assert.equal(status, 400);
  assert.match(json.error, /Only YouTube URLs/);
});

test('POST /api/info requires url', async () => {
  const { status } = await api('/api/info', { method: 'POST', body: {} });
  assert.equal(status, 400);
});

test('POST /api/download/start validates URL and returns jobId', async () => {
  // A valid YouTube URL must be accepted (job created async) — 200 + jobId.
  const { status, json } = await api('/api/download/start', {
    method: 'POST',
    body: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', quality: '360p', title: 'Test' },
  });
  assert.equal(status, 200);
  assert.ok(json.jobId);
  // An invalid URL must be rejected before any spawn.
  const bad = await api('/api/download/start', { method: 'POST', body: { url: 'ftp://evil.com' } });
  assert.equal(bad.status, 400);
  assert.match(bad.json.error, /Only YouTube URLs/);
});

test('GET /api/download/status/:id returns 404 for unknown job', async () => {
  const { status } = await api('/api/download/status/nope');
  assert.equal(status, 404);
});

test('unknown api route -> 404 JSON', async () => {
  const { status, json } = await api('/api/does-not-exist');
  assert.equal(status, 404);
  assert.equal(json.error, 'Not found');
});
