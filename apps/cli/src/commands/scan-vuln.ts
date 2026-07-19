import { Command } from 'commander';
import { VulnerabilityScanner, ToolRunner } from '@hunteros/scanner';
import { VulnJsonGenerator, VulnMarkdownGenerator } from '@hunteros/reports';
import { createLogger } from '@hunteros/logger';
import { writeFileSync } from 'node:fs';

export const scanVulnCommand = new Command('scan-vuln')
  .description('Run vulnerability scans using Kali Linux security tools')
  .argument('<target>', 'Target URL, IP, or hostname')
  .option('-p, --profile <profile>', 'Scan profile (quick, full, web, network, recon)', 'quick')
  .option('-o, --output <format>', 'Output format (json, markdown)', 'markdown')
  .option('--port <port>', 'Target port')
  .option('--save <path>', 'Save report to file')
  .option('--ai', 'Enable AI-powered analysis')
  .action(async (target: string, options: { profile: string; output: string; port?: string; save?: string; ai?: boolean }) => {
    const logger = createLogger({}, 'cli');
    logger.info(`Starting ${options.profile} vulnerability scan against ${target}`);

    const scanner = new VulnerabilityScanner(logger);
    const profiles = scanner.getScanProfiles();
    const profile = profiles.find((p) => p.name === options.profile) ?? profiles[0]!;

    const scanTargetType = target.startsWith('http') ? 'url' as const : target.match(/^\d+\.\d+\.\d+\.\d+$/) ? 'ip' as const : 'domain' as const;
    const scanTarget = {
      type: scanTargetType,
      value: target,
      port: options.port ? Number(options.port) : undefined,
    };

    const report = await scanner.scan([scanTarget], profile);

    let output: string;
    let ext: string;
    if (options.output === 'json') {
      const gen = new VulnJsonGenerator(logger);
      output = gen.generateVuln(report);
      ext = 'json';
    } else {
      const gen = new VulnMarkdownGenerator(logger);
      output = gen.generateVuln(report);
      ext = 'md';
    }

    if (options.save) {
      const savePath = options.save.endsWith(`.${ext}`) ? options.save : `${options.save}.${ext}`;
      writeFileSync(savePath, output, 'utf-8');
      logger.info(`Report saved to ${savePath}`);
    } else {
      console.log(output);
    }

    console.log(`\nScan complete: ${report.summary.confirmedBugs} confirmed issues, ${report.summary.falsePositives} false positives`);
    console.log(`Tools used: ${report.summary.toolsUsed.join(', ')}`);
    console.log(`Duration: ${(report.summary.durationMs / 1000).toFixed(1)}s`);
  });
