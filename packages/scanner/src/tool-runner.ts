import { execSync } from 'node:child_process';
import { createLogger } from '@hunteros/logger';
import type { Logger } from '@hunteros/logger';
import type { ToolRunResult } from '@hunteros/shared';

export class ToolRunner {
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger ?? createLogger({}, 'tool-runner');
  }

  run(toolName: string, command: string, timeout = 120000): ToolRunResult {
    this.logger.info(`Running tool: ${toolName} — ${command}`);
    const start = Date.now();
    try {
      const stdout = execSync(command, {
        encoding: 'utf-8',
        timeout,
        maxBuffer: 50 * 1024 * 1024,
      });
      const durationMs = Date.now() - start;
      return {
        toolName,
        command,
        exitCode: 0,
        stdout,
        stderr: '',
        durationMs,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const durationMs = Date.now() - start;
      const execError = error as Error & { stdout?: string; stderr?: string; status?: number };
      return {
        toolName,
        command,
        exitCode: execError.status ?? 1,
        stdout: execError.stdout ?? '',
        stderr: execError.stderr ?? execError.message,
        durationMs,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async runAsync(toolName: string, command: string, timeout = 120000): Promise<ToolRunResult> {
    return this.run(toolName, command, timeout);
  }
}
