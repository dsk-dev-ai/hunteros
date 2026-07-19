import { describe, it, expect } from 'vitest';
import { ToolDetector } from '../src/tool-detector.js';

describe('ToolDetector', () => {
  const detector = new ToolDetector();

  it('should detect tools', async () => {
    const report = await detector.detect();
    expect(report).toBeDefined();
    expect(report.tools).toBeInstanceOf(Array);
    expect(report.totalAvailable).toBeGreaterThan(0);
  });

  it('should detect Node.js', async () => {
    const report = await detector.detect();
    const node = report.tools.find((t) => t.name === 'Node.js');
    expect(node).toBeDefined();
    expect(node!.installed).toBe(true);
    expect(node!.version).toBeTruthy();
  });

  it('should detect Git', async () => {
    const report = await detector.detect();
    const git = report.tools.find((t) => t.name === 'Git');
    expect(git).toBeDefined();
    expect(git!.installed).toBe(true);
  });

  it('should have timestamp', async () => {
    const report = await detector.detect();
    expect(report.timestamp).toBeTruthy();
  });
});
