import { describe, it, expect } from 'vitest';
import { ProjectGraphBuilder } from '../src/graph-builder.js';
import { createLogger } from '@hunteros/logger';
import { LogLevel, ASTNodeType } from '@hunteros/shared';
import type { ASTNode } from '@hunteros/shared';

describe('ProjectGraphBuilder', () => {
  const logger = createLogger({ level: LogLevel.Silent });

  it('should build a graph from AST nodes', () => {
    const builder = new ProjectGraphBuilder(logger);
    const nodesByFile = new Map<string, ASTNode[]>();

    nodesByFile.set('src/index.ts', [
      {
        id: '1', type: ASTNodeType.Import, name: './utils', filePath: 'src/index.ts',
        startLine: 1, endLine: 1, startColumn: 0, endColumn: 0, metadata: {}, children: [],
      },
      {
        id: '2', type: ASTNodeType.Function, name: 'main', filePath: 'src/index.ts',
        startLine: 3, endLine: 5, startColumn: 0, endColumn: 0, metadata: {}, children: [],
      },
    ]);

    const result = builder.build(nodesByFile);
    expect(result.nodes.length).toBeGreaterThan(0);
    expect(result.edges.length).toBeGreaterThanOrEqual(0);
  });

  it('should traverse graph', () => {
    const builder = new ProjectGraphBuilder(logger);
    const nodesByFile = new Map<string, ASTNode[]>();
    nodesByFile.set('src/a.ts', [
      {
        id: '1', type: ASTNodeType.Function, name: 'funcA', filePath: 'src/a.ts',
        startLine: 1, endLine: 1, startColumn: 0, endColumn: 0, metadata: {}, children: [],
      },
    ]);
    nodesByFile.set('src/b.ts', [
      {
        id: '2', type: ASTNodeType.Import, name: './a', filePath: 'src/b.ts',
        startLine: 1, endLine: 1, startColumn: 0, endColumn: 0, metadata: {}, children: [],
      },
    ]);

    builder.build(nodesByFile);
    expect(() => builder.traverse('file:src/a.ts')).not.toThrow();
  });
});
