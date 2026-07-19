import { describe, it, expect } from 'vitest';
import { TypeScriptExtractor } from '../src/extractors/typescript-extractor.js';
import { getExtractor } from '../src/extractor-factory.js';

describe('TypeScriptExtractor', () => {
  const extractor = new TypeScriptExtractor();

  it('should extract imports', () => {
    const content = `import { foo } from './bar';\nimport React from 'react';`;
    const nodes = extractor.extract('test.ts', content);
    const imports = nodes.filter((n) => n.type === 'import');
    expect(imports.length).toBeGreaterThanOrEqual(2);
  });

  it('should extract exports', () => {
    const content = 'export function hello() {}\nexport class World {}';
    const nodes = extractor.extract('test.ts', content);
    const exports = nodes.filter((n) => n.type === 'export');
    expect(exports.length).toBeGreaterThanOrEqual(2);
  });

  it('should extract classes', () => {
    const content = 'class MyClass {}';
    const nodes = extractor.extract('test.ts', content);
    expect(nodes.some((n) => n.type === 'class')).toBe(true);
  });

  it('should extract functions', () => {
    const content = 'function testFunc() {}';
    const nodes = extractor.extract('test.ts', content);
    expect(nodes.some((n) => n.type === 'function')).toBe(true);
  });

  it('should generate summaries', () => {
    const content = 'import {foo} from "bar";\nexport function hello() {}';
    const nodes = extractor.extract('test.ts', content);
    const summary = extractor.summarize(nodes);
    expect(summary.imports.length).toBeGreaterThan(0);
    expect(summary.functions.length).toBeGreaterThan(0);
  });
});

describe('ExtractorFactory', () => {
  it('should return extractor for TypeScript', () => {
    const extractor = getExtractor('typescript');
    expect(extractor).toBeDefined();
  });

  it('should return undefined for unsupported languages', () => {
    const extractor = getExtractor('python');
    expect(extractor).toBeUndefined();
  });
});
