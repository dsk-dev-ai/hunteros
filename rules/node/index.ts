import type { ASTNode, Finding } from '@hunteros/shared';
import { FindingType, Severity, FindingCategory } from '@hunteros/shared';

export function analyzeNodeJS(nodes: ASTNode[], filePath: string): Finding[] {
  const findings: Finding[] = [];
  const content = nodes.map((n) => n.name).join('\n');

  if (/child_process/.test(content) || /exec\(|execSync\(|spawn\(/.test(content)) {
    findings.push({
      id: `${filePath}:node:exec`,
      type: FindingType.DangerousFunction,
      severity: Severity.Critical,
      message: 'Process execution detected - command injection risk',
      filePath, startLine: 1, endLine: 1,
      category: FindingCategory.InputValidation,
      reviewPriority: 95,
      metadata: {},
    });
  }

  if (/cluster\.fork|worker_threads/.test(content)) {
    findings.push({
      id: `${filePath}:node:worker`,
      type: FindingType.NetworkAccess,
      severity: Severity.Low,
      message: 'Worker process detected',
      filePath, startLine: 1, endLine: 1,
      category: FindingCategory.Other,
      reviewPriority: 20,
      metadata: {},
    });
  }

  return findings;
}
