import { describe, it, expect } from 'vitest';
import { PatternDetector } from '../src/detector.js';

describe('PatternDetector', () => {
  const detector = new PatternDetector();

  it('should detect dangerous functions', () => {
    const findings = detector.detect('eval(userInput)', 'test.js');
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.some((f) => f.type === 'dangerous_function')).toBe(true);
  });

  it('should detect SQL injection vectors', () => {
    const findings = detector.detect('db.execute("SELECT * FROM users WHERE id = " + userInput)', 'test.js');
    expect(findings.length).toBeGreaterThan(0);
  });

  it('should not flag safe code', () => {
    const findings = detector.detect('const x = 1 + 2;', 'safe.js');
    const dangerFindings = findings.filter((f) => f.reviewPriority > 50);
    expect(dangerFindings.length).toBe(0);
  });
});
