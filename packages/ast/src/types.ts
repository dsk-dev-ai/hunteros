import type { ASTNode, ASTSummary, ASTNodeType } from '@hunteros/shared';

export interface ASTExtractor {
  supportedLanguages: string[];
  extract(filePath: string, content: string): ASTNode[];
  summarize(nodes: ASTNode[]): ASTSummary;
}

export interface PatternMatcher {
  name: string;
  pattern: RegExp | string;
  nodeType: ASTNodeType;
  extract(match: RegExpExecArray | string, filePath: string, line: number): ASTNode | null;
}
