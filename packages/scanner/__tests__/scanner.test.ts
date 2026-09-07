import { FindingCategory, Severity } from '@hunteros/shared';
import type { ScanTarget, VulnerabilityFinding } from '@hunteros/shared';
import { describe, expect, it } from 'vitest';
import { ResultTriage, ToolRunner, VulnerabilityScanner, validateTarget } from '../src/index.js';
import type { ScanProfile } from '../src/index.js';

describe('ToolRunner', () => {
  const runner = new ToolRunner();

  it('should run an executable with an argument array', () => {
    const result = runner.run('echo', ['hello']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('hello');
  });

  it('should pass arguments verbatim without shell interpretation', () => {
    const result = runner.run('echo', ['foo; id']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('foo; id');
    expect(result.stdout).not.toContain('uid=');
  });
});

describe('validateTarget', () => {
  it.each([
    ['host', 'host; rm -rf /'],
    ['host', 'host | id'],
    ['host', 'host && id'],
    ['host', 'host`id`'],
    ['host', 'a$(id)'],
    ['host', 'host > /tmp/pwn'],
    ['host', 'host < /etc/passwd'],
    ['host', 'evil host'],
    ['host', 'host\nid'],
    ['url', 'https://example.com?x=1&y=2'],
    ['url', 'https://example.com;rm -rf /'],
    ['host', ''],
  ])('rejects malicious target of type %s: %s', (type: string, value: string) => {
    expect(() => validateTarget({ type: type as ScanTarget['type'], value })).toThrow();
  });

  it('accepts legitimate targets formatted per type', () => {
    expect(() => validateTarget({ type: 'host', value: 'example.com' })).not.toThrow();
    expect(() => validateTarget({ type: 'domain', value: 'sub.example.com' })).not.toThrow();
    expect(() => validateTarget({ type: 'ip', value: '10.0.0.1' })).not.toThrow();
    expect(() => validateTarget({ type: 'ip', value: '2001:db8::1' })).not.toThrow();
    expect(() => validateTarget({ type: 'network', value: '10.0.0.0/8' })).not.toThrow();
    expect(() =>
      validateTarget({ type: 'url', value: 'https://example.com/path?id=1' }),
    ).not.toThrow();
  });
});

describe('ResultTriage', () => {
  const triage = new ResultTriage();

  it('should triage critical findings as real bugs', () => {
    const findings: VulnerabilityFinding[] = [
      {
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
      },
    ];
    const results = triage.triage(findings);
    expect(results[0]!.isRealBug).toBe(true);
    expect(results[0]!.priority).toBe(100);
  });

  it('should mark findings with CVE as real bugs', () => {
    const findings: VulnerabilityFinding[] = [
      {
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
      },
    ];
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
    const result = runner.run('echo', ['22/tcp open ssh']);
    expect(result.stdout).toContain('open');
  });

  it('should reject an injected target before running any tool', async () => {
    const profile: ScanProfile = {
      name: 'test',
      description: '',
      tools: ['nmap'],
      targets: [],
      timeout: 5000,
    };
    await expect(scanner.scan([{ type: 'host', value: 'foo; id' }], profile)).rejects.toThrow(
      /contains shell metacharacters or whitespace/,
    );
  });

  it('should scan a validated target without shell interpretation', async () => {
    const profile: ScanProfile = {
      name: 'test',
      description: '',
      tools: [],
      targets: [],
      timeout: 5000,
    };
    const report = await scanner.scan([{ type: 'host', value: 'example.com' }], profile);
    expect(report.toolResults).toHaveLength(0);
    expect(report.summary.totalFindings).toBe(0);
    expect(report.summary.confirmedBugs).toBe(0);
  });
});
