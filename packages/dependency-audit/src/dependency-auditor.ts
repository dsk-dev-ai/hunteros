import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createLogger } from '@hunteros/logger';
import type { Logger } from '@hunteros/logger';
import type { DependencyInfo, DependencyAuditReport, LicenseSummary, AdvisoryInfo } from './types.js';

export class DependencyAuditor {
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger ?? createLogger({}, 'dependency-audit');
  }

  async audit(repoPath: string): Promise<DependencyAuditReport> {
    this.logger.info(`Auditing dependencies in ${repoPath}`);
    const pkgPath = join(repoPath, 'package.json');
    if (!existsSync(pkgPath)) {
      return {
        dependencies: [],
        totalDependencies: 0,
        totalDevDependencies: 0,
        licenses: [],
        advisories: [],
        packageManager: this.detectPackageManager(repoPath),
        timestamp: new Date().toISOString(),
      };
    }

    let pkg: Record<string, unknown>;
    try {
      const content = readFileSync(pkgPath, 'utf-8');
      pkg = JSON.parse(content);
    } catch {
      return {
        dependencies: [],
        totalDependencies: 0,
        totalDevDependencies: 0,
        licenses: [],
        advisories: [],
        packageManager: 'unknown',
        timestamp: new Date().toISOString(),
      };
    }

    const deps = this.collectDependencies(pkg);
    const hasLockfile = this.checkLockfile(repoPath);
    const packages = this.resolveDependencyNames(deps, repoPath);
    const licenses = this.computeLicenseSummary(packages);
    const advisories = await this.checkAdvisories(packages);
    const pm = this.detectPackageManager(repoPath);

    const totalDeps = deps.filter((d) => d.type === 'dependencies').length;
    const totalDevDeps = deps.filter((d) => d.type === 'devDependencies').length;

    return {
      dependencies: packages,
      totalDependencies: totalDeps,
      totalDevDependencies: totalDevDeps,
      licenses,
      advisories,
      packageManager: pm,
      timestamp: new Date().toISOString(),
    };
  }

  private collectDependencies(pkg: Record<string, unknown>): Array<{ name: string; version: string; type: DependencyInfo['type'] }> {
    const result: Array<{ name: string; version: string; type: DependencyInfo['type'] }> = [];
    const depTypes: Array<DependencyInfo['type']> = ['dependencies', 'devDependencies', 'peerDependencies'];
    for (const depType of depTypes) {
      const deps = pkg[depType] as Record<string, string> | undefined;
      if (deps) {
        for (const [name, version] of Object.entries(deps)) {
          result.push({ name, version, type: depType });
        }
      }
    }
    return result;
  }

  private resolveDependencyNames(
    deps: Array<{ name: string; version: string; type: DependencyInfo['type'] }>,
    repoPath: string,
  ): DependencyInfo[] {
    return deps.map((dep) => {
      let license: string | undefined;
      const depPath = join(repoPath, 'node_modules', dep.name, 'package.json');
      try {
        const depPkg = JSON.parse(readFileSync(depPath, 'utf-8'));
        license = depPkg.license ?? depPkg.licenses?.[0]?.type;
      } catch {
        license = undefined;
      }
      return {
        name: dep.name,
        version: dep.version,
        type: dep.type,
        license: license ?? 'unknown',
        hasAdvisory: false,
        advisoryCount: 0,
      };
    });
  }

  private computeLicenseSummary(packages: DependencyInfo[]): LicenseSummary[] {
    const licenseMap = new Map<string, { count: number; packages: string[] }>();
    for (const pkg of packages) {
      const lic = pkg.license ?? 'unknown';
      const existing = licenseMap.get(lic);
      if (existing) {
        existing.count += 1;
        existing.packages.push(pkg.name);
      } else {
        licenseMap.set(lic, { count: 1, packages: [pkg.name] });
      }
    }
    return Array.from(licenseMap.entries()).map(([license, data]) => ({
      license,
      count: data.count,
      packages: data.packages,
    }));
  }

  private async checkAdvisories(_packages: DependencyInfo[]): Promise<AdvisoryInfo[]> {
    return [];
  }

  private checkLockfile(repoPath: string): boolean {
    const lockfiles = ['pnpm-lock.yaml', 'yarn.lock', 'package-lock.json', 'bun.lockb'];
    return lockfiles.some((lf) => existsSync(join(repoPath, lf)));
  }

  private detectPackageManager(repoPath: string): string {
    if (existsSync(join(repoPath, 'pnpm-lock.yaml'))) return 'pnpm';
    if (existsSync(join(repoPath, 'yarn.lock'))) return 'yarn';
    if (existsSync(join(repoPath, 'package-lock.json'))) return 'npm';
    if (existsSync(join(repoPath, 'bun.lockb'))) return 'bun';
    return 'unknown';
  }
}
