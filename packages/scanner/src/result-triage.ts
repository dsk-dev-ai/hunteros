import type { VulnerabilityFinding, TriageResult } from '@hunteros/shared';
import { Severity, FindingCategory } from '@hunteros/shared';

export class ResultTriage {
  triage(
    findings: VulnerabilityFinding[],
    aiAnalysis?: Map<string, string>,
  ): TriageResult[] {
    return findings.map((f) => this.triageOne(f, aiAnalysis?.get(f.id)));
  }

  private triageOne(finding: VulnerabilityFinding, aiNotes?: string): TriageResult {
    const isRealBug = this.evaluateRealBug(finding);
    const confidence = this.calculateConfidence(finding, isRealBug);
    const priority = this.calculatePriority(finding, isRealBug);
    const escalationPath = this.determineEscalation(finding, isRealBug);
    const suggestedAssignee = this.suggestAssignee(finding);

    return {
      findingId: finding.id,
      isRealBug,
      confidence,
      severity: finding.severity,
      priority,
      notes: aiNotes ?? finding.triageNotes,
      escalationPath,
      suggestedAssignee,
    };
  }

  private evaluateRealBug(finding: VulnerabilityFinding): boolean {
    if (finding.falsePositive) return false;
    if (finding.cve) return true;
    if (finding.cvss && finding.cvss >= 7) return true;
    if (finding.severity === Severity.Critical || finding.severity === Severity.High) return true;
    if (finding.evidence.length > 50) return true;
    return false;
  }

  private calculateConfidence(finding: VulnerabilityFinding, _isRealBug: boolean): number {
    let score = 50;
    if (finding.cve) score += 30;
    if (finding.cvss) score += Math.min(finding.cvss * 5, 20);
    if (finding.evidence.length > 100) score += 10;
    if (finding.references.length > 0) score += 10;
    return Math.min(score, 100);
  }

  private calculatePriority(finding: VulnerabilityFinding, isRealBug: boolean): number {
    if (!isRealBug) return 0;
    const severityMap: Record<string, number> = {
      [Severity.Critical]: 100, [Severity.High]: 75, [Severity.Medium]: 50, [Severity.Low]: 25, [Severity.Info]: 5,
    };
    return severityMap[finding.severity] ?? 25;
  }

  private determineEscalation(finding: VulnerabilityFinding, isRealBug: boolean): string {
    if (!isRealBug) return 'No escalation needed — potential false positive';
    if (finding.severity === Severity.Critical) return 'Immediate escalation to Security Team and Engineering Lead';
    if (finding.severity === Severity.High) return 'Escalate to Security Team for review within 24 hours';
    if (finding.severity === Severity.Medium) return 'Add to sprint backlog for next cycle review';
    return 'Log for informational tracking in issue tracker';
  }

  private suggestAssignee(finding: VulnerabilityFinding): string {
    const categoryMap: Record<string, string> = {
      [FindingCategory.Authentication]: 'Auth Team',
      [FindingCategory.Authorization]: 'Auth Team',
      [FindingCategory.InputValidation]: 'Security Team',
      [FindingCategory.Cryptography]: 'Security Team',
      [FindingCategory.Secrets]: 'DevOps Team',
      [FindingCategory.Configuration]: 'DevOps Team',
      [FindingCategory.DataAccess]: 'Backend Team',
      [FindingCategory.Network]: 'Infrastructure Team',
      [FindingCategory.FileSystem]: 'Backend Team',
      [FindingCategory.Dependency]: 'DevOps Team',
    };
    return categoryMap[finding.category] ?? 'Security Team';
  }
}
