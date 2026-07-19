import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { RepositoryManager } from '../src/repository-manager.js';

describe('RepositoryManager', () => {
  const manager = new RepositoryManager();

  it('should open local repository (self)', async () => {
    const repoPath = join(import.meta.dirname, '..', '..', '..');
    const report = await manager.open(repoPath);
    expect(report).toBeDefined();
    expect(report.name).toBe('hunteros');
    expect(report.stats.totalFiles).toBeGreaterThan(0);
  });

  it('should compute stats', async () => {
    const repoPath = join(import.meta.dirname, '..', '..', '..');
    const report = await manager.open(repoPath);
    expect(report.stats.totalFiles).toBeGreaterThan(0);
    expect(report.stats.languages).toBeDefined();
    expect(Object.keys(report.stats.languages).length).toBeGreaterThan(0);
  });

  it('should detect package manager', async () => {
    const repoPath = join(import.meta.dirname, '..', '..', '..');
    const report = await manager.open(repoPath);
    expect(report.stats.packageManager).toBeDefined();
  });
});
