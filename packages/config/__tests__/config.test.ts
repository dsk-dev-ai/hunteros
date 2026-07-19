import { describe, it, expect } from 'vitest';
import { ConfigManager } from '../src/config.js';
import { createLogger } from '@hunteros/logger';
import { LogLevel } from '@hunteros/shared';

describe('ConfigManager', () => {
  const logger = createLogger({ level: LogLevel.Silent });

  it('should provide default scan configuration', () => {
    const config = new ConfigManager(logger);
    const scanConfig = config.getScanConfig();
    expect(scanConfig.depth).toBe(3);
    expect(scanConfig.ignorePatterns).toContain('node_modules');
  });

  it('should merge overrides', () => {
    const config = new ConfigManager(logger);
    const scanConfig = config.getScanConfig({ depth: 5, path: '/test' });
    expect(scanConfig.depth).toBe(5);
    expect(scanConfig.path).toBe('/test');
  });

  it('should get AI config with defaults', () => {
    const config = new ConfigManager(logger);
    const aiConfig = config.getAiConfig();
    expect(aiConfig.model).toBe('gpt-4');
  });
});
