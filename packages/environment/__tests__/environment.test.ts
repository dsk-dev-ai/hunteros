import { describe, it, expect } from 'vitest';
import { EnvironmentDetector } from '../src/environment-detector.js';

describe('EnvironmentDetector', () => {
  const detector = new EnvironmentDetector();

  it('should detect environment', async () => {
    const report = await detector.detect();
    expect(report).toBeDefined();
    expect(report.os).toBeDefined();
    expect(report.shell).toBeDefined();
    expect(report.architecture).toBeDefined();
    expect(report.cpu).toBeDefined();
    expect(report.ram).toBeDefined();
    expect(report.docker).toBeDefined();
    expect(report.runtimes).toBeDefined();
    expect(report.timestamp).toBeDefined();
  });

  it('should detect OS platform', async () => {
    const report = await detector.detect();
    expect(['linux', 'darwin', 'win32']).toContain(report.os.platform);
  });

  it('should detect CPU cores', async () => {
    const report = await detector.detect();
    expect(report.cpu.cores).toBeGreaterThan(0);
  });

  it('should detect RAM', async () => {
    const report = await detector.detect();
    expect(report.ram.totalGB).toBeGreaterThan(0);
  });

  it('should detect Node.js runtime', async () => {
    const report = await detector.detect();
    expect(report.runtimes.nodeVersion).toBeTruthy();
  });

  it('should get report JSON', async () => {
    const report = await detector.getReportJson();
    expect(report).toBeDefined();
    expect(report.os).toBeDefined();
  });
});
