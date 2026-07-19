import type { ASTNode, Finding } from '@hunteros/shared';
import { FindingType, Severity, FindingCategory } from '@hunteros/shared';

export interface CustomRule {
  name: string;
  description: string;
  pattern: RegExp;
  severity: Severity;
  category: FindingCategory;
  priority: number;
}

const defaultRules: CustomRule[] = [
  {
    name: 'hardcoded-ip',
    description: 'Hardcoded IP address',
    pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/,
    severity: Severity.Medium,
    category: FindingCategory.Network,
    priority: 30,
  },
  {
    name: 'todo-fixme',
    description: 'TODO or FIXME comment',
    pattern: /TODO|FIXME|HACK|XXX/,
    severity: Severity.Low,
    category: FindingCategory.Other,
    priority: 10,
  },
  {
    name: 'debug-code',
    description: 'Debug code left in production',
    pattern: /debugger|console\.log\(|console\.dir\(/,
    severity: Severity.Medium,
    category: FindingCategory.ErrorHandling,
    priority: 25,
  },
];

export function analyzeCustom(nodes: ASTNode[], filePath: string, rules?: CustomRule[]): Finding[] {
  const findings: Finding[] = [];
  const content = nodes.map((n) => n.name).join('\n');
  const activeRules = rules ?? defaultRules;

  for (const rule of activeRules) {
    const matches = content.match(rule.pattern);
    if (matches) {
      findings.push({
        id: `${filePath}:custom:${rule.name}`,
        type: FindingType.Configuration,
        severity: rule.severity,
        message: `${rule.description}: ${matches[0]!.substring(0, 100)}`,
        filePath, startLine: 1, endLine: 1,
        category: rule.category,
        reviewPriority: rule.priority,
        metadata: { rule: rule.name, matchCount: matches.length },
      });
    }
  }

  return findings;
}

export function createRule(config: CustomRule): CustomRule {
  return config;
}
