import type { ASTNode, Finding } from '@hunteros/shared';
import { FindingType, Severity, FindingCategory } from '@hunteros/shared';

export function analyzeDatabase(nodes: ASTNode[], filePath: string): Finding[] {
  const findings: Finding[] = [];
  const content = nodes.map((n) => n.name).join('\n');

  if (/\b(raw|execute|query)\s*\(/.test(content)) {
    findings.push({
      id: `${filePath}:db:raw-query`,
      type: FindingType.DatabaseAccess,
      severity: Severity.Critical,
      message: 'Raw database query - potential SQL injection',
      filePath, startLine: 1, endLine: 1,
      category: FindingCategory.DataAccess,
      reviewPriority: 95,
      metadata: {},
    });
  }

  if (/prisma\.\$transaction|knex\.transaction|sequelize\.transaction/.test(content)) {
    findings.push({
      id: `${filePath}:db:transaction`,
      type: FindingType.DatabaseAccess,
      severity: Severity.Low,
      message: 'Database transaction detected',
      filePath, startLine: 1, endLine: 1,
      category: FindingCategory.DataAccess,
      reviewPriority: 20,
      metadata: {},
    });
  }

  if (/\.(find|findOne|findMany|findAll|findById)\s*\(/.test(content)) {
    findings.push({
      id: `${filePath}:db:query`,
      type: FindingType.DatabaseAccess,
      severity: Severity.Info,
      message: 'ORM database query detected',
      filePath, startLine: 1, endLine: 1,
      category: FindingCategory.DataAccess,
      reviewPriority: 15,
      metadata: {},
    });
  }

  return findings;
}
