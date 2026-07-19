import type { ASTNode, Finding, FrameworkInfo } from '@hunteros/shared';
import { FindingType, Severity, FindingCategory } from '@hunteros/shared';

export function analyzeExpress(nodes: ASTNode[], filePath: string): Finding[] {
  const findings: Finding[] = [];
  const content = nodes.map((n) => n.name).join('\n');
  const lines = content.split('\n');

  const routeMethods = ['get', 'post', 'put', 'delete', 'patch', 'options'];
  for (const method of routeMethods) {
    const routeRegex = new RegExp(`\\.${method}\\s*\\(\\s*['"]`);
    for (let i = 0; i < lines.length; i++) {
      if (routeRegex.test(lines[i]!)) {
        findings.push({
          id: `${filePath}:express:route:${i}`,
          type: FindingType.ApiRoute,
          severity: Severity.Medium,
          message: `Express route handler: ${method.toUpperCase()}`,
          filePath, startLine: i + 1, endLine: i + 1,
          category: FindingCategory.InputValidation,
          reviewPriority: 40,
          metadata: { method },
        });
      }
    }
  }

  if (/app\.use\(/.test(content) || /router\.use\(/.test(content)) {
    findings.push({
      id: `${filePath}:express:middleware`,
      type: FindingType.AuthLogic,
      severity: Severity.Medium,
      message: 'Express middleware registered - verify ordering and authentication',
      filePath, startLine: 1, endLine: 1,
      category: FindingCategory.Authentication,
      reviewPriority: 50,
      metadata: {},
    });
  }

  if (/res\.(send|json|render)\(/.test(content)) {
    findings.push({
      id: `${filePath}:express:response`,
      type: FindingType.ApiRoute,
      severity: Severity.Low,
      message: 'Express response handler',
      filePath, startLine: 1, endLine: 1,
      category: FindingCategory.InputValidation,
      reviewPriority: 20,
      metadata: {},
    });
  }

  if (/app\.(listen|server)/.test(content)) {
    findings.push({
      id: `${filePath}:express:server`,
      type: FindingType.NetworkAccess,
      severity: Severity.Low,
      message: 'Express server listener',
      filePath, startLine: 1, endLine: 1,
      category: FindingCategory.Network,
      reviewPriority: 10,
      metadata: {},
    });
  }

  return findings;
}
