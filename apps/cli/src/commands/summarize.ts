import { Command } from 'commander';
import { createLogger } from '@hunteros/logger';
import { LogLevel } from '@hunteros/shared';
import type { AIProviderConfig } from '@hunteros/shared';
import { OpenAIProvider } from '@hunteros/ai';

export const summarizeCommand = new Command('summarize')
  .description('Generate AI summary of a repository or file')
  .argument('<path>', 'Path to repository or file')
  .option('--ai-provider <name>', 'AI provider name', 'openai')
  .option('--ai-model <model>', 'AI model name', 'gpt-4')
  .option('--api-key <key>', 'AI provider API key')
  .action(async (path: string, options: { aiProvider: string; aiModel: string; apiKey?: string }) => {
    const logger = createLogger({ level: LogLevel.Info });

    const aiConfig: AIProviderConfig = {
      name: options.aiProvider,
      model: options.aiModel,
      apiKey: options.apiKey ?? process.env['OPENAI_API_KEY'] ?? '',
      maxTokens: 4096,
      temperature: 0.3,
    };

    const provider = new OpenAIProvider(aiConfig);
    const summary = await provider.summarize(`Repository path: ${path}\n\nAnalyze the security-relevant aspects of this codebase.`);
    console.log(summary);
  });
