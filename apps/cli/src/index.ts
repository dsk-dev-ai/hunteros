#!/usr/bin/env node
import { Command } from 'commander';
import { scanCommand } from './commands/scan.js';
import { graphCommand } from './commands/graph.js';
import { reportCommand } from './commands/report.js';
import { summarizeCommand } from './commands/summarize.js';
import { diffCommand } from './commands/diff.js';
import { pluginsCommand } from './commands/plugins.js';

const program = new Command();

program
  .name('hunteros')
  .description('Repository intelligence platform for security researchers')
  .version('0.1.0');

program.addCommand(scanCommand);
program.addCommand(graphCommand);
program.addCommand(reportCommand);
program.addCommand(summarizeCommand);
program.addCommand(diffCommand);
program.addCommand(pluginsCommand);

program.parse(process.argv);
