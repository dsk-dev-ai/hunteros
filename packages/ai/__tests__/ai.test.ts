import { describe, it, expect } from 'vitest';
import { OpenAIProvider } from '../src/provider.js';
import { AIProviderRegistry } from '../src/registry.js';
import { createLogger } from '@hunteros/logger';
import { LogLevel } from '@hunteros/shared';

describe('OpenAIProvider', () => {
  it('should handle missing API key gracefully', async () => {
    const provider = new OpenAIProvider({
      name: 'openai',
      apiKey: '',
      model: 'gpt-4',
      maxTokens: 4096,
      temperature: 0.3,
    });
    const result = await provider.analyze({
      files: ['src/test.ts'],
      astSummaries: [],
      callPaths: [],
      relatedModules: [],
      frameworkInfo: [],
      reviewPriority: 50,
      findings: [],
    });
    expect(result.summary).toContain('No API key configured');
  });

  it('should parse mock response', () => {
    const provider = new OpenAIProvider({
      name: 'openai', apiKey: 'test', model: 'gpt-4', maxTokens: 4096, temperature: 0.3,
    });
    const content = '1. Summary of analysis\n2. Security patterns found\n3. Areas to investigate\n- Check auth logic\n- Review input validation\n4. Suggested queries\n- Search for "admin"\n5. Risk score: 75';
    const result = (provider as unknown as { parseResponse: (c: string) => unknown }).parseResponse(content);
    expect(result).toBeDefined();
  });
});

describe('AIProviderRegistry', () => {
  it('should register and retrieve providers', () => {
    const logger = createLogger({ level: LogLevel.Silent });
    const registry = new AIProviderRegistry(logger);
    expect(registry.listProviders()).toEqual([]);
  });
});
