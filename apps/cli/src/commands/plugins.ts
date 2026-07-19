import { Command } from 'commander';
import { createLogger } from '@hunteros/logger';
import { PluginManager } from '@hunteros/plugins';
import { LogLevel } from '@hunteros/shared';

export const pluginsCommand = new Command('plugins')
  .description('Manage HunterOS plugins')
  .option('-l, --list', 'List installed plugins')
  .option('-i, --install <path>', 'Install a plugin from path')
  .option('-d, --dir <path>', 'Plugin directory to load from', './plugins')
  .action(async (options: { list?: boolean; install?: string; dir: string }) => {
    const logger = createLogger({ level: LogLevel.Info });
    const manager = new PluginManager(logger);

    if (options.list) {
      const plugins = manager.listPlugins();
      if (plugins.length === 0) {
        logger.info('No plugins installed');
      } else {
        for (const p of plugins) {
          logger.info(`${p.name} v${p.version} - ${p.description}`);
        }
      }
    }

    if (options.install) {
      const plugin = await manager.loadPlugin(options.install);
      if (plugin) {
        logger.info(`Installed plugin: ${plugin.manifest.name}`);
      }
    }

    const loaded = await manager.loadPluginsFromDirectory(options.dir);
    logger.info(`Loaded ${loaded.length} plugin(s) from ${options.dir}`);
  });
