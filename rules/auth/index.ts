import type { ASTNode, Finding } from '@hunteros/shared';
import { FindingType, Severity, FindingCategory } from '@hunteros/shared';

export function analyzeAuth(nodes: ASTNode[], filePath: string): Finding[] {
  const findings: Finding[] = [];
  const content = nodes.map((n) => n.name).join('\n');

  if (/\bpassword\b/i.test(content)) {
    findings.push({
      id: `${filePath}:auth:password`,
      type: FindingType.Secrets,
      severity: Severity.High,
      message: 'Password handling detected - verify storage and transmission',
      filePath, startLine: 1, endLine: 1,
      category: FindingCategory.Secrets,
      reviewPriority: 80,
      metadata: {},
    });
  }

  if (/session|cookie/.test(content) && /secret|secure|httpOnly/.test(content) === false) {
    findings.push({
      id: `${filePath}:auth:session-config`,
      type: FindingType.AuthLogic,
      severity: Severity.Medium,
      message: 'Session/cookie used without security configuration',
      filePath, startLine: 1, endLine: 1,
      category: FindingCategory.Authentication,
      reviewPriority: 60,
      metadata: {},
    });
  }

  return findings;
}
