import { describe, it, expect } from 'vitest';
import { PluginManager } from '../src/plugin-manager.js';
import { createLogger } from '@hunteros/logger';
import { LogLevel, PluginType } from '@hunteros/shared';
import type { HunterOSPlugin, PluginHooks } from '../src/plugin-manager.js';

describe('PluginManager', () => {
  const logger = createLogger({ level: LogLevel.Silent });

  it('should register and list plugins', () => {
    const manager = new PluginManager(logger);
    const plugin: HunterOSPlugin = {
      manifest: {
        name: 'test-plugin', version: '1.0.0', description: 'Test plugin',
        entryPoint: 'index.js', type: PluginType.Analyzer, hooks: [],
      },
      initialize: async () => {},
      hooks: {},
    };

    manager.register(plugin);
    const plugins = manager.listPlugins();
    expect(plugins.length).toBe(1);
    expect(plugins[0]!.name).toBe('test-plugin');
  });

  it('should execute hooks', async () => {
    const manager = new PluginManager(logger);
    let hookExecuted = false;

    const plugin: HunterOSPlugin = {
      manifest: {
        name: 'hook-plugin', version: '1.0.0', description: '',
        entryPoint: 'index.js', type: PluginType.Analyzer, hooks: [],
      },
      initialize: async () => {},
      hooks: {
        'scan:before': async () => { hookExecuted = true; },
      } as Partial<PluginHooks>,
    };

    manager.register(plugin);
    await manager.executeHook('scan:before', { path: '/test' });
    expect(hookExecuted).toBe(true);
  });
});
