import { Command } from 'commander';

export const graphCommand = new Command('graph')
  .description('Generate and display dependency graph')
  .argument('[path]', 'Path to repository', '.')
  .option('-f, --format <format>', 'Output format (json, dot)', 'json')
  .option('--focus <node>', 'Focus on a specific node')
  .option('--depth <number>', 'Traversal depth', '3')
  .action(async (path: string, options: { format: string; focus?: string; depth: string }) => {
    console.log(`Graph command: path=${path}, format=${options.format}, focus=${options.focus ?? 'none'}`);
    console.log('Use "hunteros scan --graph" to first build the graph, then run this command.');
  });
