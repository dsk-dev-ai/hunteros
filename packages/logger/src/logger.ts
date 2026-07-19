import { LogLevel, LogFormat, type LoggerConfig } from '@hunteros/shared';
import type { LogEntry, Logger as LoggerInterface } from './types.js';

const LOG_LEVELS: Record<LogLevel, number> = {
  [LogLevel.Debug]: 0,
  [LogLevel.Info]: 1,
  [LogLevel.Warn]: 2,
  [LogLevel.Error]: 3,
  [LogLevel.Silent]: 99,
};

export class ConsoleLogger implements LoggerInterface {
  private readonly config: LoggerConfig;
  private readonly moduleName: string;

  constructor(config: LoggerConfig, moduleName = 'hunteros') {
    this.config = config;
    this.moduleName = moduleName;
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.Debug, message, undefined, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.Info, message, undefined, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.Warn, message, undefined, meta);
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    this.log(LogLevel.Error, message, error, meta);
  }

  child(module: string): LoggerInterface {
    return new ConsoleLogger(this.config, `${this.moduleName}:${module}`);
  }

  private log(level: LogLevel, message: string, error?: Error, meta?: Record<string, unknown>): void {
    if (LOG_LEVELS[level] < LOG_LEVELS[this.config.level]) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      module: this.moduleName,
      error,
      metadata: meta,
    };

    const output = this.config.format === 'json'
      ? JSON.stringify(entry)
      : this.formatText(entry);

    if (this.config.output === 'stdout' || this.config.output === 'both') {
      if (level === LogLevel.Error) {
        console.error(output);
      } else {
        console.log(output);
      }
    }
  }

  private formatText(entry: LogEntry): string {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]${entry.module ? ` [${entry.module}]` : ''}`;
    const metaStr = entry.metadata && Object.keys(entry.metadata).length > 0
      ? ` ${JSON.stringify(entry.metadata)}`
      : '';
    const errorStr = entry.error ? `\n  Error: ${entry.error.message}` : '';
    return `${prefix} ${entry.message}${metaStr}${errorStr}`;
  }
}
