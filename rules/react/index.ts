import type { ASTNode, Finding } from '@hunteros/shared';
import { FindingCategory, FindingType, Severity } from '@hunteros/shared';

export function analyzeReact(nodes: ASTNode[], filePath: string): Finding[] {
  const findings: Finding[] = [];
  const content = nodes.map((n) => n.name).join('\n');

  if (/dangerouslySetInnerHTML/.test(content)) {
    findings.push({
      id: `${filePath}:react:xss`,
      type: FindingType.InputValidation,
      severity: Severity.Critical,
      message: 'dangerouslySetInnerHTML detected - XSS risk',
      filePath,
      startLine: 1,
      endLine: 1,
      category: FindingCategory.InputValidation,
      reviewPriority: 90,
      metadata: {},
    });
  }

  if (/eval\(|new Function\(/.test(content)) {
    findings.push({
      id: `${filePath}:react:eval`,
      type: FindingType.DangerousFunction,
      severity: Severity.High,
      message: 'eval or Function constructor detected',
      filePath,
      startLine: 1,
      endLine: 1,
      category: FindingCategory.InputValidation,
      reviewPriority: 80,
      metadata: {},
    });
  }

  if (/localStorage|sessionStorage/.test(content)) {
    findings.push({
      id: `${filePath}:react:storage`,
      type: FindingType.Secrets,
      severity: Severity.Medium,
      message: 'Browser storage access - sensitive data exposure risk',
      filePath,
      startLine: 1,
      endLine: 1,
      category: FindingCategory.Secrets,
      reviewPriority: 50,
      metadata: {},
    });
  }

  if (/useEffect\s*\(/.test(content)) {
    const matches = content.match(/useEffect\s*\(/g);
    const count = matches?.length ?? 0;
    findings.push({
      id: `${filePath}:react:effect`,
      type: FindingType.InformationExposure,
      severity: Severity.Low,
      message: `${count} useEffect hook(s) - review side effects`,
      filePath,
      startLine: 1,
      endLine: 1,
      category: FindingCategory.Other,
      reviewPriority: 10,
      metadata: { count },
    });
  }

  return findings;
}
