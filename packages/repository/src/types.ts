import type { FileInfo, FrameworkInfo } from '@hunteros/shared';

export interface RepositoryStats {
  totalFiles: number;
  totalLines: number;
  totalSize: number;
  languages: Record<string, { files: number; lines: number }>;
  frameworks: FrameworkInfo[];
  packageManager: string | null;
  hasLockfile: boolean;
  hasReadme: boolean;
  hasLicense: boolean;
  hasCI: boolean;
  hasDocker: boolean;
  hasTests: boolean;
  hasGit: boolean;
  totalCommits: number;
  contributors: number;
}

export interface RepositoryReport {
  path: string;
  name: string;
  description: string;
  stats: RepositoryStats;
  files: FileInfo[];
  scannedAt: string;
}
