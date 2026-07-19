import { LogLevel, LogFormat, LogOutput, type LoggerConfig } from '@hunteros/shared';
import { ConsoleLogger } from './logger.js';
import type { Logger } from './types.js';

const defaultConfig: LoggerConfig = {
  level: LogLevel.Info,
  format: LogFormat.Pretty,
  output: LogOutput.Stdout,
};

export function createLogger(config?: Partial<LoggerConfig>, module?: string): Logger {
  const mergedConfig: LoggerConfig = { ...defaultConfig, ...config };
  return new ConsoleLogger(mergedConfig, module);
}
