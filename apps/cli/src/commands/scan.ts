import { Command } from 'commander';
import { createLogger } from '@hunteros/logger';
import { ConfigManager } from '@hunteros/config';
import { CacheStore } from '@hunteros/cache';
import { FileIndexer, detectPackageManager, readPackageJson } from '@hunteros/parser';
import { getExtractor } from '@hunteros/ast';
import { ProjectGraphBuilder } from '@hunteros/graph';
import { SecurityAnalyzer } from '@hunteros/analyzers';
import { CompositeDetector } from '@hunteros/detectors';
import { FrameworkDetectorRegistry } from '@hunteros/framework-detectors';
import { LogLevel } from '@hunteros/shared';

export const scanCommand = new Command('scan')
  .description('Scan a repository for security analysis')
  .argument('[path]', 'Path to repository', '.')
  .option('-d, --depth <number>', 'Directory depth to scan', '5')
  .option('-i, --ignore <patterns>', 'Ignore patterns (comma-separated)')
  .option('-o, --output <format>', 'Output format (json, text)', 'text')
  .option('--no-ast', 'Disable AST extraction')
  .option('--no-graph', 'Disable graph building')
  .action(async (path: string, options: { depth: string; ignore?: string; output: string; ast: boolean; graph: boolean }) => {
    const logger = createLogger({ level: LogLevel.Info });
    const configManager = new ConfigManager(logger);
    const scanConfig = configManager.getScanConfig({
      path,
      depth: Number.parseInt(options.depth, 10),
      ignorePatterns: options.ignore?.split(',').map((s) => s.trim()) ?? ['node_modules', '.git', 'dist'],
      enableAst: options.ast,
      enableGraph: options.graph,
    });

    logger.info(`Starting scan of ${scanConfig.path}`);

    const cache = new CacheStore(logger);
    const indexer = new FileIndexer(logger);

    const fileIndex = indexer.indexRepository(scanConfig.path, scanConfig.ignorePatterns, scanConfig.maxFileSize);
    logger.info(`Found ${fileIndex.totalFiles} files`);

    const pkgInfo = readPackageJson(scanConfig.path);
    const pm = detectPackageManager(scanConfig.path);
    logger.info(`Package manager: ${pm}`);

    const frameworkRegistry = new FrameworkDetectorRegistry(logger);
    const allContent = fileIndex.files.map((f) => f.path).join('\n');
    const frameworks = frameworkRegistry.detectAll(pkgInfo, fileIndex.files.map((f) => f.path), allContent);
    logger.info(`Detected frameworks: ${frameworks.map((f) => f.name).join(', ') || 'none'}`);

    if (scanConfig.enableAst) {
      const nodesByFile = new Map<string, import('@hunteros/shared').ASTNode[]>();

      for (const file of fileIndex.files) {
        const extractor = getExtractor(file.language);
        if (!extractor) continue;

        const content = await readFileContent(scanConfig.path, file.path);
        if (!content) continue;

        const nodes = extractor.extract(file.path, content);
        nodesByFile.set(file.path, nodes);
      }

      logger.info(`Extracted AST from ${nodesByFile.size} files`);

      if (scanConfig.enableGraph && nodesByFile.size > 0) {
        const graphBuilder = new ProjectGraphBuilder(logger);
        const graphResult = graphBuilder.build(nodesByFile);
        logger.info(`Graph: ${graphResult.nodes.length} nodes, ${graphResult.edges.length} edges`);
      }

      const analyzer = new SecurityAnalyzer(logger);
      const results = analyzer.analyze(nodesByFile, frameworks);
      logger.info(`Analysis: ${results.length} files with findings`);

      const detector = new CompositeDetector(logger);
      for (const file of fileIndex.files) {
        const content = await readFileContent(scanConfig.path, file.path);
        if (!content) continue;
        const findings = detector.detectAll(content, file.path);
        if (findings.length > 0) {
          logger.info(`  ${file.path}: ${findings.length} pattern(s) detected`);
        }
      }
    }

    logger.info('Scan complete');
    cache.close();
  });

async function readFileContent(rootPath: string, filePath: string): Promise<string | null> {
  try {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    return readFileSync(join(rootPath, filePath), 'utf-8');
  } catch {
    return null;
  }
}
