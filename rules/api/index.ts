import type { ASTNode, Finding } from '@hunteros/shared';
import { FindingType, Severity, FindingCategory } from '@hunteros/shared';

export function analyzeAPI(nodes: ASTNode[], filePath: string): Finding[] {
  const findings: Finding[] = [];
  const content = nodes.map((n) => n.name).join('\n');

  if (/rate(?:[-_]?limit)?|throttle|helmet|cors/.test(content)) {
    findings.push({
      id: `${filePath}:api:security`,
      type: FindingType.Configuration,
      severity: Severity.Medium,
      message: 'API security middleware detected',
      filePath, startLine: 1, endLine: 1,
      category: FindingCategory.Configuration,
      reviewPriority: 40,
      metadata: {},
    });
  }

  if (!/helmet|cors|rate/.test(content)) {
    findings.push({
      id: `${filePath}:api:missing-security`,
      type: FindingType.Configuration,
      severity: Severity.Low,
      message: 'No API security middleware detected',
      filePath, startLine: 1, endLine: 1,
      category: FindingCategory.Configuration,
      reviewPriority: 30,
      metadata: {},
    });
  }

  return findings;
}
