import type { ASTNode, Finding, FrameworkInfo } from '@hunteros/shared';
import { FindingType, Severity, FindingCategory } from '@hunteros/shared';

export function analyzeNextJS(nodes: ASTNode[], filePath: string): Finding[] {
  const findings: Finding[] = [];
  const content = nodes.map((n) => n.name).join('\n');

  if (content.includes('getServerSideProps') || content.includes('getStaticProps')) {
    findings.push({
      id: `${filePath}:nextjs:data-fetching`,
      type: FindingType.ApiRoute,
      severity: Severity.Medium,
      message: 'Next.js data fetching function detected',
      filePath, startLine: 1, endLine: 1,
      category: FindingCategory.DataAccess,
      reviewPriority: 30,
      metadata: {},
    });
  }

  if (content.includes('getServerSideProps')) {
    findings.push({
      id: `${filePath}:nextjs:ssr`,
      type: FindingType.ApiRoute,
      severity: Severity.Medium,
      message: 'Server-side rendering - data may be sensitive',
      filePath, startLine: 1, endLine: 1,
      category: FindingCategory.DataAccess,
      reviewPriority: 40,
      metadata: {},
    });
  }

  if (content.includes('middleware') && (content.includes('request') || content.includes('NextRequest'))) {
    findings.push({
      id: `${filePath}:nextjs:middleware`,
      type: FindingType.AuthLogic,
      severity: Severity.High,
      message: 'Next.js middleware detected - review authentication logic',
      filePath, startLine: 1, endLine: 1,
      category: FindingCategory.Authentication,
      reviewPriority: 70,
      metadata: {},
    });
  }

  if (content.includes('api/') || content.includes('/api/')) {
    findings.push({
      id: `${filePath}:nextjs:api-route`,
      type: FindingType.ApiRoute,
      severity: Severity.Medium,
      message: 'Next.js API route detected',
      filePath, startLine: 1, endLine: 1,
      category: FindingCategory.InputValidation,
      reviewPriority: 50,
      metadata: {},
    });
  }

  return findings;
}
