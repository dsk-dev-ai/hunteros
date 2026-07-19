import { describe, it, expect } from 'vitest';
import { ConfigAuditor } from '../src/config-auditor.js';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';

describe('ConfigAuditor', () => {
  const auditor = new ConfigAuditor();

  it('should audit repository config files', async () => {
    const repoPath = join(import.meta.dirname, '..', '..', '..');
    const report = await auditor.audit(repoPath);
    expect(report).toBeDefined();
    expect(report.timestamp).toBeTruthy();
  });

  it('should find Dockerfile issues', async () => {
    const tmpDir = join(tmpdir(), `hunteros-test-${randomUUID()}`);
    mkdirSync(tmpDir, { recursive: true });
    writeFileSync(join(tmpDir, 'Dockerfile'), 'FROM node\nRUN apt-get update\nCOPY . /app\n');
    const report = await auditor.audit(tmpDir);
    const dockerFindings = report.findings.filter((f) => f.type === 'dockerfile');
    expect(dockerFindings.length).toBeGreaterThan(0);
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should find env file issues', async () => {
    const tmpDir = join(tmpdir(), `hunteros-test-${randomUUID()}`);
    mkdirSync(tmpDir, { recursive: true });
    writeFileSync(join(tmpDir, '.env'), 'SECRET_KEY=abc123\nDATABASE_URL=postgres://localhost/db\n');
    const report = await auditor.audit(tmpDir);
    const envFindings = report.findings.filter((f) => f.type === 'env-file');
    expect(envFindings.length).toBeGreaterThan(0);
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should generate summary', async () => {
    const tmpDir = join(tmpdir(), `hunteros-test-${randomUUID()}`);
    mkdirSync(tmpDir, { recursive: true });
    writeFileSync(join(tmpDir, 'Dockerfile'), 'FROM node:20\n');
    writeFileSync(join(tmpDir, '.env'), 'API_KEY=test\n');
    const report = await auditor.audit(tmpDir);
    expect(report.summary).toBeDefined();
    expect(typeof report.summary.critical).toBe('number');
    expect(typeof report.summary.high).toBe('number');
    rmSync(tmpDir, { recursive: true, force: true });
  });
});
