import type { ASTNode, Finding } from '@hunteros/shared';
import { FindingType, Severity, FindingCategory } from '@hunteros/shared';

export function analyzeFileSystem(nodes: ASTNode[], filePath: string): Finding[] {
  const findings: Finding[] = [];
  const content = nodes.map((n) => n.name).join('\n');

  const fsFunctions = [
    { pattern: /writeFile(?:Sync)?\(/, label: 'File write operation', priority: 60 },
    { pattern: /unlink(?:Sync)?\(/, label: 'File deletion operation', priority: 50 },
    { pattern: /chmod|chown/, label: 'File permission changes', priority: 70 },
    { pattern: /symlink|link(?:Sync)?\(/, label: 'Filesystem link operation', priority: 40 },
  ];

  for (const { pattern, label, priority } of fsFunctions) {
    if (pattern.test(content)) {
      findings.push({
        id: `${filePath}:fs:${label}`,
        type: FindingType.FileSystemAccess,
        severity: priority >= 60 ? Severity.High : Severity.Medium,
        message: label,
        filePath, startLine: 1, endLine: 1,
        category: FindingCategory.FileSystem,
        reviewPriority: priority,
        metadata: {},
      });
    }
  }

  return findings;
}
