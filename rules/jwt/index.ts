import type { ASTNode, Finding } from '@hunteros/shared';
import { FindingType, Severity, FindingCategory } from '@hunteros/shared';

export function analyzeJWT(nodes: ASTNode[], filePath: string): Finding[] {
  const findings: Finding[] = [];
  const content = nodes.map((n) => n.name).join('\n');

  if (/jwt|jsonwebtoken|jose/.test(content)) {
    if (/jwt\.verify|verify\(/.test(content) === false) {
      findings.push({
        id: `${filePath}:jwt:no-verify`,
        type: FindingType.AuthLogic,
        severity: Severity.Critical,
        message: 'JWT used without verification',
        filePath, startLine: 1, endLine: 1,
        category: FindingCategory.Authentication,
        reviewPriority: 95,
        metadata: {},
      });
    }
    if (/jwtSecret|JWT_SECRET|process\.env\.JWT/.test(content) === false) {
      findings.push({
        id: `${filePath}:jwt:no-secret`,
        type: FindingType.Configuration,
        severity: Severity.High,
        message: 'JWT secret not found in environment variables',
        filePath, startLine: 1, endLine: 1,
        category: FindingCategory.Secrets,
        reviewPriority: 75,
        metadata: {},
      });
    }
  }

  return findings;
}
