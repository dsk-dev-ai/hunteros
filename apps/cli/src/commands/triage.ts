import { Command } from 'commander';
import { readFileSync, existsSync } from 'node:fs';
import { ResultTriage, VulnerabilityScanner } from '@hunteros/scanner';
import { createLogger } from '@hunteros/logger';
import type { VulnerabilityFinding } from '@hunteros/shared';

export const triageCommand = new Command('triage')
  .description('Triage vulnerability scan results from a JSON file')
  .argument('<file>', 'Path to scan results JSON file')
  .option('--ai', 'Use AI for triage (requires configured AI provider)')
  .action(async (file: string, options: { ai?: boolean }) => {
    const logger = createLogger({}, 'cli');

    if (!existsSync(file)) {
      logger.error(`File not found: ${file}`);
      process.exit(1);
    }

    const content = readFileSync(file, 'utf-8');
    let findings: VulnerabilityFinding[];
    try {
      const parsed = JSON.parse(content);
      findings = parsed.findings ?? parsed;
    } catch {
      logger.error('Invalid JSON file');
      process.exit(1);
    }

    logger.info(`Triaging ${findings.length} findings`);

    const triage = new ResultTriage();
    const results = triage.triage(findings);

    const realBugs = results.filter((r) => r.isRealBug);
    const falsePositives = results.filter((r) => !r.isRealBug);

    console.log('\n=== Triage Results ===\n');
    console.log(`Total Findings: ${results.length}`);
    console.log(`Confirmed Bugs: ${realBugs.length}`);
    console.log(`False Positives: ${falsePositives.length}\n`);

    if (realBugs.length > 0) {
      console.log('--- Confirmed Issues to Escalate ---\n');
      for (const bug of realBugs) {
        const finding = findings.find((f) => f.id === bug.findingId);
        console.log(`[${bug.severity.toUpperCase()}] ${finding?.title ?? bug.findingId}`);
        console.log(`  Priority: ${bug.priority}/100 | Confidence: ${bug.confidence}%`);
        console.log(`  Escalate: ${bug.escalationPath}`);
        console.log(`  Assignee: ${bug.suggestedAssignee}`);
        if (bug.notes) console.log(`  Notes: ${bug.notes}`);
        console.log('');
      }
    }

    if (falsePositives.length > 0) {
      console.log('--- False Positives (No Action Needed) ---\n');
      for (const fp of falsePositives) {
        const finding = findings.find((f) => f.id === fp.findingId);
        console.log(`- ${finding?.title ?? fp.findingId} (confidence: ${fp.confidence}%)`);
      }
    }
  });
