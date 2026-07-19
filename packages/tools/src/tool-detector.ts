import { execSync } from 'node:child_process';
import { whichSync } from './which.js';
import { createLogger } from '@hunteros/logger';
import type { Logger } from '@hunteros/logger';
import type { ToolInfo, ToolReport } from './types.js';
import { KALI_TOOLS } from './kali-tools.js';

export interface ToolDefinition {
  name: string;
  versionCommand: string;
  versionRegex: RegExp;
  binaryNames: string[];
  category?: 'development' | 'security' | 'kali' | 'network' | 'web' | 'crypto' | 'forensics' | 'recon';
}

const DEV_TOOLS: ToolDefinition[] = [
  { name: 'Git', versionCommand: 'git --version', versionRegex: /git version (\S+)/i, binaryNames: ['git'], category: 'development' },
  { name: 'Docker', versionCommand: 'docker --version', versionRegex: /Docker version (\S+)/i, binaryNames: ['docker'], category: 'development' },
  { name: 'Docker Compose', versionCommand: 'docker compose version', versionRegex: /Docker Compose version (\S+)/i, binaryNames: ['docker'], category: 'development' },
  { name: 'Node.js', versionCommand: 'node --version', versionRegex: /v?(\d+\.\d+\.\d+)/, binaryNames: ['node'], category: 'development' },
  { name: 'npm', versionCommand: 'npm --version', versionRegex: /(\d+\.\d+\.\d+)/, binaryNames: ['npm'], category: 'development' },
  { name: 'pnpm', versionCommand: 'pnpm --version', versionRegex: /(\d+\.\d+\.\d+)/, binaryNames: ['pnpm'], category: 'development' },
  { name: 'Python', versionCommand: 'python3 --version', versionRegex: /Python (\d+\.\d+\.\d+)/i, binaryNames: ['python3', 'python'], category: 'development' },
  { name: 'Go', versionCommand: 'go version', versionRegex: /go version go(\S+)/i, binaryNames: ['go'], category: 'development' },
  { name: 'Rust', versionCommand: 'rustc --version', versionRegex: /rustc (\d+\.\d+\.\d+)/i, binaryNames: ['rustc'], category: 'development' },
  { name: 'Java', versionCommand: 'java -version 2>&1', versionRegex: /(\d+\.\d+\.\d+)/, binaryNames: ['java'], category: 'development' },
  { name: 'PostgreSQL', versionCommand: 'psql --version', versionRegex: /psql \(PostgreSQL\) (\d+\.\d+)/i, binaryNames: ['psql'], category: 'development' },
  { name: 'SQLite', versionCommand: 'sqlite3 --version', versionRegex: /(\d+\.\d+\.\d+)/, binaryNames: ['sqlite3'], category: 'development' },
  { name: 'Tree-sitter', versionCommand: 'tree-sitter --version', versionRegex: /tree-sitter (\S+)/i, binaryNames: ['tree-sitter'], category: 'development' },
  { name: 'Semgrep', versionCommand: 'semgrep --version', versionRegex: /(\d+\.\d+\.\d+)/, binaryNames: ['semgrep'], category: 'security' },
  { name: 'CodeQL', versionCommand: 'codeql version', versionRegex: /CodeQL CLI version (\S+)/i, binaryNames: ['codeql'], category: 'security' },
  { name: 'Trivy', versionCommand: 'trivy --version', versionRegex: /Version: (\S+)/i, binaryNames: ['trivy'], category: 'security' },
  { name: 'Gitleaks', versionCommand: 'gitleaks version', versionRegex: /(\d+\.\d+\.\d+)/, binaryNames: ['gitleaks'], category: 'security' },
  { name: 'TruffleHog', versionCommand: 'trufflehog --version', versionRegex: /(\d+\.\d+\.\d+)/, binaryNames: ['trufflehog'], category: 'security' },
];

export const ALL_TOOLS: ToolDefinition[] = [...DEV_TOOLS, ...KALI_TOOLS];

export class ToolDetector {
  private logger: Logger;
  private tools: ToolDefinition[];

  constructor(tools?: ToolDefinition[], logger?: Logger) {
    this.logger = logger ?? createLogger({}, 'tool-detector');
    this.tools = tools ?? ALL_TOOLS;
  }

  async detect(category?: string): Promise<ToolReport> {
    this.logger.info('Detecting installed development and security tools');
    const filtered = category ? this.tools.filter((t) => t.category === category) : this.tools;
    const results: ToolInfo[] = [];
    for (const tool of filtered) {
      results.push(this.checkTool(tool));
    }
    const totalInstalled = results.filter((t) => t.installed).length;
    return {
      tools: results,
      timestamp: new Date().toISOString(),
      totalInstalled,
      totalAvailable: filtered.length,
    };
  }

  private checkTool(tool: ToolDefinition): ToolInfo {
    const execPath = whichSync(tool.binaryNames);
    if (!execPath) {
      return { name: tool.name, installed: false, version: '', executablePath: '', category: tool.category };
    }
    const version = this.getVersion(tool);
    return { name: tool.name, installed: true, version, executablePath: execPath, category: tool.category };
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
