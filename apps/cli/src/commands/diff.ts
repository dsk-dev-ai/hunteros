import { Command } from 'commander';

export const diffCommand = new Command('diff')
  .description('Compare two scans or branches')
  .argument('<scan1>', 'First scan result file')
  .argument('<scan2>', 'Second scan result file')
  .option('-f, --format <format>', 'Output format (json, text)', 'text')
  .action(async (scan1: string, scan2: string, options: { format: string }) => {
    console.log(`Diff: comparing ${scan1} vs ${scan2} (format: ${options.format})`);
    console.log('Diff functionality will compare findings between two scan results.');
  });
