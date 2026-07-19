import { Command } from 'commander';
import { createLogger } from '@hunteros/logger';
import { JsonReportGenerator, MarkdownReportGenerator } from '@hunteros/reports';
import { LogLevel } from '@hunteros/shared';

export const reportCommand = new Command('report')
  .description('Generate analysis report')
  .argument('<file>', 'Input analysis file (JSON)')
  .option('-f, --format <format>', 'Report format (json, markdown)', 'markdown')
  .option('-o, --output <file>', 'Output file path')
  .action(async (file: string, options: { format: string; output?: string }) => {
    const logger = createLogger({ level: LogLevel.Info });
    logger.info(`Generating ${options.format} report from ${file}`);

    try {
      const { readFileSync } = await import('node:fs');
      const { writeFileSync } = await import('node:fs');
      const context = JSON.parse(readFileSync(file, 'utf-8'));

      const generator = options.format === 'markdown'
        ? new MarkdownReportGenerator(logger)
        : new JsonReportGenerator(logger);

      const report = generator.generate(context);
      const outputPath = options.output ?? `report.${options.format === 'markdown' ? 'md' : 'json'}`;
      writeFileSync(outputPath, JSON.stringify(report, null, 2));
      logger.info(`Report written to ${outputPath}`);
    } catch (error) {
      logger.error('Failed to generate report', error as Error);
    }
  });
