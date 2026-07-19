export interface ConfigFinding {
  file: string;
  type: 'dockerfile' | 'docker-compose' | 'github-actions' | 'ci-cd' | 'kubernetes' | 'nginx' | 'apache' | 'env-file' | 'package-json' | 'lockfile';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  message: string;
  recommendation: string;
  reference?: string;
}

export interface ConfigAuditReport {
  findings: ConfigFinding[];
  totalFiles: number;
  filesScanned: string[];
  timestamp: string;
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
}
