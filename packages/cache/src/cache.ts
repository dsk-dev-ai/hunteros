import Database from 'better-sqlite3';
import { join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import type { Logger } from '@hunteros/logger';

interface CacheEntry<T> {
  key: string;
  value: T;
  expiresAt: number;
  createdAt: number;
}

export class CacheStore {
  private db: Database.Database;
  private logger: Logger;
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor(logger: Logger, dbPath?: string) {
    this.logger = logger;
    const path = dbPath ?? join(process.cwd(), '.hunteros', 'cache.db');
    const dir = path.substring(0, path.lastIndexOf('/'));
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    this.db = new Database(path);
    this.initialize();
    this.cleanupInterval = setInterval(() => this.cleanup(), 3600000);
  }

  private initialize(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache(expires_at);
    `);
  }

  get<T>(key: string): T | undefined {
    const row = this.db.prepare('SELECT value, expires_at FROM cache WHERE key = ?').get(key) as
      | { value: string; expires_at: number }
      | undefined;
    if (!row) return undefined;
    if (row.expires_at > 0 && row.expires_at < Date.now()) {
      this.db.prepare('DELETE FROM cache WHERE key = ?').run(key);
      return undefined;
    }
    try {
      return JSON.parse(row.value) as T;
    } catch {
      return undefined;
    }
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    const expiresAt = ttlMs ? Date.now() + ttlMs : 0;
    this.db.prepare(
      'INSERT OR REPLACE INTO cache (key, value, expires_at, created_at) VALUES (?, ?, ?, ?)',
    ).run(key, JSON.stringify(value), expiresAt, Date.now());
  }

  delete(key: string): void {
    this.db.prepare('DELETE FROM cache WHERE key = ?').run(key);
  }

  has(key: string): boolean {
    const row = this.db.prepare('SELECT expires_at FROM cache WHERE key = ?').get(key) as
      | { expires_at: number }
      | undefined;
    if (!row) return false;
    if (row.expires_at > 0 && row.expires_at < Date.now()) {
      this.db.prepare('DELETE FROM cache WHERE key = ?').run(key);
      return false;
    }
    return true;
  }

  clear(): void {
    this.db.prepare('DELETE FROM cache').run();
  }

  private cleanup(): void {
    const result = this.db.prepare('DELETE FROM cache WHERE expires_at > 0 AND expires_at < ?').run(Date.now());
    if (result.changes > 0) {
      this.logger.debug(`Cleaned up ${result.changes} expired cache entries`);
    }
  }

  close(): void {
    clearInterval(this.cleanupInterval);
    this.db.close();
  }
}
