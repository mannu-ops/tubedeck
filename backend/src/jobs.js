import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';
import { logger } from './logger.js';
import { parseJobId } from './utils.js';

/**
 * Download job store with optional disk persistence.
 *
 * Jobs are kept in memory. When PERSIST_JOBS is on, we also write a snapshot
 * to data/jobs.json so that finished/ready jobs survive a server restart.
 * In-flight (downloading) jobs are downgraded to 'error' on boot because child
 * yt-dlp processes cannot be resumed.
 */
export class JobStore {
  constructor() {
    /** @type {Map<string, object>} */
    this.map = new Map();
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(config.jobsFile)) {
        const saved = JSON.parse(fs.readFileSync(config.jobsFile, 'utf8'));
        for (const [id, job] of Object.entries(saved)) {
          if (job && job.id) {
            if (job.status === 'downloading') {
              job.status = 'error';
              job.error = 'Server restarted while this download was in progress; please retry.';
            }
            this.map.set(id, job);
          }
        }
        if (this.map.size) logger.info(`Loaded ${this.map.size} persisted job(s) from disk`);
      }
    } catch (err) {
      logger.warn('Could not load persisted jobs', { error: err.message });
    }
  }

  persist() {
    if (!config.persistJobs) return;
    try {
      const snapshot = {};
      for (const [id, job] of this.map) snapshot[id] = this.#strip(job);
      fs.writeFileSync(config.jobsFile, JSON.stringify(snapshot, null, 2));
    } catch (err) {
      logger.warn('Could not persist jobs', { error: err.message });
    }
  }

  /** Remove fields that must not survive a restart (child proc handles, buffers). */
  #strip(job) {
    const copy = { ...job };
    delete copy.proc;
    delete copy.stdout;
    delete copy.stderr;
    return copy;
  }

  create(job) {
    this.map.set(job.id, job);
    this.persist();
    return job;
  }

  get(id) {
    return this.map.get(id);
  }

  has(id) {
    return this.map.has(id);
  }

  update(id, patch) {
    const job = this.map.get(id);
    if (job) {
      Object.assign(job, patch);
      this.persist();
    }
    return job;
  }

  delete(id) {
    const removed = this.map.delete(id);
    if (removed) this.persist();
    return removed;
  }

  /** Remove stale (old) jobs and orphaned temp files. Runs at boot and on interval. */
  sweep() {
    const now = Date.now();
    const staleMs = config.jobTtlMs;

    // 1) Purge stale jobs (file cleanup attempted).
    for (const [id, job] of this.map) {
      const age = now - (job.createdAt || now);
      if (age > staleMs) {
        this.#tryUnlink(job.filePath);
        this.map.delete(id);
      }
    }

    // 2) Remove orphaned disk files with no live job, older than threshold.
    try {
      for (const name of fs.readdirSync(config.tempDir)) {
        const full = path.join(config.tempDir, name);
        let stat;
        try { stat = fs.statSync(full); } catch { continue; }
        if (!stat.isFile()) continue;
        if (now - stat.mtimeMs <= staleMs) continue;
        const id = parseJobId(name);
        if (id && this.map.has(id)) continue; // live job
        this.#tryUnlink(full);
      }
    } catch { /* temp dir missing */ }

    this.persist();
  }

  #tryUnlink(file) {
    if (!file) return;
    try {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    } catch { /* best-effort */ }
  }
}

export const jobStore = new JobStore();
