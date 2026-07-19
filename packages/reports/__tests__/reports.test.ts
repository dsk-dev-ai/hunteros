import { describe, it, expect } from 'vitest';
import { JsonReportGenerator } from '../src/report-generator.js';
import { createLogger } from '@hunteros/logger';
import { LogLevel, Severity, FindingType, FindingCategory } from '@hunteros/shared';
import type { ReviewContext, RepositoryInfo, FileIndex } from '@hunteros/shared';

describe('JsonReportGenerator', () => {
  const logger = createLogger({ level: LogLevel.Silent });

  const mockContext: ReviewContext = {
    repository: {
      path: '/test/repo', name: 'test-repo', branch: 'main',
      languages: [], frameworks: [], fileCount: 10, sizeBytes: 1000,
    },
    fileIndex: { files: [], totalFiles: 0, totalLines: 0, languages: new Map() },
    astNodes: [],
    graph: { nodes: [], edges: [] },
    analysis: [],
    findings: [
      {
        id: '1', type: FindingType.Secrets, severity: Severity.High,
        message: 'Hardcoded secret', filePath: 'src/config.ts',
        startLine: 5, endLine: 5, category: FindingCategory.Secrets,
        reviewPriority: 90, metadata: {},
      },
    ],
  };

  it('should generate a report', () => {
    const generator = new JsonReportGenerator(logger);
    const report = generator.generate(mockContext);
    expect(report.id).toBeDefined();
    expect(report.summary.totalFindings).toBe(1);
    expect(report.summary.highCount).toBe(1);
  });

  it('should include sections', () => {
    const generator = new JsonReportGenerator(logger);
    const report = generator.generate(mockContext);
    expect(report.sections.length).toBeGreaterThan(0);
  });
});
