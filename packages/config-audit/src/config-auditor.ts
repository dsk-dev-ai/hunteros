import { readFileSync } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { join, relative, basename } from 'node:path';
import { createLogger } from '@hunteros/logger';
import type { Logger } from '@hunteros/logger';
import type { ConfigFinding, ConfigAuditReport } from './types.js';

export class ConfigAuditor {
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger ?? createLogger({}, 'config-audit');
  }

  async audit(repoPath: string): Promise<ConfigAuditReport> {
    this.logger.info(`Auditing configuration in ${repoPath}`);
    const findings: ConfigFinding[] = [];
    const filesScanned: string[] = [];

    const configFiles = await this.findConfigFiles(repoPath);
    for (const filePath of configFiles) {
      filesScanned.push(filePath);
      const relPath = relative(repoPath, filePath);
      const fileName = basename(filePath);
      let content: string;
      try {
        content = readFileSync(filePath, 'utf-8');
      } catch {
        continue;
      }

      if (fileName === 'Dockerfile') {
        findings.push(...this.auditDockerfile(relPath, content));
      } else if (fileName === 'docker-compose.yml' || fileName === 'docker-compose.yaml') {
        findings.push(...this.auditDockerCompose(relPath, content));
      } else if (fileName.endsWith('.yml') && filePath.includes('.github/workflows')) {
        findings.push(...this.auditGitHubActions(relPath, content));
      } else if (fileName === '.env' || fileName.startsWith('.env.') || fileName === '.env.example') {
        findings.push(...this.auditEnvFile(relPath, content));
      } else if (fileName === 'package.json') {
        findings.push(...this.auditPackageJson(relPath, content));
      } else if (fileName === 'nginx.conf' || fileName.endsWith('.nginx.conf')) {
        findings.push(...this.auditNginx(relPath, content));
      } else if (fileName === '.htaccess' || fileName === 'httpd.conf' || fileName === 'apache2.conf') {
        findings.push(...this.auditApache(relPath, content));
      } else if (fileName.endsWith('.yaml') || fileName.endsWith('.yml')) {
        if (content.includes('apiVersion:') && (content.includes('kind:') || content.includes('metadata:'))) {
          findings.push(...this.auditKubernetes(relPath, content));
        }
      }
    }

    const summary = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    for (const f of findings) {
      summary[f.severity] += 1;
    }

    return { findings, totalFiles: configFiles.length, filesScanned, timestamp: new Date().toISOString(), summary };
  }

  private async findConfigFiles(repoPath: string): Promise<string[]> {
    const results: string[] = [];
    const directories = [''];
    const maxDepth = 4;
    const seen = new Set<string>();
    for (let depth = 0; depth < maxDepth && directories.length > 0; depth++) {
      const dir = directories.shift()!;
      const fullDir = join(repoPath, dir);
      let entryNames: string[];
      try {
        entryNames = await readdir(fullDir);
      } catch {
        continue;
      }
      for (const entryName of entryNames) {
        const fullPath = join(fullDir, entryName);
        const relPath = dir ? `${dir}/${entryName}` : entryName;
        if (seen.has(relPath)) continue;
        seen.add(relPath);
        let isDir = false;
        try {
          isDir = (await stat(fullPath)).isDirectory();
        } catch {
          continue;
        }
        if (isDir) {
          if (!entryName.startsWith('.') && entryName !== 'node_modules' && entryName !== 'dist' && entryName !== 'build' && entryName !== 'coverage') {
            directories.push(relPath);
          }
        } else if (this.isConfigFile(entryName)) {
          results.push(fullPath);
        }
      }
    }
    return results;
  }

  private isConfigFile(name: string): boolean {
    const configNames = [
      'Dockerfile', 'docker-compose.yml', 'docker-compose.yaml',
      '.env', '.env.example', '.env.production', '.env.development', '.env.local',
      'package.json', 'nginx.conf', '.htaccess', 'httpd.conf', 'apache2.conf',
      '.github/workflows/ci.yml', '.github/workflows/main.yml',
    ];
    if (configNames.includes(name)) return true;
    if (name.endsWith('.yaml') || name.endsWith('.yml')) return true;
    if (name.startsWith('.env')) return true;
    return false;
  }

  private auditDockerfile(relPath: string, content: string): ConfigFinding[] {
    const findings: ConfigFinding[] = [];
    if (!content.match(/FROM\s+\S+:\S+/)) {
      findings.push({ file: relPath, type: 'dockerfile', severity: 'high', message: 'Dockerfile FROM does not specify a tag', recommendation: 'Always pin a specific image tag (e.g., node:20-alpine) instead of using latest' });
    }
    if (content.includes('RUN apt-get upgrade') || content.includes('RUN apt update') || content.includes('RUN apt-get update')) {
      if (!content.includes('--no-install-recommends')) {
        findings.push({ file: relPath, type: 'dockerfile', severity: 'medium', message: 'apt-get update without --no-install-recommends', recommendation: 'Add --no-install-recommends to reduce image size and attack surface' });
      }
    }
    if (content.includes('COPY') && !content.includes('COPY --chown=') && !content.match(/COPY\s+--chown/)) {
      findings.push({ file: relPath, type: 'dockerfile', severity: 'low', message: 'COPY without --chown may create files owned as root', recommendation: 'Use COPY --chown=node:node to set proper ownership' });
    }
    if (content.includes('USER root') || (!content.includes('USER ') && !content.match(/^FROM\s+.*scratch/m))) {
      findings.push({ file: relPath, type: 'dockerfile', severity: 'high', message: 'Container runs as root', recommendation: 'Add a USER directive to run as non-root user' });
    }
    if (!content.includes('HEALTHCHECK')) {
      findings.push({ file: relPath, type: 'dockerfile', severity: 'info', message: 'No HEALTHCHECK defined', recommendation: 'Add a HEALTHCHECK instruction for container orchestration' });
    }
    if (content.includes('EXPOSE') && content.includes('0.0.0.0')) {
      findings.push({ file: relPath, type: 'dockerfile', severity: 'medium', message: 'Service bound to 0.0.0.0 exposes to all interfaces', recommendation: 'Bind to specific interfaces if possible' });
    }
    return findings;
  }

  private auditDockerCompose(relPath: string, content: string): ConfigFinding[] {
    const findings: ConfigFinding[] = [];
    if (content.includes('image:') && !content.includes('image:.*:')) {
      const lines = content.split('\n');
      for (const line of lines) {
        const match = line.match(/^\s*image:\s*(\S+)/);
        if (match) {
          const image = match[1]!;
          if (!image.includes(':') || image.endsWith(':latest')) {
            findings.push({ file: relPath, type: 'docker-compose', severity: 'high', message: `Service image "${image}" does not pin a specific tag`, recommendation: 'Pin a specific version tag instead of :latest' });
          }
        }
      }
    }
    if (!content.includes('restart:') && !content.includes('restart: ')) {
      findings.push({ file: relPath, type: 'docker-compose', severity: 'low', message: 'No restart policy defined', recommendation: 'Add restart: unless-stopped for production services' });
    }
    if (content.includes('ports:') && !content.includes('"')) {
      findings.push({ file: relPath, type: 'docker-compose', severity: 'medium', message: 'Ports should be quoted to prevent YAML parsing issues', recommendation: 'Quote port mappings (e.g., "8080:80")' });
    }
    return findings;
  }

  private auditGitHubActions(relPath: string, content: string): ConfigFinding[] {
    const findings: ConfigFinding[] = [];
    if (content.includes('pull_request_target') && !content.includes('pull_request_target:')) {
      findings.push({ file: relPath, type: 'github-actions', severity: 'high', message: 'Uses pull_request_target which can leak secrets', recommendation: 'Review pull_request_target usage carefully; consider using pull_request instead' });
    }
    if (content.includes('GITHUB_TOKEN') && content.includes('write-all')) {
      findings.push({ file: relPath, type: 'github-actions', severity: 'high', message: 'GITHUB_TOKEN has write-all permissions', recommendation: 'Restrict GITHUB_TOKEN permissions to minimum required using permissions block' });
    }
    if (!content.includes('permissions:')) {
      findings.push({ file: relPath, type: 'github-actions', severity: 'medium', message: 'No explicit permissions block on GITHUB_TOKEN', recommendation: 'Add a permissions: block to follow least privilege' });
    }
    if (content.includes('actions/checkout') && content.includes('fetch-depth: 0')) {
      findings.push({ file: relPath, type: 'github-actions', severity: 'info', message: 'Full git history checkout (fetch-depth: 0)', recommendation: 'Use fetch-depth: 1 unless full history is needed' });
    }
    if (content.includes('run:') && (content.includes('curl') || content.includes('wget')) && content.includes('| bash')) {
      findings.push({ file: relPath, type: 'github-actions', severity: 'critical', message: 'Piping curl/wget to bash is dangerous', recommendation: 'Verify the script source and consider downloading and reviewing before execution' });
    }
    return findings;
  }

  private auditEnvFile(relPath: string, content: string): ConfigFinding[] {
    const findings: ConfigFinding[] = [];
    const sensitivePatterns = [
      { pattern: /(?:SECRET|SECRET_KEY|API_KEY|API_SECRET|ACCESS_KEY|SECRET_ACCESS_KEY|PRIVATE_KEY|PASSWORD|PASS|DB_PASSWORD|TOKEN)/i, severity: 'critical' as const, message: 'Potential sensitive value in env file' },
      { pattern: /(?:AWS_|AZURE_|GCP_|GOOGLE_)/i, severity: 'high' as const, message: 'Cloud provider credentials in env file' },
      { pattern: /(?:DATABASE_URL|REDIS_URL|MONGODB_URI|PGHOST|PGPASSWORD)/i, severity: 'high' as const, message: 'Database connection string in env file' },
    ];
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      for (const sp of sensitivePatterns) {
        if (sp.pattern.test(trimmed)) {
          findings.push({ file: relPath, type: 'env-file', severity: sp.severity, message: sp.message, recommendation: 'Ensure .env files are in .gitignore and never committed to version control. Use secrets management for production.' });
          break;
        }
      }
    }
    return findings;
  }

  private auditPackageJson(relPath: string, content: string): ConfigFinding[] {
    const findings: ConfigFinding[] = [];
    try {
      const pkg = JSON.parse(content);
      const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
      if (deps['*']) {
        findings.push({ file: relPath, type: 'package-json', severity: 'high', message: 'Dependency with wildcard (*) version', recommendation: 'Pin exact versions for reproducible builds' });
      }
      for (const [name, version] of Object.entries(deps)) {
        if (typeof version === 'string' && (version.startsWith('>') || version.startsWith('<'))) {
          findings.push({ file: relPath, type: 'package-json', severity: 'medium', message: `Dependency "${name}" uses range "${version}"`, recommendation: 'Consider pinning to an exact version for reproducible builds' });
        }
      }
      if (!pkg.scripts?.test) {
        findings.push({ file: relPath, type: 'package-json', severity: 'info', message: 'No test script defined', recommendation: 'Add a test script for CI integration' });
      }
      if (pkg.scripts?.postinstall && pkg.scripts.postinstall.includes('node')) {
        findings.push({ file: relPath, type: 'package-json', severity: 'medium', message: 'postinstall script may execute arbitrary code on install', recommendation: 'Audit postinstall scripts for safety' });
      }
    } catch {
      findings.push({ file: relPath, type: 'package-json', severity: 'low', message: 'Invalid package.json (parse error)', recommendation: 'Fix JSON syntax in package.json' });
    }
    return findings;
  }

  private auditNginx(relPath: string, content: string): ConfigFinding[] {
    const findings: ConfigFinding[] = [];
    if (!content.includes('server_tokens off')) {
      findings.push({ file: relPath, type: 'nginx', severity: 'medium', message: 'server_tokens not set to off', recommendation: 'Add server_tokens off; to hide nginx version' });
    }
    if (!content.includes('X-Frame-Options') && !content.includes('add_header X-Frame-Options')) {
      findings.push({ file: relPath, type: 'nginx', severity: 'medium', message: 'Missing X-Frame-Options header', recommendation: 'Add add_header X-Frame-Options "SAMEORIGIN";' });
    }
    if (!content.includes('X-Content-Type-Options') && !content.includes('add_header X-Content-Type-Options')) {
      findings.push({ file: relPath, type: 'nginx', severity: 'medium', message: 'Missing X-Content-Type-Options header', recommendation: 'Add add_header X-Content-Type-Options "nosniff";' });
    }
    if (content.includes('ssl_certificate') && !content.includes('ssl_protocols')) {
      findings.push({ file: relPath, type: 'nginx', severity: 'high', message: 'SSL configured but no ssl_protocols specified', recommendation: 'Add ssl_protocols TLSv1.2 TLSv1.3;' });
    }
    return findings;
  }

  private auditApache(relPath: string, content: string): ConfigFinding[] {
    const findings: ConfigFinding[] = [];
    if (!content.includes('ServerTokens') && !content.includes('ServerSignature')) {
      findings.push({ file: relPath, type: 'apache', severity: 'medium', message: 'ServerTokens not configured', recommendation: 'Add ServerTokens Prod to hide Apache version' });
    }
    if (!content.includes('Header always append X-Frame-Options') && !content.includes('Header set X-Frame-Options')) {
      findings.push({ file: relPath, type: 'apache', severity: 'medium', message: 'Missing X-Frame-Options header', recommendation: 'Add Header always set X-Frame-Options "SAMEORIGIN"' });
    }
    if (!content.includes('Header set X-Content-Type-Options')) {
      findings.push({ file: relPath, type: 'apache', severity: 'medium', message: 'Missing X-Content-Type-Options header', recommendation: 'Add Header set X-Content-Type-Options "nosniff"' });
    }
    return findings;
  }

  private auditKubernetes(relPath: string, content: string): ConfigFinding[] {
    const findings: ConfigFinding[] = [];
    if (content.includes('privileged: true')) {
      findings.push({ file: relPath, type: 'kubernetes', severity: 'critical', message: 'Container runs in privileged mode', recommendation: 'Remove privileged: true unless absolutely required' });
    }
    if (content.includes('runAsUser: 0')) {
      findings.push({ file: relPath, type: 'kubernetes', severity: 'high', message: 'Container runs as root (runAsUser: 0)', recommendation: 'Run as non-root user' });
    }
    if (!content.includes('securityContext:')) {
      findings.push({ file: relPath, type: 'kubernetes', severity: 'medium', message: 'No securityContext defined', recommendation: 'Define a securityContext with runAsNonRoot: true and readOnlyRootFilesystem: true' });
    }
    if (content.includes('imagePullPolicy: Always') || !content.includes('imagePullPolicy:')) {
      findings.push({ file: relPath, type: 'kubernetes', severity: 'info', message: 'Image pull policy should be reviewed', recommendation: 'Consider IfNotPresent for production to avoid unnecessary pulls' });
    }
    return findings;
  }
}
