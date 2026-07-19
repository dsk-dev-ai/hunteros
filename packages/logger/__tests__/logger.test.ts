import { describe, it, expect, vi } from 'vitest';
import { ConsoleLogger } from '../src/logger.js';
import { LogLevel, LogFormat, LogOutput } from '@hunteros/shared';

describe('ConsoleLogger', () => {
  const config = {
    level: LogLevel.Debug,
    format: LogFormat.Text as const,
    output: LogOutput.Stdout as const,
  };

  it('should log messages at appropriate level', () => {
    const logger = new ConsoleLogger(config);
    expect(() => logger.info('test message')).not.toThrow();
  });

  it('should create child loggers', () => {
    const logger = new ConsoleLogger(config);
    const child = logger.child('test-module');
    expect(() => child.info('child message')).not.toThrow();
  });
});
