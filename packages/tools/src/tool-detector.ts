import { execSync } from 'node:child_process';
import { whichSync } from './which.js';
import { createLogger } from '@hunteros/logger';
import type { Logger } from '@hunteros/logger';
import type { ToolInfo, ToolReport } from './types.js';

export interface ToolDefinition {
  name: string;
  versionCommand: string;
  versionRegex: RegExp;
  binaryNames: string[];
}

const DEFAULT_TOOLS: ToolDefinition[] = [
  { name: 'Git', versionCommand: 'git --version', versionRegex: /git version (\S+)/i, binaryNames: ['git'] },
  { name: 'Docker', versionCommand: 'docker --version', versionRegex: /Docker version (\S+)/i, binaryNames: ['docker'] },
  { name: 'Docker Compose', versionCommand: 'docker compose version', versionRegex: /Docker Compose version (\S+)/i, binaryNames: ['docker'] },
  { name: 'Node.js', versionCommand: 'node --version', versionRegex: /v?(\d+\.\d+\.\d+)/, binaryNames: ['node'] },
  { name: 'npm', versionCommand: 'npm --version', versionRegex: /(\d+\.\d+\.\d+)/, binaryNames: ['npm'] },
  { name: 'pnpm', versionCommand: 'pnpm --version', versionRegex: /(\d+\.\d+\.\d+)/, binaryNames: ['pnpm'] },
  { name: 'Python', versionCommand: 'python3 --version', versionRegex: /Python (\d+\.\d+\.\d+)/i, binaryNames: ['python3', 'python'] },
  { name: 'Go', versionCommand: 'go version', versionRegex: /go version go(\S+)/i, binaryNames: ['go'] },
  { name: 'Rust', versionCommand: 'rustc --version', versionRegex: /rustc (\d+\.\d+\.\d+)/i, binaryNames: ['rustc'] },
  { name: 'Java', versionCommand: 'java -version 2>&1', versionRegex: /(\d+\.\d+\.\d+)/, binaryNames: ['java'] },
  { name: 'PostgreSQL', versionCommand: 'psql --version', versionRegex: /psql \(PostgreSQL\) (\d+\.\d+)/i, binaryNames: ['psql'] },
  { name: 'SQLite', versionCommand: 'sqlite3 --version', versionRegex: /(\d+\.\d+\.\d+)/, binaryNames: ['sqlite3'] },
  { name: 'Tree-sitter', versionCommand: 'tree-sitter --version', versionRegex: /tree-sitter (\S+)/i, binaryNames: ['tree-sitter'] },
  { name: 'Semgrep', versionCommand: 'semgrep --version', versionRegex: /(\d+\.\d+\.\d+)/, binaryNames: ['semgrep'] },
  { name: 'CodeQL', versionCommand: 'codeql version', versionRegex: /CodeQL CLI version (\S+)/i, binaryNames: ['codeql'] },
  { name: 'Trivy', versionCommand: 'trivy --version', versionRegex: /Version: (\S+)/i, binaryNames: ['trivy'] },
  { name: 'Gitleaks', versionCommand: 'gitleaks version', versionRegex: /(\d+\.\d+\.\d+)/, binaryNames: ['gitleaks'] },
  { name: 'TruffleHog', versionCommand: 'trufflehog --version', versionRegex: /(\d+\.\d+\.\d+)/, binaryNames: ['trufflehog'] },
];

export class ToolDetector {
  private logger: Logger;
  private tools: ToolDefinition[];

  constructor(tools?: ToolDefinition[], logger?: Logger) {
    this.logger = logger ?? createLogger({}, 'tool-detector');
    this.tools = tools ?? DEFAULT_TOOLS;
  }

  async detect(): Promise<ToolReport> {
    this.logger.info('Detecting installed development and security tools');
    const results: ToolInfo[] = [];
    for (const tool of this.tools) {
      results.push(this.checkTool(tool));
    }
    const totalInstalled = results.filter((t) => t.installed).length;
    return {
      tools: results,
      timestamp: new Date().toISOString(),
      totalInstalled,
      totalAvailable: this.tools.length,
    };
  }

  private checkTool(tool: ToolDefinition): ToolInfo {
    const execPath = whichSync(tool.binaryNames);
    if (!execPath) {
      return { name: tool.name, installed: false, version: '', executablePath: '' };
    }
    const version = this.getVersion(tool);
    return { name: tool.name, installed: true, version, executablePath: execPath };
  }

  private getVersion(tool: ToolDefinition): string {
    try {
      const out = execSync(tool.versionCommand, { encoding: 'utf-8', timeout: 5000 }).trim();
      const match = out.match(tool.versionRegex);
      return match?.[1] ?? '';
    } catch {
      return '';
    }
  }
}
