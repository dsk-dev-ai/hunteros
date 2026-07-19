import type { ASTNode, Finding } from '@hunteros/shared';
import { FindingType, Severity, FindingCategory } from '@hunteros/shared';

export function analyzeGraphQL(nodes: ASTNode[], filePath: string): Finding[] {
  const findings: Finding[] = [];
  const content = nodes.map((n) => n.name).join('\n');

  if (/buildSchema|GraphQLSchema|typeDefs|gql`/.test(content)) {
    findings.push({
      id: `${filePath}:graphql:schema`,
      type: FindingType.ApiRoute,
      severity: Severity.Medium,
      message: 'GraphQL schema definition detected',
      filePath, startLine: 1, endLine: 1,
      category: FindingCategory.InputValidation,
      reviewPriority: 50,
      metadata: {},
    });
  }

  if (/resolver|Query:|Mutation:|@Resolver/.test(content)) {
    findings.push({
      id: `${filePath}:graphql:resolver`,
      type: FindingType.ApiRoute,
      severity: Severity.Medium,
      message: 'GraphQL resolver detected - review authorization',
      filePath, startLine: 1, endLine: 1,
      category: FindingCategory.Authorization,
      reviewPriority: 60,
      metadata: {},
    });
  }

  if (/\$\{.*\{.*\}/.test(content) && /gql|query|mutation/.test(content)) {
    findings.push({
      id: `${filePath}:graphql:injection`,
      type: FindingType.InputValidation,
      severity: Severity.High,
      message: 'Potential GraphQL injection via string interpolation',
      filePath, startLine: 1, endLine: 1,
      category: FindingCategory.InputValidation,
      reviewPriority: 75,
      metadata: {},
    });
  }

  return findings;
}
