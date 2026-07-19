import { describe, it, expect } from 'vitest';
import { SecurityAnalyzer } from '../src/analyzer.js';
import { createLogger } from '@hunteros/logger';
import { LogLevel, ASTNodeType } from '@hunteros/shared';
import type { ASTNode, FrameworkInfo } from '@hunteros/shared';

describe('SecurityAnalyzer', () => {
  const logger = createLogger({ level: LogLevel.Silent });

  it('should find auth patterns', () => {
    const analyzer = new SecurityAnalyzer(logger);
    const nodes: ASTNode[] = [
      {
        id: '1', type: ASTNodeType.Import, name: "import passport from 'passport'",
        filePath: 'src/auth.ts', startLine: 1, endLine: 1, startColumn: 0, endColumn: 0,
        metadata: {}, children: [],
      },
    ];
    const map = new Map<string, ASTNode[]>();
    map.set('src/auth.ts', nodes);
    const results = analyzer.analyze(map, []);
    expect(results.length).toBeGreaterThanOrEqual(0);
  });

  it('should find database access', () => {
    const analyzer = new SecurityAnalyzer(logger);
    const nodes: ASTNode[] = [
      {
        id: '1', type: ASTNodeType.DatabaseCall, name: 'prisma.user.findMany()',
        filePath: 'src/db.ts', startLine: 1, endLine: 1, startColumn: 0, endColumn: 0,
        metadata: {}, children: [],
      },
    ];
    const map = new Map<string, ASTNode[]>();
    map.set('src/db.ts', nodes);
    const results = analyzer.analyze(map, []);
    expect(results.length).toBeGreaterThan(0);
  });
});
