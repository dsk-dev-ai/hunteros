export interface DependencyInfo {
  name: string;
  version: string;
  type: 'dependencies' | 'devDependencies' | 'peerDependencies';
  license?: string;
  hasAdvisory: boolean;
  advisoryCount: number;
}

export interface LicenseSummary {
  license: string;
  count: number;
  packages: string[];
}

export interface AdvisoryInfo {
  packageName: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  cve?: string;
  cvss?: number;
}

export interface DependencyAuditReport {
  dependencies: DependencyInfo[];
  totalDependencies: number;
  totalDevDependencies: number;
  licenses: LicenseSummary[];
  advisories: AdvisoryInfo[];
  packageManager: string;
  timestamp: string;
}
