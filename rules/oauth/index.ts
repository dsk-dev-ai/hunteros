import type { ASTNode, Finding } from '@hunteros/shared';
import { FindingType, Severity, FindingCategory } from '@hunteros/shared';

export function analyzeOAuth(nodes: ASTNode[], filePath: string): Finding[] {
  const findings: Finding[] = [];
  const content = nodes.map((n) => n.name).join('\n');

  if (/passport|oauth|oauth2|openid|OAuthStrategy/.test(content)) {
    findings.push({
      id: `${filePath}:oauth:provider`,
      type: FindingType.AuthModule,
      severity: Severity.Medium,
      message: 'OAuth authentication provider detected',
      filePath, startLine: 1, endLine: 1,
      category: FindingCategory.Authentication,
      reviewPriority: 60,
      metadata: {},
    });
  }

  if (/callbackURL|redirect_uri|redirectUri/.test(content)) {
    findings.push({
      id: `${filePath}:oauth:callback`,
      type: FindingType.AuthLogic,
      severity: Severity.High,
      message: 'OAuth callback URL configured - verify redirect validation',
      filePath, startLine: 1, endLine: 1,
      category: FindingCategory.Authentication,
      reviewPriority: 75,
      metadata: {},
    });
  }

  return findings;
}
