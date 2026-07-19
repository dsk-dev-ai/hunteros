import type { ASTNode, AnalysisResult, Finding, FrameworkInfo } from '@hunteros/shared';
import { FindingType, Severity, FindingCategory, ASTNodeType } from '@hunteros/shared';
import type { Logger } from '@hunteros/logger';

export interface Analyzer {
  name: string;
  analyze(nodes: ASTNode[], filePath: string, frameworks: FrameworkInfo[]): Finding[];
  priority(): number;
}

export class SecurityAnalyzer {
  private logger: Logger;
  private analyzers: Analyzer[];

  constructor(logger: Logger) {
    this.logger = logger;
    this.analyzers = [
      new AuthAnalyzer(),
      new SecretsAnalyzer(),
      new DatabaseAnalyzer(),
      new FileSystemAnalyzer(),
      new NetworkAnalyzer(),
      new CryptographyAnalyzer(),
      new UploadAnalyzer(),
      new ConfigAnalyzer(),
    ];
  }

  registerAnalyzer(analyzer: Analyzer): void {
    this.analyzers.push(analyzer);
    this.analyzers.sort((a, b) => b.priority() - a.priority());
  }

  analyze(nodesByFile: Map<string, ASTNode[]>, frameworks: FrameworkInfo[]): AnalysisResult[] {
    this.logger.info('Running security analyzers');
    const results: AnalysisResult[] = [];

    for (const [filePath, nodes] of nodesByFile) {
      const findings: Finding[] = [];

      for (const analyzer of this.analyzers) {
        try {
          const analyzerFindings = analyzer.analyze(nodes, filePath, frameworks);
          findings.push(...analyzerFindings);
        } catch (error) {
          this.logger.error(`Analyzer ${analyzer.name} failed for ${filePath}`, error as Error);
        }
      }

      if (findings.length > 0) {
        const score = this.calculateScore(findings);
        results.push({
          filePath,
          findings,
          score,
          metadata: { analyzerCount: this.analyzers.length },
        });
      }
    }

    this.logger.info(`Analysis complete: ${results.length} files with findings`);
    return results;
  }

  private calculateScore(findings: Finding[]): number {
    let score = 0;
    for (const finding of findings) {
      score += finding.reviewPriority;
    }
    return Math.min(score, 100);
  }
}

class AuthAnalyzer implements Analyzer {
  name = 'auth';
  priority(): number { return 100; }

  analyze(nodes: ASTNode[], filePath: string, frameworks: FrameworkInfo[]): Finding[] {
    const findings: Finding[] = [];
    const content = nodes.map((n) => n.name).join('\n');

    const authPatterns = [
      { pattern: /passport|jwt|oauth|session|cookie|token|login|logout|signup|register/i, type: FindingType.AuthModule, cat: FindingCategory.Authentication },
      { pattern: /authenticate|authorize|role|permission|acl|guard|canActivate|isAuthenticated/i, type: FindingType.AuthLogic, cat: FindingCategory.Authorization },
      { pattern: /bcrypt|argon|scrypt|hash|password|salt/i, type: FindingType.Cryptography, cat: FindingCategory.Cryptography },
    ];

    for (const { pattern, type, cat } of authPatterns) {
      const matches = content.match(new RegExp(pattern.source, 'gi'));
      if (matches) {
        findings.push({
          id: `${filePath}:${type}`,
          type,
          severity: matches.length > 3 ? Severity.High : Severity.Medium,
          message: `Found ${matches.length} auth-related pattern(s): ${type}`,
          filePath,
          startLine: 1,
          endLine: 1,
          category: cat,
          reviewPriority: matches.length * 10,
          metadata: { matches: matches.length, pattern: pattern.source },
        });
      }
    }

    return findings;
  }
}

class SecretsAnalyzer implements Analyzer {
  name = 'secrets';
  priority(): number { return 90; }

  analyze(nodes: ASTNode[], filePath: string): Finding[] {
    const findings: Finding[] = [];
    const content = nodes.map((n) => n.name).join('\n');

    const secretPatterns = [
      /(?:api[_-]?key|apikey|secret|password|passwd|token|auth[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i,
      /process\.env\.(?:API_KEY|SECRET|DATABASE_URL|JWT_SECRET|STRIPE|AWS)/,
      /['"](?:sk-[a-zA-Z0-9]+|pk-[a-zA-Z0-9]+|ghp_[a-zA-Z0-9]+)['"]/,
      /(?:-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----)/,
    ];

    for (const pattern of secretPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        findings.push({
          id: `${filePath}:secrets:${matches[0]!.substring(0, 20)}`,
          type: FindingType.Secrets,
          severity: Severity.Critical,
          message: `Potential secrets exposure: ${matches[0]!.substring(0, 50)}...`,
          filePath,
          startLine: 1,
          endLine: 1,
          category: FindingCategory.Secrets,
          reviewPriority: 90,
          metadata: { pattern: pattern.source },
        });
      }
    }

    return findings;
  }
}

class DatabaseAnalyzer implements Analyzer {
  name = 'database';
  priority(): number { return 70; }

  analyze(nodes: ASTNode[], filePath: string): Finding[] {
    const findings: Finding[] = [];
    const dbNodes = nodes.filter((n) => n.type === ASTNodeType.DatabaseCall);

    if (dbNodes.length > 0) {
      findings.push({
        id: `${filePath}:database`,
        type: FindingType.DatabaseAccess,
        severity: dbNodes.length > 5 ? Severity.High : Severity.Medium,
        message: `Found ${dbNodes.length} database access pattern(s)`,
        filePath,
        startLine: dbNodes[0]!.startLine,
        endLine: dbNodes[dbNodes.length - 1]!.endLine,
        category: FindingCategory.DataAccess,
        reviewPriority: Math.min(dbNodes.length * 5, 50),
        metadata: { dbCallCount: dbNodes.length },
      });
    }

    return findings;
  }
}

class FileSystemAnalyzer implements Analyzer {
  name = 'filesystem';
  priority(): number { return 60; }

  analyze(nodes: ASTNode[], filePath: string): Finding[] {
    const findings: Finding[] = [];
    const fsNodes = nodes.filter((n) => n.type === ASTNodeType.FileSystemAccess);

    if (fsNodes.length > 0) {
      findings.push({
        id: `${filePath}:filesystem`,
        type: FindingType.FileSystemAccess,
        severity: fsNodes.length > 3 ? Severity.High : Severity.Medium,
        message: `Found ${fsNodes.length} filesystem access pattern(s)`,
        filePath,
        startLine: fsNodes[0]!.startLine,
        endLine: fsNodes[fsNodes.length - 1]!.endLine,
        category: FindingCategory.FileSystem,
        reviewPriority: Math.min(fsNodes.length * 8, 60),
        metadata: { fsAccessCount: fsNodes.length },
      });
    }

    return findings;
  }
}

class NetworkAnalyzer implements Analyzer {
  name = 'network';
  priority(): number { return 50; }

  analyze(nodes: ASTNode[], filePath: string): Finding[] {
    const findings: Finding[] = [];
    const content = nodes.map((n) => n.name).join('\n');
    const httpPattern = nodes.filter((n) => n.type === ASTNodeType.HttpHandler);

    if (httpPattern.length > 0 || /axios\.|fetch\(|http\.|https\.|request\(|got\(|superagent/.test(content)) {
      findings.push({
        id: `${filePath}:network`,
        type: FindingType.NetworkAccess,
        severity: Severity.Medium,
        message: `Network access detected (${httpPattern.length} HTTP handlers)`,
        filePath,
        startLine: 1,
        endLine: 1,
        category: FindingCategory.Network,
        reviewPriority: Math.min(httpPattern.length * 5, 40),
        metadata: { httpHandlerCount: httpPattern.length },
      });
    }

    return findings;
  }
}

class CryptographyAnalyzer implements Analyzer {
  name = 'cryptography';
  priority(): number { return 80; }

  analyze(nodes: ASTNode[], filePath: string): Finding[] {
    const findings: Finding[] = [];
    const content = nodes.map((n) => n.name).join('\n');

    const cryptoPatterns = [
      /crypto\./,
      /createCipher/,
      /createDecipher/,
      /createHash/,
      /randomBytes/,
      /publicEncrypt/,
      /privateDecrypt/,
      /sign\(/,
      /verify\(/,
      /encrypt|decrypt/,
    ];

    const matches: string[] = [];
    for (const pattern of cryptoPatterns) {
      const lineMatches = content.match(pattern);
      if (lineMatches) matches.push(...lineMatches);
    }

    if (matches.length > 0) {
      findings.push({
        id: `${filePath}:crypto`,
        type: FindingType.Cryptography,
        severity: Severity.Medium,
        message: `Cryptography usage detected (${matches.length} pattern(s))`,
        filePath,
        startLine: 1,
        endLine: 1,
        category: FindingCategory.Cryptography,
        reviewPriority: Math.min(matches.length * 7, 50),
        metadata: { cryptoCount: matches.length },
      });
    }

    return findings;
  }
}

class UploadAnalyzer implements Analyzer {
  name = 'upload';
  priority(): number { return 75; }

  analyze(nodes: ASTNode[], filePath: string): Finding[] {
    const findings: Finding[] = [];
    const content = nodes.map((n) => n.name).join('\n');

    const uploadPatterns = [
      /multer/,
      /upload/,
      /fileInput/,
      /formidable/,
      /busboy/,
      /multipart/,
      /\.pdf|\.exe|\.zip|\.doc/,
      /createWriteStream/,
    ];

    for (const pattern of uploadPatterns) {
      if (pattern.test(content)) {
        findings.push({
          id: `${filePath}:upload`,
          type: FindingType.UploadHandler,
          severity: Severity.High,
          message: `File upload handler detected`,
          filePath,
          startLine: 1,
          endLine: 1,
          category: FindingCategory.InputValidation,
          reviewPriority: 70,
          metadata: { pattern: pattern.source },
        });
        break;
      }
    }

    return findings;
  }
}

class ConfigAnalyzer implements Analyzer {
  name = 'configuration';
  priority(): number { return 40; }

  analyze(nodes: ASTNode[], filePath: string): Finding[] {
    const findings: Finding[] = [];
    const content = nodes.map((n) => n.name).join('\n');

    const configPatterns = [
      /\.env/,
      /config\(/,
      /configuration/,
      /settings/,
      /app\.set\(/,
      /set\(['"]/,
    ];

    let configCount = 0;
    for (const pattern of configPatterns) {
      const matches = content.match(new RegExp(pattern.source, 'gi'));
      if (matches) configCount += matches.length;
    }

    if (configCount > 0) {
      findings.push({
        id: `${filePath}:config`,
        type: FindingType.Configuration,
        severity: Severity.Low,
        message: `Configuration usage detected (${configCount} pattern(s))`,
        filePath,
        startLine: 1,
        endLine: 1,
        category: FindingCategory.Configuration,
        reviewPriority: configCount * 3,
        metadata: { configCount },
      });
    }

    return findings;
  }
}
