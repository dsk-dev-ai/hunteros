import type { ASTNode, ASTSummary } from '@hunteros/shared';
import { ASTNodeType } from '@hunteros/shared';
import type { ASTExtractor } from '../types.js';

export class TypeScriptExtractor implements ASTExtractor {
  supportedLanguages = ['typescript', 'typescriptreact'];

  extract(filePath: string, content: string): ASTNode[] {
    const nodes: ASTNode[] = [];
    const lines = content.split('\n');

    nodes.push(...this.extractImports(filePath, lines));
    nodes.push(...this.extractExports(filePath, lines));
    nodes.push(...this.extractClasses(filePath, lines));
    nodes.push(...this.extractFunctions(filePath, lines));
    nodes.push(...this.extractRoutes(filePath, lines));
    nodes.push(...this.extractMiddleware(filePath, lines));
    nodes.push(...this.extractDatabaseCalls(filePath, lines));
    nodes.push(...this.extractHttpHandlers(filePath, lines));
    nodes.push(...this.extractFileSystemAccess(filePath, lines));
    nodes.push(...this.extractEnvVarAccess(filePath, lines));

    return nodes;
  }

  summarize(nodes: ASTNode[]): ASTSummary {
    const summary: ASTSummary = {
      filePath: '',
      language: 'typescript',
      exports: [],
      imports: [],
      classes: [],
      functions: [],
      routes: [],
      databaseCalls: [],
      httpHandlers: [],
      filesystemAccess: [],
      envVarAccess: [],
    };

    for (const node of nodes) {
      summary.filePath = node.filePath;
      switch (node.type) {
        case ASTNodeType.Import:
          summary.imports.push(node.name);
          break;
        case ASTNodeType.Export:
          summary.exports.push(node.name);
          break;
        case ASTNodeType.Class:
          summary.classes.push(node.name);
          break;
        case ASTNodeType.Function:
        case ASTNodeType.ArrowFunction:
          summary.functions.push(node.name);
          break;
        case ASTNodeType.Route:
          summary.routes.push(node.name);
          break;
        case ASTNodeType.DatabaseCall:
          summary.databaseCalls.push(node.name);
          break;
        case ASTNodeType.HttpHandler:
          summary.httpHandlers.push(node.name);
          break;
        case ASTNodeType.FileSystemAccess:
          summary.filesystemAccess.push(node.name);
          break;
        case ASTNodeType.EnvVarAccess:
          summary.envVarAccess.push(node.name);
          break;
      }
    }

    return summary;
  }

  private extractImports(filePath: string, lines: string[]): ASTNode[] {
    const nodes: ASTNode[] = [];
    const importRegex = /^(?:import|export)\s+(?:type\s+)?(?:\{[^}]*\}\s+from\s+|[\w*{} ,]+\s+from\s+)?['"]([^'"]+)['"]/;

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i]?.match(importRegex);
      if (match) {
        nodes.push(this.createNode(ASTNodeType.Import, match[1] ?? match[0], filePath, i + 1));
      }
    }
    return nodes;
  }

  private extractExports(filePath: string, lines: string[]): ASTNode[] {
    const nodes: ASTNode[] = [];
    const exportRegex = /^export\s+(?:default\s+)?(?:function|class|const|let|var|interface|type)\s+(\w+)/;

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i]?.match(exportRegex);
      if (match) {
        nodes.push(this.createNode(ASTNodeType.Export, match[1]!, filePath, i + 1));
      }
    }
    return nodes;
  }

  private extractClasses(filePath: string, lines: string[]): ASTNode[] {
    const nodes: ASTNode[] = [];
    const classRegex = /^(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/;

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i]?.match(classRegex);
      if (match) {
        nodes.push(this.createNode(ASTNodeType.Class, match[1]!, filePath, i + 1));
      }
    }
    return nodes;
  }

  private extractFunctions(filePath: string, lines: string[]): ASTNode[] {
    const nodes: ASTNode[] = [];
    const funcRegex = /^(?:export\s+)?(?:async\s+)?function\s+(\w+)/;
    const arrowRegex = /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|\w+)\s*=>/;
    const methodRegex = /(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const funcMatch = line.match(funcRegex);
      if (funcMatch) {
        nodes.push(this.createNode(ASTNodeType.Function, funcMatch[1]!, filePath, i + 1));
        continue;
      }
      const arrowMatch = line.match(arrowRegex);
      if (arrowMatch) {
        nodes.push(this.createNode(ASTNodeType.ArrowFunction, arrowMatch[1]!, filePath, i + 1));
      }
    }
    return nodes;
  }

  private extractRoutes(filePath: string, lines: string[]): ASTNode[] {
    const nodes: ASTNode[] = [];
    const routePatterns = [
      /\.(get|post|put|delete|patch|options)\(['"]([^'"]+)['"]/,
      /router\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/,
      /@(?:Get|Post|Put|Delete|Patch)\(['"]([^'"]+)['"]\)/,
      /app\.(?:get|post|put|delete|patch)\(['"]([^'"]+)['"]/,
    ];

    for (let i = 0; i < lines.length; i++) {
      for (const pattern of routePatterns) {
        const match = lines[i]?.match(pattern);
        if (match) {
          const route = match[2] ?? match[1] ?? '';
          nodes.push(this.createNode(ASTNodeType.Route, route, filePath, i + 1));
        }
      }
    }
    return nodes;
  }

  private extractMiddleware(filePath: string, lines: string[]): ASTNode[] {
    const nodes: ASTNode[] = [];
    const middlewarePatterns = [
      /\.use\(/,
      /middleware/,
      /@Middleware/,
      /interceptor/,
      /guard/,
      /authMiddleware/,
      /authenticate/,
      /authorize/,
    ];

    for (let i = 0; i < lines.length; i++) {
      for (const pattern of middlewarePatterns) {
        if (pattern.test(lines[i]!)) {
          nodes.push(this.createNode(ASTNodeType.Middleware, lines[i]!.trim(), filePath, i + 1));
          break;
        }
      }
    }
    return nodes;
  }

  private extractDatabaseCalls(filePath: string, lines: string[]): ASTNode[] {
    const nodes: ASTNode[] = [];
    const dbPatterns = [
      /\.find(?:One|Many|ById)?\(/,
      /\.create\(/,
      /\.update(?:One|Many)?\(/,
      /\.delete(?:One|Many)?\(/,
      /\.save\(/,
      /\.aggregate\(/,
      /\.query\(/,
      /\.exec\(/,
      /prisma\./,
      /knex\(/,
      /sequelize\./,
      /typeorm\./,
      /drizzle\./,
      /sql`/,
      /db\./,
    ];

    for (let i = 0; i < lines.length; i++) {
      for (const pattern of dbPatterns) {
        if (pattern.test(lines[i]!)) {
          nodes.push(this.createNode(ASTNodeType.DatabaseCall, lines[i]!.trim(), filePath, i + 1));
          break;
        }
      }
    }
    return nodes;
  }

  private extractHttpHandlers(filePath: string, lines: string[]): ASTNode[] {
    const nodes: ASTNode[] = [];
    const handlerPatterns = [
      /(?:req|request|res|response)\s*[,)]/,
      /RequestHandler/,
      /NextFunction/,
      /HttpHandler/,
      /Controller/,
      /@Controller/,
      /@RequestMapping/,
      /@Get|@Post|@Put|@Delete|@Patch/,
    ];

    for (let i = 0; i < lines.length; i++) {
      for (const pattern of handlerPatterns) {
        if (pattern.test(lines[i]!)) {
          nodes.push(this.createNode(ASTNodeType.HttpHandler, lines[i]!.trim(), filePath, i + 1));
          break;
        }
      }
    }
    return nodes;
  }

  private extractFileSystemAccess(filePath: string, lines: string[]): ASTNode[] {
    const nodes: ASTNode[] = [];
    const fsPatterns = [
      /require\(['"]fs['"]\)/,
      /from\s+['"]fs['"]/,
      /import\s+.*\s+from\s+['"]fs['"]/,
      /fs\./,
      /readFile(?:Sync)?\(/,
      /writeFile(?:Sync)?\(/,
      /unlink(?:Sync)?\(/,
      /mkdir(?:Sync)?\(/,
      /readdir(?:Sync)?\(/,
      /createReadStream/,
      /createWriteStream/,
      /access(?:Sync)?\(/,
    ];

    for (let i = 0; i < lines.length; i++) {
      for (const pattern of fsPatterns) {
        if (pattern.test(lines[i]!)) {
          nodes.push(this.createNode(ASTNodeType.FileSystemAccess, lines[i]!.trim(), filePath, i + 1));
          break;
        }
      }
    }
    return nodes;
  }

  private extractEnvVarAccess(filePath: string, lines: string[]): ASTNode[] {
    const nodes: ASTNode[] = [];
    const envPatterns = [
      /process\.env\./,
      /process\.env\[/,
      /process\.env\.get\(/,
      /env\(/,
      /getEnv\(/,
      /loadEnv\(/,
      /config\(/,
      /dotenv/,
    ];

    for (let i = 0; i < lines.length; i++) {
      for (const pattern of envPatterns) {
        if (pattern.test(lines[i]!)) {
          nodes.push(this.createNode(ASTNodeType.EnvVarAccess, lines[i]!.trim(), filePath, i + 1));
          break;
        }
      }
    }
    return nodes;
  }

  private createNode(type: ASTNodeType, name: string, filePath: string, startLine: number): ASTNode {
    return {
      id: `${filePath}:${type}:${name}:${startLine}`,
      type,
      name,
      filePath,
      startLine,
      endLine: startLine,
      startColumn: 0,
      endColumn: 0,
      metadata: {},
      children: [],
    };
  }
}
