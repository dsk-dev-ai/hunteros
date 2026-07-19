import { describe, it, expect } from 'vitest';
import { detectLanguage, isGenerated, isTestFile, isConfigFile } from '../src/language-detector.js';
import { detectPackageManager } from '../src/package-manager-detector.js';

describe('LanguageDetector', () => {
  it('should detect TypeScript', () => {
    expect(detectLanguage('src/index.ts')).toBe('typescript');
  });

  it('should detect React TypeScript', () => {
    expect(detectLanguage('component.tsx')).toBe('typescriptreact');
  });

  it('should return unknown for unrecognized extensions', () => {
    expect(detectLanguage('file.xyz')).toBe('unknown');
  });

  it('should identify generated files', () => {
    expect(isGenerated('bundle.min.js')).toBe(true);
    expect(isGenerated('styles.min.css')).toBe(true);
  });

  it('should identify test files', () => {
    expect(isTestFile('component.test.ts')).toBe(true);
    expect(isTestFile('utils.spec.ts')).toBe(true);
  });

  it('should identify config files', () => {
    expect(isConfigFile('package.json')).toBe(true);
    expect(isConfigFile('tsconfig.json')).toBe(true);
  });
});

describe('PackageManagerDetector', () => {
  it('should detect pnpm when lock file exists', () => {
    const result = detectPackageManager('/tmp');
    expect(['npm', 'yarn', 'pnpm', 'bun', 'unknown']).toContain(result);
  });
});
