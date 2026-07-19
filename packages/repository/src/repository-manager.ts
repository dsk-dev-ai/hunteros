import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, basename, resolve } from 'node:path';
import { createLogger } from '@hunteros/logger';
import type { Logger } from '@hunteros/logger';
import { FileIndexer, detectPackageManager, readPackageJson } from '@hunteros/parser';
import type { PackageJsonInfo } from '@hunteros/parser';
import { FrameworkDetectorRegistry } from '@hunteros/framework-detectors';
import type { FileInfo, FrameworkInfo } from '@hunteros/shared';
import type { RepositoryStats, RepositoryReport } from './types.js';

export class RepositoryManager {
  private logger: Logger;
  private fileIndexer: FileIndexer;
  private frameworkDetector: FrameworkDetectorRegistry;

  constructor(logger?: Logger) {
    this.logger = logger ?? createLogger({}, 'repository');
    this.fileIndexer = new FileIndexer(this.logger);
    this.frameworkDetector = new FrameworkDetectorRegistry(this.logger);
  }

  async open(path: string): Promise<RepositoryReport> {
    const resolvedPath = resolve(path);
    if (!existsSync(resolvedPath)) {
      throw new Error(`Path does not exist: ${resolvedPath}`);
    }
    this.logger.info(`Opening repository at ${resolvedPath}`);
    const index = this.fileIndexer.indexRepository(resolvedPath, ['node_modules', 'dist', 'build', 'coverage', '.git'], 1048576);
    const files = index.files;
    const filePaths = files.map((f) => f.path);
    const pkgJson = readPackageJson(resolvedPath);
    const fileContents = files
      .map((f) => {
        try {
          return readFileSync(join(resolvedPath, f.path), 'utf-8');
        } catch {
          return '';
        }
      })
      .join('\n');
    const stats = await this.computeStats(resolvedPath, files, filePaths, fileContents, pkgJson);
    return {
      path: resolvedPath,
      name: basename(resolvedPath),
      description: pkgJson?.description ?? '',
      stats,
      files,
      scannedAt: new Date().toISOString(),
    };
  }

  async clone(url: string, destPath: string): Promise<RepositoryReport> {
    this.logger.info(`Cloning repository from ${url}`);
    try {
      execSync(`git clone --depth 1 "${url}" "${destPath}"`, { stdio: 'pipe', timeout: 120000 });
    } catch (error) {
      throw new Error(`Failed to clone repository: ${(error as Error).message}`);
    }
    return this.open(destPath);
  }

  private async computeStats(
    repoPath: string,
    files: FileInfo[],
    filePaths: string[],
    fileContents: string,
    pkgJson: PackageJsonInfo | null,
  ): Promise<RepositoryStats> {
    const languages: Record<string, { files: number; lines: number }> = {};
    let totalLines = 0;
    let totalSize = 0;
    for (const file of files) {
      totalSize += file.size;
      const lang = file.language ?? 'unknown';
      const existing = languages[lang];
      const lines = file.lines ?? 0;
      totalLines += lines;
      if (existing) {
        existing.files += 1;
        existing.lines += lines;
      } else {
        languages[lang] = { files: 1, lines };
      }
    }

    const frameworks = this.frameworkDetector.detectAll(pkgJson, filePaths, fileContents);

    return {
      totalFiles: files.length,
      totalLines,
      totalSize,
      languages,
      frameworks,
      packageManager: pkgJson?.packageManager ?? null,
      hasLockfile: this.checkLockfile(repoPath),
      hasReadme: existsSync(join(repoPath, 'README.md')) || existsSync(join(repoPath, 'README')),
      hasLicense: existsSync(join(repoPath, 'LICENSE')) || existsSync(join(repoPath, 'LICENSE.md')),
      hasCI: existsSync(join(repoPath, '.github/workflows')) || existsSync(join(repoPath, '.gitlab-ci.yml')),
      hasDocker: existsSync(join(repoPath, 'Dockerfile')) || existsSync(join(repoPath, 'docker-compose.yml')),
      hasTests: this.checkTests(repoPath),
      hasGit: existsSync(join(repoPath, '.git')),
      totalCommits: this.countCommits(repoPath),
      contributors: this.countContributors(repoPath),
    };
  }

  private checkLockfile(repoPath: string): boolean {
    const lockfiles = ['pnpm-lock.yaml', 'yarn.lock', 'package-lock.json', 'bun.lockb'];
    return lockfiles.some((lf) => existsSync(join(repoPath, lf)));
  }

  private checkTests(repoPath: string): boolean {
    const testDirs = ['__tests__', 'test', 'tests', 'spec'];
    return testDirs.some((d) => existsSync(join(repoPath, d)));
  }

  private countCommits(repoPath: string): number {
    try {
      const out = execSync('git rev-list --count HEAD 2>/dev/null', { cwd: repoPath, encoding: 'utf-8', timeout: 5000 }).trim();
      return Number.parseInt(out, 10) || 0;
    } catch {
      return 0;
    }
  }

  private countContributors(repoPath: string): number {
    try {
      const out = execSync('git shortlog -sn HEAD 2>/dev/null | wc -l', { cwd: repoPath, encoding: 'utf-8', timeout: 5000 }).trim();
      return Number.parseInt(out, 10) || 0;
    } catch {
      return 0;
    }
  }
}
