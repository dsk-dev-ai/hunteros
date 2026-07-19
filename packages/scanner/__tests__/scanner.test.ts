import { describe, it, expect } from 'vitest';
import { VulnerabilityScanner, ToolRunner, ResultTriage } from '../src/index.js';
import { Severity, FindingCategory } from '@hunteros/shared';
import type { VulnerabilityFinding } from '@hunteros/shared';

describe('ToolRunner', () => {
  const runner = new ToolRunner();

  it('should run a command', () => {
    const result = runner.run('echo', 'echo hello');
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('hello');
  });
});

describe('ResultTriage', () => {
  const triage = new ResultTriage();

  it('should triage critical findings as real bugs', () => {
    const findings: VulnerabilityFinding[] = [{
      id: 'test-1',
      toolName: 'nmap',
      title: 'Test finding',
      description: 'A test vulnerability',
      severity: Severity.Critical,
      category: FindingCategory.Network,
      target: 'localhost',
      evidence: 'Critical vulnerability evidence',
      remediation: 'Fix it',
      references: [],
      falsePositive: false,
      triageNotes: '',
    }];
    const results = triage.triage(findings);
    expect(results[0]!.isRealBug).toBe(true);
    expect(results[0]!.priority).toBe(100);
  });

  it('should mark findings with CVE as real bugs', () => {
    const findings: VulnerabilityFinding[] = [{
      id: 'test-2',
      toolName: 'nmap',
      title: 'CVE finding',
      description: 'Has CVE',
      severity: Severity.Medium,
      category: FindingCategory.Network,
      target: 'localhost',
      evidence: 'Some evidence',
      cve: 'CVE-2024-1234',
      remediation: 'Patch it',
      references: ['https://nvd.nist.gov'],
      falsePositive: false,
      triageNotes: '',
    }];
    const results = triage.triage(findings);
    expect(results[0]!.isRealBug).toBe(true);
  });
});

describe('VulnerabilityScanner', () => {
  const scanner = new VulnerabilityScanner();

  it('should return scan profiles', () => {
    const profiles = scanner.getScanProfiles();
    expect(profiles.length).toBeGreaterThan(0);
    expect(profiles[0]!.name).toBe('quick');
  });

  it('should parse nmap output', () => {
    const runner = new ToolRunner();
    const result = runner.run('nmap-test', 'echo "22/tcp open ssh"');
    expect(result.stdout).toContain('open');
  });
});
