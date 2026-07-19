import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CacheStore } from '../src/cache.js';
import { createLogger } from '@hunteros/logger';
import { LogLevel } from '@hunteros/shared';
import { unlinkSync, existsSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('CacheStore', () => {
  const logger = createLogger({ level: LogLevel.Silent });
  const testDir = mkdtempSync(join(tmpdir(), 'hunteros-cache-test-'));
  const testDb = join(testDir, 'cache.db');
  let cache: CacheStore;

  beforeEach(() => {
    if (existsSync(testDb)) unlinkSync(testDb);
    cache = new CacheStore(logger, testDb);
  });

  afterEach(() => {
    cache.close();
    if (existsSync(testDb)) unlinkSync(testDb);
  });

  it('should store and retrieve values', () => {
    cache.set('test-key', { foo: 'bar' });
    expect(cache.get('test-key')).toEqual({ foo: 'bar' });
  });

  it('should return undefined for missing keys', () => {
    expect(cache.get('nonexistent')).toBeUndefined();
  });

  it('should respect TTL', async () => {
    cache.set('ttl-key', 'value', 1000);
    expect(cache.get('ttl-key')).toBe('value');
    await new Promise((r) => setTimeout(r, 1100));
    expect(cache.get('ttl-key')).toBeUndefined();
  });

  it('should delete keys', () => {
    cache.set('del-key', 'value');
    expect(cache.has('del-key')).toBe(true);
    cache.delete('del-key');
    expect(cache.has('del-key')).toBe(false);
  });

  it('should clear all keys', () => {
    cache.set('key1', 'val1');
    cache.set('key2', 'val2');
    cache.clear();
    expect(cache.has('key1')).toBe(false);
    expect(cache.has('key2')).toBe(false);
  });
});
