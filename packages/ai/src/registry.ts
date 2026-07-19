import type { AIProviderConfig } from '@hunteros/shared';
import type { AIProvider } from './provider.js';
import { OpenAIProvider } from './provider.js';
import type { Logger } from '@hunteros/logger';

export class AIProviderRegistry {
  private providers: Map<string, AIProvider> = new Map();
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  registerProvider(name: string, provider: AIProvider): void {
    this.providers.set(name, provider);
    this.logger.debug(`Registered AI provider: ${name}`);
  }

  getProvider(name: string): AIProvider | undefined {
    return this.providers.get(name);
  }

  createFromConfig(config: AIProviderConfig): AIProvider {
    const provider = this.getProvider(config.name);
    if (provider) return provider;

    switch (config.name) {
      case 'openai':
        return new OpenAIProvider(config);
      default:
        throw new Error(`Unknown AI provider: ${config.name}`);
    }
  }

  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}
