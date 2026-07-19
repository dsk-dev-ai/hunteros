import type { Report, ReportSummary, ReportSection, Finding, AnalysisResult, RepositoryInfo, ReviewContext } from '@hunteros/shared';
import { Severity } from '@hunteros/shared';
import type { Logger } from '@hunteros/logger';

export interface ReportGenerator {
  name: string;
  generate(context: ReviewContext): Report;
}

export class JsonReportGenerator implements ReportGenerator {
  name = 'json';
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  generate(context: ReviewContext): Report {
    this.logger.info('Generating JSON report');
    const summary = this.buildSummary(context);
    const sections = this.buildSections(context);

    return {
      id: `report-${Date.now()}`,
      timestamp: new Date().toISOString(),
      repository: context.repository,
      summary,
      findings: context.findings,
      sections,
    };
  }

  private buildSummary(context: ReviewContext): ReportSummary {
    const findings = context.findings;
    return {
      totalFindings: findings.length,
      criticalCount: findings.filter((f) => f.severity === Severity.Critical).length,
      highCount: findings.filter((f) => f.severity === Severity.High).length,
      mediumCount: findings.filter((f) => f.severity === Severity.Medium).length,
      lowCount: findings.filter((f) => f.severity === Severity.Low).length,
      infoCount: findings.filter((f) => f.severity === Severity.Info).length,
      topFrameworks: context.repository.frameworks.map((f) => f.name),
      totalFiles: context.repository.fileCount,
    };
  }

  private buildSections(context: ReviewContext): ReportSection[] {
    const sections: ReportSection[] = [];

    if (context.repository.frameworks.length > 0) {
      sections.push({
        title: 'Framework Detection',
        type: 'frameworks',
        content: `Detected ${context.repository.frameworks.length} framework(s): ${context.repository.frameworks.map((f) => `${f.name} (${(f.confidence * 100).toFixed(0)}% confidence)`).join(', ')}`,
        findings: [],
      });
    }

    const bySeverity = this.groupBySeverity(context.findings);
    for (const [severity, findings] of Object.entries(bySeverity)) {
      if (findings.length > 0) {
        sections.push({
          title: `${severity.toUpperCase()} Severity Findings`,
          type: 'findings',
          content: `${findings.length} finding(s) at ${severity} severity`,
          findings,
        });
      }
    }

    const highPriority = context.findings
      .filter((f) => f.reviewPriority >= 50)
      .sort((a, b) => b.reviewPriority - a.reviewPriority);

    if (highPriority.length > 0) {
      sections.push({
        title: 'High Priority Review Items',
        type: 'priorities',
        content: highPriority.map((f) => `[${f.severity}] ${f.message} (${f.filePath}:${f.startLine}) - Priority: ${f.reviewPriority}`).join('\n'),
        findings: highPriority,
      });
    }

    if (context.analysis.length > 0) {
      sections.push({
        title: 'File Analysis Summary',
        type: 'analysis',
        content: `Analyzed ${context.analysis.length} file(s) with findings`,
        findings: context.analysis.flatMap((a) => a.findings),
      });
    }

    return sections;
  }

  private groupBySeverity(findings: Finding[]): Record<string, Finding[]> {
    const groups: Record<string, Finding[]> = {};
    for (const finding of findings) {
      const key = finding.severity;
      if (!groups[key]) groups[key] = [];
      groups[key]!.push(finding);
    }
    return groups;
  }
}

export class MarkdownReportGenerator implements ReportGenerator {
  name = 'markdown';
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  generate(context: ReviewContext): Report {
    const jsonGenerator = new JsonReportGenerator(this.logger);
    const report = jsonGenerator.generate(context);

    const mdSections = report.sections.map((s) => {
      return `## ${s.title}\n\n${s.content}\n`;
    });

    const mdContent = [
      `# HunterOS Report: ${context.repository.name}`,
      '',
      `**Generated**: ${report.timestamp}`,
      `**Repository**: ${context.repository.path}`,
      `**Branch**: ${context.repository.branch}`,
      `**Files**: ${context.repository.fileCount}`,
      '',
      '---',
      '',
      '## Summary',
      '',
      `| Metric | Count |`,
      `|--------|-------|`,
      `| Total Findings | ${report.summary.totalFindings} |`,
      `| Critical | ${report.summary.criticalCount} |`,
      `| High | ${report.summary.highCount} |`,
      `| Medium | ${report.summary.mediumCount} |`,
      `| Low | ${report.summary.lowCount} |`,
      `| Info | ${report.summary.infoCount} |`,
      '',
      '---',
      '',
      ...mdSections,
    ];

    report.sections.unshift({
      title: 'Full Report',
      type: 'markdown',
      content: mdContent.join('\n'),
      findings: report.findings,
    });

    return report;
  }
}
