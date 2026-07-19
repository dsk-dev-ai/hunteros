import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { DependencyAuditor } from '../src/dependency-auditor.js';

describe('DependencyAuditor', () => {
  const auditor = new DependencyAuditor();

  it('should audit project dependencies', async () => {
    const repoPath = join(import.meta.dirname, '..', '..', '..');
    const report = await auditor.audit(repoPath);
    expect(report).toBeDefined();
    expect(report.timestamp).toBeTruthy();
  });

  it('should detect package manager', async () => {
    const repoPath = join(import.meta.dirname, '..', '..', '..');
    const report = await auditor.audit(repoPath);
    expect(report.packageManager).toBe('pnpm');
  });

  it('should collect dependencies', async () => {
    const repoPath = join(import.meta.dirname, '..', '..', '..');
    const report = await auditor.audit(repoPath);
    expect(report.dependencies).toBeInstanceOf(Array);
    expect(report.totalDependencies + report.totalDevDependencies).toBeGreaterThan(0);
  });

  it('should generate license summary', async () => {
    const repoPath = join(import.meta.dirname, '..', '..', '..');
    const report = await auditor.audit(repoPath);
    expect(report.licenses).toBeInstanceOf(Array);
  });
});
