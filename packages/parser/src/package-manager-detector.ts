import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PackageManager } from '@hunteros/shared';

export function detectPackageManager(rootPath: string): PackageManager {
  if (existsSync(join(rootPath, 'pnpm-lock.yaml'))) return PackageManager.Pnpm;
  if (existsSync(join(rootPath, 'yarn.lock'))) return PackageManager.Yarn;
  if (existsSync(join(rootPath, 'bun.lockb'))) return PackageManager.Bun;
  if (existsSync(join(rootPath, 'package-lock.json'))) return PackageManager.Npm;
  return PackageManager.Unknown;
}

export interface PackageJsonInfo {
  name?: string;
  version?: string;
  description?: string;
  packageManager?: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
}

export function readPackageJson(rootPath: string): PackageJsonInfo | null {
  const pkgPath = join(rootPath, 'package.json');
  if (!existsSync(pkgPath)) return null;
  try {
    const content = readFileSync(pkgPath, 'utf-8');
    const pkg = JSON.parse(content);
    return {
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
      packageManager: pkg.packageManager ?? detectPackageManager(rootPath),
      dependencies: pkg.dependencies ?? {},
      devDependencies: pkg.devDependencies ?? {},
      scripts: pkg.scripts ?? {},
    };
  } catch {
    return null;
  }
}
