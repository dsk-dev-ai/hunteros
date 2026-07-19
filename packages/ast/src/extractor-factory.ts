import type { ASTExtractor } from './types.js';
import { TypeScriptExtractor } from './extractors/typescript-extractor.js';

const extractors: ASTExtractor[] = [
  new TypeScriptExtractor(),
];

export function getExtractor(language: string): ASTExtractor | undefined {
  return extractors.find((e) => e.supportedLanguages.includes(language));
}

export function registerExtractor(extractor: ASTExtractor): void {
  extractors.push(extractor);
}

export function getSupportedLanguages(): string[] {
  return extractors.flatMap((e) => e.supportedLanguages);
}
