import { FindingType, Severity, FindingCategory } from '@hunteros/shared';
import type { Finding } from '@hunteros/shared';
import type { Logger } from '@hunteros/logger';

export interface Detector {
  name: string;
  detect(content: string, filePath: string): Finding[];
}

export class PatternDetector implements Detector {
  name = 'pattern-detector';

  private patterns: Array<{
    type: FindingType;
    severity: Severity;
    category: FindingCategory;
    pattern: RegExp;
    priority: number;
    label: string;
  }>;

  constructor() {
    this.patterns = [
      {
        type: FindingType.DangerousFunction,
        severity: Severity.High,
        category: FindingCategory.InputValidation,
        pattern: /\b(eval|exec|Function\(|setTimeout\s*\(['"`]|setInterval\s*\(['"`])\b/g,
        priority: 80,
        label: 'Dangerous code execution',
      },
      {
        type: FindingType.InformationExposure,
        severity: Severity.Medium,
        category: FindingCategory.ErrorHandling,
        pattern: /console\.(log|debug|info|warn|error)\([^)]*(?:password|secret|token|key|credential)/gi,
        priority: 60,
        label: 'Potential information exposure in logs',
      },
      {
        type: FindingType.InputValidation,
        severity: Severity.High,
        category: FindingCategory.InputValidation,
        pattern: /\.innerHTML\s*=|\.outerHTML\s*=|dangerouslySetInnerHTML|<%\s*=/g,
        priority: 70,
        label: 'Unsafe HTML injection',
      },
      {
        type: FindingType.DatabaseAccess,
        severity: Severity.Critical,
        category: FindingCategory.DataAccess,
        pattern: /\b(raw\s*query|execute\s*\(|\.query\(\s*['"`]|sql\s*`|$query\s*`)/gi,
        priority: 90,
        label: 'Raw database query - possible SQL injection',
      },
      {
        type: FindingType.NetworkAccess,
        severity: Severity.Medium,
        category: FindingCategory.Network,
        pattern: /https?:\/\/[^'"]*(?:localhost|127\.0\.0\.1|0\.0\.0\.0)[^'"]*/gi,
        priority: 30,
        label: 'Hardcoded localhost URL',
      },
      {
        type: FindingType.Configuration,
        severity: Severity.Low,
        category: FindingCategory.Configuration,
        pattern: /cors\s*\(\s*\{\s*origin\s*:\s*['"`]\*/g,
        priority: 50,
        label: 'Permissive CORS configuration',
      },
      {
        type: FindingType.Secrets,
        severity: Severity.Critical,
        category: FindingCategory.Secrets,
        pattern: /(?:aws_access_key_id|aws_secret_access_key|AKIA[0-9A-Z]{16})\b/g,
        priority: 95,
        label: 'Hardcoded AWS credentials',
      },
    ];
  }

  detect(content: string, filePath: string): Finding[] {
    const findings: Finding[] = [];

    for (const { type, severity, category, pattern, priority, label } of this.patterns) {
      const matches = content.matchAll(pattern);
      let matchCount = 0;
      for (const _match of matches) {
        matchCount++;
      }
      if (matchCount > 0) {
        findings.push({
          id: `${filePath}:${type}`,
          type,
          severity,
          message: `${label} detected (${matchCount} occurrence(s))`,
          filePath,
          startLine: 1,
          endLine: 1,
          category,
          reviewPriority: priority,
          metadata: { matchCount },
        });
      }
    }

    return findings;
  }
}

export class CompositeDetector {
  private detectors: Detector[] = [];

  constructor(logger: Logger) {
    this.detectors.push(new PatternDetector());
  }

  register(detector: Detector): void {
    this.detectors.push(detector);
  }

  detectAll(content: string, filePath: string): Finding[] {
    const findings: Finding[] = [];
    for (const detector of this.detectors) {
      try {
        findings.push(...detector.detect(content, filePath));
      } catch {
        continue;
      }
    }
    return findings;
  }
}
