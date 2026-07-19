import type { AIAnalysisRequest, AIAnalysisResponse, AIProviderConfig } from '@hunteros/shared';

export interface AIProvider {
  name: string;
  analyze(request: AIAnalysisRequest): Promise<AIAnalysisResponse>;
  summarize(context: string): Promise<string>;
}

export class OpenAIProvider implements AIProvider {
  name = 'openai';
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  async analyze(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    const prompt = this.buildAnalysisPrompt(request);
    return this.callAI(prompt);
  }

  async summarize(context: string): Promise<string> {
    const prompt = `Summarize the following code review context concisely:\n\n${context}`;
    const response = await this.callAI(prompt);
    return response.summary;
  }

  private buildAnalysisPrompt(request: AIAnalysisRequest): string {
    return `You are a security code review assistant. Analyze the following code context and identify areas that may require manual security review.

Framework(s): ${request.frameworkInfo.map((f) => `${f.name} (${f.category})`).join(', ')}
Review Priority Score: ${request.reviewPriority}

Files to Review:
${request.files.join('\n')}

AST Summaries:
${request.astSummaries.map((s) => `  ${s.filePath}: ${s.functions.join(', ')}`).join('\n')}

Call Paths:
${request.callPaths.join('\n')}

Related Modules:
${request.relatedModules.join('\n')}

Current Findings:
${request.findings.map((f) => `  [${f.severity}] ${f.message} (${f.filePath})`).join('\n')}

Provide:
1. A brief summary of the code area
2. Explanation of security-relevant patterns found
3. Specific areas to investigate manually
4. Suggested search queries for deeper analysis
5. A risk score (0-100) based on the findings`;
  }

  private async callAI(prompt: string): Promise<AIAnalysisResponse> {
    if (!this.config.apiKey) {
      return {
        summary: 'AI analysis unavailable: No API key configured.',
        explanation: 'Configure an AI provider API key to enable AI-powered analysis.',
        areasToInvestigate: ['Set up AI provider configuration'],
        suggestedQueries: [],
        riskScore: 0,
      };
    }

    const baseUrl = this.config.baseUrl ?? 'https://api.openai.com/v1';
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            { role: 'system', content: 'You are a security code review assistant. Focus on identifying areas requiring manual review. Do not assert vulnerabilities exist without evidence.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI provider returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as { choices: Array<{ message: { content: string } }> };
      const content = data.choices?.[0]?.message?.content ?? '';

      return this.parseResponse(content);
    } catch (error) {
      return {
        summary: `AI analysis error: ${(error as Error).message}`,
        explanation: 'Failed to get AI analysis. The provider may be unavailable or misconfigured.',
        areasToInvestigate: ['Check AI provider configuration', 'Verify API key is valid'],
        suggestedQueries: [],
        riskScore: 0,
      };
    }
  }

  private parseResponse(content: string): AIAnalysisResponse {
    const lines = content.split('\n');
    const summary = lines.slice(0, 3).join(' ').replace(/^1\.\s*/, '');
    const explanation = lines.find((l) => /^2\./.test(l))?.replace(/^2\.\s*/, '') ?? '';
    const areasMatch = content.match(/3\..*?(?=\n4\.|$)/s);
    const areasToInvestigate = areasMatch
      ? areasMatch[0]!.split('\n').filter((l) => l.trim().startsWith('-')).map((l) => l.replace(/^-\s*/, ''))
      : [];
    const queriesMatch = content.match(/4\..*?(?=\n5\.|$)/s);
    const suggestedQueries = queriesMatch
      ? queriesMatch[0]!.split('\n').filter((l) => l.trim().startsWith('-')).map((l) => l.replace(/^-\s*/, ''))
      : [];
    const riskMatch = content.match(/5\.\s*.*?(\d+)/);
    const riskScore = riskMatch ? Number.parseInt(riskMatch[1]!, 10) : 50;

    return {
      summary,
      explanation,
      areasToInvestigate,
      suggestedQueries,
      riskScore: Math.min(riskScore, 100),
    };
  }
}
