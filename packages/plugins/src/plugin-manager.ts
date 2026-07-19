import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { PluginManifest } from '@hunteros/shared';
import { PluginType } from '@hunteros/shared';
import type { Logger } from '@hunteros/logger';

export interface HunterOSPlugin {
  manifest: PluginManifest;
  initialize(context: PluginContext): Promise<void>;
  hooks: Partial<PluginHooks>;
}

export interface PluginContext {
  logger: Logger;
  config: Record<string, unknown>;
}

export interface PluginHooks {
  'scan:before': (params: ScanBeforeParams) => Promise<void>;
  'scan:after': (params: ScanAfterParams) => Promise<void>;
  'analyze:before': (params: AnalyzeBeforeParams) => Promise<void>;
  'analyze:after': (params: AnalyzeAfterParams) => Promise<void>;
  'report:before': (params: ReportBeforeParams) => Promise<void>;
  'report:after': (params: ReportAfterParams) => Promise<void>;
}

export interface ScanBeforeParams { path: string }
export interface ScanAfterParams { files: string[] }
export interface AnalyzeBeforeParams { files: string[] }
export interface AnalyzeAfterParams { findings: unknown[] }
export interface ReportBeforeParams { format: string }
export interface ReportAfterParams { report: unknown }

export class PluginManager {
  private plugins: Map<string, HunterOSPlugin> = new Map();
  private logger: Logger;
  private hookRegistry: Map<string, Array<(params: unknown) => Promise<void>>> = new Map();

  constructor(logger: Logger) {
    this.logger = logger;
  }

  register(plugin: HunterOSPlugin): void {
    const name = plugin.manifest.name;
    this.plugins.set(name, plugin);

    const hooks = plugin.hooks;
    for (const [hookName, handler] of Object.entries(hooks)) {
      if (handler) {
        if (!this.hookRegistry.has(hookName)) {
          this.hookRegistry.set(hookName, []);
        }
        this.hookRegistry.get(hookName)!.push(handler as (params: unknown) => Promise<void>);
      }
    }

    this.logger.info(`Registered plugin: ${name} v${plugin.manifest.version}`);
  }

  async loadPlugin(pluginPath: string): Promise<HunterOSPlugin | null> {
    const resolvedPath = resolve(pluginPath);
    if (!existsSync(resolvedPath)) {
      this.logger.error(`Plugin not found: ${resolvedPath}`);
      return null;
    }

    try {
      const pluginModule = await import(resolvedPath);
      const plugin = pluginModule.default as HunterOSPlugin;
      if (!plugin?.manifest) {
        this.logger.error(`Invalid plugin: ${resolvedPath} - no manifest`);
        return null;
      }

      await plugin.initialize({
        logger: this.logger.child(`plugin:${plugin.manifest.name}`),
        config: {},
      });

      this.register(plugin);
      return plugin;
    } catch (error) {
      this.logger.error(`Failed to load plugin: ${resolvedPath}`, error as Error);
      return null;
    }
  }

  async loadPluginsFromDirectory(dirPath: string): Promise<HunterOSPlugin[]> {
    const loaded: HunterOSPlugin[] = [];
    if (!existsSync(dirPath)) return loaded;

    const entries = readdirSync(dirPath);
    for (const entry of entries) {
      if (entry.endsWith('.js') || entry.endsWith('.mjs')) {
        const plugin = await this.loadPlugin(join(dirPath, entry));
        if (plugin) loaded.push(plugin);
      }
    }

    return loaded;
  }

  async executeHook<T>(hookName: string, params: T): Promise<void> {
    const handlers = this.hookRegistry.get(hookName);
    if (!handlers) return;

    for (const handler of handlers) {
      try {
        await handler(params);
      } catch (error) {
        this.logger.error(`Plugin hook ${hookName} failed`, error as Error);
      }
    }
  }

  getPlugin(name: string): HunterOSPlugin | undefined {
    return this.plugins.get(name);
  }

  listPlugins(): PluginManifest[] {
    return Array.from(this.plugins.values()).map((p) => p.manifest);
  }
}
