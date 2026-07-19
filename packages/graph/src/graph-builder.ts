import Graph from 'graphology';
import type { ASTNode, GraphNode, GraphEdge } from '@hunteros/shared';
import { GraphNodeType, GraphEdgeType, ASTNodeType } from '@hunteros/shared';
import type { Logger } from '@hunteros/logger';

export class ProjectGraphBuilder {
  private graph: Graph;
  private logger: Logger;
  private nodeMap: Map<string, string>;

  constructor(logger: Logger) {
    this.graph = new Graph({ multi: true, type: 'directed' });
    this.logger = logger;
    this.nodeMap = new Map();
  }

  build(nodesByFile: Map<string, ASTNode[]>): { nodes: GraphNode[]; edges: GraphEdge[] } {
    this.logger.info('Building project graph');

    for (const [filePath, nodes] of nodesByFile) {
      this.addFileNode(filePath, nodes);
      for (const node of nodes) {
        this.processNode(node, filePath);
      }
    }

    this.buildFileRelationships(nodesByFile);

    const result = this.exportGraph();
    this.logger.info(`Graph built: ${result.nodes.length} nodes, ${result.edges.length} edges`);
    return result;
  }

  private addFileNode(filePath: string, nodes: ASTNode[]): void {
    const fileId = `file:${filePath}`;
    this.nodeMap.set(filePath, fileId);

    if (!this.graph.hasNode(fileId)) {
      this.graph.addNode(fileId, {
        id: fileId,
        type: GraphNodeType.File,
        name: filePath,
        filePath,
        metadata: { nodeCount: nodes.length },
      });
    }
  }

  private processNode(node: ASTNode, filePath: string): void {
    const nodeId = `${node.type}:${node.name}:${filePath}`;

    if (!this.graph.hasNode(nodeId)) {
      const graphType = this.astToGraphNodeType(node.type);
      this.graph.addNode(nodeId, {
        id: nodeId,
        type: graphType,
        name: node.name,
        filePath: node.filePath,
        metadata: { ...node.metadata, astType: node.type },
      });
    }

    const fileId = this.nodeMap.get(filePath);
    if (fileId && this.graph.hasNode(fileId) && this.graph.hasNode(nodeId)) {
      if (!this.graph.hasEdge(fileId, nodeId)) {
        this.graph.addEdge(fileId, nodeId, {
          source: fileId,
          target: nodeId,
          type: GraphEdgeType.Contains,
          metadata: {},
        });
      }
    }

    for (const child of node.children) {
      this.processNode(child, filePath);
    }
  }

  private buildFileRelationships(nodesByFile: Map<string, ASTNode[]>): void {
    const importsByFile = new Map<string, Set<string>>();

    for (const [filePath, nodes] of nodesByFile) {
      const imports = new Set<string>();
      for (const node of nodes) {
        if (node.type === ASTNodeType.Import) {
          imports.add(node.name);
        }
      }
      importsByFile.set(filePath, imports);
    }

    for (const [filePath, imports] of importsByFile) {
      const sourceId = this.nodeMap.get(filePath);
      if (!sourceId) continue;

      for (const importPath of imports) {
        const resolvedPath = this.resolveImportPath(filePath, importPath);
        const targetId = this.nodeMap.get(resolvedPath);
        if (targetId && this.graph.hasNode(sourceId) && this.graph.hasNode(targetId)) {
          if (!this.graph.hasEdge(sourceId, targetId)) {
            this.graph.addEdge(sourceId, targetId, {
              source: sourceId,
              target: targetId,
              type: GraphEdgeType.Imports,
              metadata: {},
            });
          }
        }
      }
    }
  }

  private resolveImportPath(currentFile: string, importPath: string): string {
    if (importPath.startsWith('.')) {
      const dir = currentFile.substring(0, currentFile.lastIndexOf('/'));
      const resolved = `${dir}/${importPath}`;
      return resolved.replace(/\/\.\//g, '/').replace(/\/[^/]+\/\.\.\//g, '/');
    }
    return importPath;
  }

  private astToGraphNodeType(astType: ASTNodeType): GraphNodeType {
    switch (astType) {
      case ASTNodeType.Class: return GraphNodeType.Class;
      case ASTNodeType.Function:
      case ASTNodeType.ArrowFunction: return GraphNodeType.Function;
      case ASTNodeType.Route: return GraphNodeType.Route;
      case ASTNodeType.Import:
      case ASTNodeType.Export: return GraphNodeType.Module;
      default: return GraphNodeType.Symbol;
    }
  }

  private exportGraph(): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    this.graph.forEachNode((nodeId) => {
      const attrs = this.graph.getNodeAttributes(nodeId);
      nodes.push(attrs as unknown as GraphNode);
    });

    this.graph.forEachEdge((edgeId) => {
      const [source, target] = this.graph.extremities(edgeId);
      const attrs = this.graph.getEdgeAttributes(edgeId);
      edges.push({
        source,
        target,
        type: attrs['type'] as GraphEdgeType,
        metadata: attrs['metadata'] as Record<string, unknown>,
      });
    });

    return { nodes, edges };
  }

  getGraph(): Graph {
    return this.graph;
  }

  traverse(fromNodeId: string, direction: 'in' | 'out' | 'both' = 'out'): string[] {
    const visited = new Set<string>();
    const queue = [fromNodeId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const neighbors = direction === 'out' || direction === 'both'
        ? this.graph.outNeighbors(current)
        : [];
      const inNeighbors = direction === 'in' || direction === 'both'
        ? this.graph.inNeighbors(current)
        : [];

      for (const neighbor of [...neighbors, ...inNeighbors]) {
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
        }
      }
    }

    return Array.from(visited);
  }

  findPaths(fromId: string, toId: string): string[][] {
    const paths: string[][] = [];
    const visited = new Set<string>();

    const dfs = (current: string, path: string[]) => {
      if (current === toId) {
        paths.push([...path, current]);
        return;
      }
      if (visited.has(current)) return;
      visited.add(current);
      path.push(current);

      for (const neighbor of this.graph.outNeighbors(current)) {
        dfs(neighbor, path);
      }

      path.pop();
      visited.delete(current);
    };

    dfs(fromId, []);
    return paths;
  }
}
