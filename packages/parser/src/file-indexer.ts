import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import ignore, { type Ignore } from 'ignore';
import type { FileInfo, FileIndex } from '@hunteros/shared';
import type { Logger } from '@hunteros/logger';
import { detectLanguage, isGenerated, isTestFile, isConfigFile } from './language-detector.js';

export class FileIndexer {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  indexRepository(rootPath: string, ignorePatterns: string[], maxFileSize: number): FileIndex {
    this.logger.info(`Indexing repository at ${rootPath}`);

    const ig = ignore().add(ignorePatterns);

    const files: FileInfo[] = [];
    const languageCounts = new Map<string, number>();
    let totalLines = 0;

    const entries = this.walkDirectory(rootPath, rootPath, ig, maxFileSize);

    for (const entry of entries) {
      const info: FileInfo = {
        path: entry.relativePath,
        language: entry.language,
        size: entry.size,
        lines: entry.lines,
        isGenerated: entry.isGenerated,
        isTest: entry.isTestFile,
        isConfig: entry.isConfig,
      };
      files.push(info);
      totalLines += entry.lines;
      languageCounts.set(entry.language, (languageCounts.get(entry.language) ?? 0) + 1);
    }

    this.logger.info(`Indexed ${files.length} files with ${totalLines} total lines`);

    return {
      files,
      totalFiles: files.length,
      totalLines,
      languages: languageCounts,
    };
  }

  private walkDirectory(
    rootPath: string,
    currentPath: string,
    ig: Ignore,
    maxFileSize: number,
  ): WalkEntry[] {
    const entries: WalkEntry[] = [];

    let dirEntries: string[];
    try {
      dirEntries = readdirSync(currentPath);
    } catch {
      return entries;
    }

    for (const entry of dirEntries) {
      const fullPath = join(currentPath, entry);
      const relativePath = relative(rootPath, fullPath);

      if (ig.ignores(relativePath)) continue;

      try {
        const stats = statSync(fullPath);
        if (stats.isDirectory()) {
          if (entry.startsWith('.')) continue;
          entries.push(...this.walkDirectory(rootPath, fullPath, ig, maxFileSize));
        } else if (stats.isFile()) {
          if (stats.size > maxFileSize) {
            this.logger.debug(`Skipping large file: ${relativePath}`);
            continue;
          }

          let lines = 0;
          try {
            const content = readFileSync(fullPath, 'utf-8');
            lines = content.split('\n').length;
          } catch {
            lines = 0;
          }

          const language = detectLanguage(relativePath);

          entries.push({
            relativePath,
            language,
            size: stats.size,
            lines,
            isGenerated: isGenerated(relativePath),
            isTestFile: isTestFile(relativePath),
            isConfig: isConfigFile(relativePath),
          });
        }
      } catch {
        continue;
      }
    }

    return entries;
  }
}

interface WalkEntry {
  relativePath: string;
  language: string;
  size: number;
  lines: number;
  isGenerated: boolean;
  isTestFile: boolean;
  isConfig: boolean;
}
