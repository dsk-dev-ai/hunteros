import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ScanConfig, LoggerConfig, AIProviderConfig } from '@hunteros/shared';
import type { Logger } from '@hunteros/logger';
import { LogLevel, LogFormat, LogOutput } from '@hunteros/shared';

export interface HunterOSConfig {
  scan: Partial<ScanConfig>;
  logger: Partial<LoggerConfig>;
  ai: Partial<AIProviderConfig>;
  plugins: string[];
}

const defaultConfig: HunterOSConfig = {
  scan: {
    depth: 3,
    ignorePatterns: ['node_modules', 'dist', '.git', 'build', 'coverage'],
    includePatterns: ['**/*.ts', '**/*.js', '**/*.tsx', '**/*.jsx', '**/*.py', '**/*.go', '**/*.rs'],
    maxFileSize: 1024 * 1024,
    enableAst: true,
    enableGraph: true,
    enableAi: false,
  },
  logger: {
    level: LogLevel.Info,
    format: LogFormat.Pretty,
    output: LogOutput.Stdout,
  },
  ai: {
    name: 'openai',
    model: 'gpt-4',
    maxTokens: 4096,
    temperature: 0.3,
  },
  plugins: [],
};

export class ConfigManager {
  private config: HunterOSConfig;
  private logger: Logger;

  constructor(logger: Logger, initial?: Partial<HunterOSConfig>) {
    this.logger = logger;
    this.config = this.mergeConfig(defaultConfig, initial ?? {});
  }

  get<K extends keyof HunterOSConfig>(key: K): HunterOSConfig[K] {
    return this.config[key];
  }

  getScanConfig(overrides?: Partial<ScanConfig>): ScanConfig {
    const defaults: ScanConfig = {
      path: '.',
      depth: 3,
      ignorePatterns: ['node_modules', 'dist', '.git', 'build', 'coverage'],
      includePatterns: ['**/*.ts', '**/*.js', '**/*.tsx', '**/*.jsx', '**/*.py', '**/*.go', '**/*.rs'],
      maxFileSize: 1024 * 1024,
      enableAst: true,
      enableGraph: true,
      enableAi: false,
      frameworks: [],
    };
    return { ...defaults, ...this.config.scan, ...overrides };
  }

  getLoggerConfig(): LoggerConfig {
    return {
      level: LogLevel.Info,
      format: LogFormat.Pretty,
      output: LogOutput.Stdout,
      ...this.config.logger,
    };
  }

  getAiConfig(): AIProviderConfig {
    return {
      name: 'openai',
      model: 'gpt-4',
      maxTokens: 4096,
      temperature: 0.3,
      apiKey: '',
      ...this.config.ai,
    };
  }

  loadFromFile(filePath?: string): void {
    const configPath = filePath ?? this.resolveConfigPath();
    if (!configPath || !existsSync(configPath)) {
      this.logger.debug('No config file found, using defaults');
      return;
    }

    try {
      const content = readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(content) as Partial<HunterOSConfig>;
      this.config = this.mergeConfig(this.config, parsed);
      this.logger.info(`Loaded config from ${configPath}`);
    } catch (error) {
      this.logger.error(`Failed to load config from ${configPath}`, error as Error);
    }
  }

  private resolveConfigPath(): string | undefined {
    const candidates = [
      '.hunterosrc',
      '.hunterosrc.json',
      'hunteros.config.json',
      '.hunterosrc.js',
    ];
    for (const candidate of candidates) {
      const fullPath = join(process.cwd(), candidate);
      if (existsSync(fullPath)) return fullPath;
    }
    return undefined;
  }

  private mergeConfig(base: HunterOSConfig, override: Partial<HunterOSConfig>): HunterOSConfig {
    return {
      scan: { ...base.scan, ...override.scan },
      logger: { ...base.logger, ...override.logger },
      ai: { ...base.ai, ...override.ai },
      plugins: override.plugins ?? base.plugins,
    };
  }
}
