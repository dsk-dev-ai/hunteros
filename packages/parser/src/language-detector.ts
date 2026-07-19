import { extname } from 'node:path';

const LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescriptreact',
  '.js': 'javascript',
  '.jsx': 'javascriptreact',
  '.py': 'python',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
  '.rb': 'ruby',
  '.php': 'php',
  '.cs': 'csharp',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.vue': 'vue',
  '.svelte': 'svelte',
  '.c': 'c',
  '.cpp': 'cpp',
  '.h': 'c',
  '.hpp': 'cpp',
  '.sql': 'sql',
  '.sh': 'shell',
  '.bash': 'shell',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.json': 'json',
  '.toml': 'toml',
  '.md': 'markdown',
  '.css': 'css',
  '.scss': 'scss',
  '.less': 'less',
  '.html': 'html',
  '.dockerfile': 'dockerfile',
  '.graphql': 'graphql',
  '.gql': 'graphql',
  '.proto': 'protobuf',
};

const GENERATED_PATTERNS = [
  /\.(min|bundle)\.(js|css)$/,
  /\.generated\./,
  /\.d\.ts$/,
  /polyfills?/,
  /vendor/,
];

const TEST_PATTERNS = [
  /\.(test|spec|e2e|integration)\./,
  /__tests__/,
  /__mocks__/,
  /\.test\./,
  /\.spec\./,
];

const CONFIG_FILES = new Set([
  'package.json', 'tsconfig.json', '.eslintrc.js', '.eslintrc.json',
  'biome.json', 'prettierrc', '.prettierrc', 'jest.config.js',
  'vite.config.ts', 'next.config.js', 'webpack.config.js',
  'docker-compose.yml', 'Dockerfile', '.env', '.env.example',
  'pnpm-workspace.yaml', 'turbo.json', '.gitignore',
]);

export function detectLanguage(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  return LANGUAGE_MAP[ext] ?? 'unknown';
}

export function isGenerated(filePath: string): boolean {
  return GENERATED_PATTERNS.some((p) => p.test(filePath));
}

export function isTestFile(filePath: string): boolean {
  return TEST_PATTERNS.some((p) => p.test(filePath));
}

export function isConfigFile(filePath: string): boolean {
  const basename = filePath.split('/').pop() ?? '';
  return CONFIG_FILES.has(basename);
}

export function getLanguageFromContent(filePath: string, content: string): string {
  const lang = detectLanguage(filePath);
  if (lang !== 'unknown') return lang;
  if (content.startsWith('#!/usr/bin/env')) return 'shell';
  if (content.includes('FROM ') && content.includes('RUN ')) return 'dockerfile';
  return 'unknown';
}
