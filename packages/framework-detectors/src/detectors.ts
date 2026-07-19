import { FrameworkCategory } from '@hunteros/shared';
import type { FrameworkInfo } from '@hunteros/shared';
import type { PackageJsonInfo } from '@hunteros/parser';
import type { Logger } from '@hunteros/logger';

export interface FrameworkDetector {
  name: string;
  category: FrameworkCategory;
  detect(pkg: PackageJsonInfo | null, files: string[], content: string): FrameworkInfo | null;
}

export class NextJSDetector implements FrameworkDetector {
  name = 'next.js';
  category = FrameworkCategory.Fullstack;

  detect(pkg: PackageJsonInfo | null, files: string[], _content: string): FrameworkInfo | null {
    const hasNextConfig = files.some((f) => /next\.config/.test(f));
    const isDep = pkg?.dependencies?.['next'] || pkg?.devDependencies?.['next'];

    if (hasNextConfig || isDep) {
      const version = isDep ? isDep.replace('^', '').replace('~', '') : undefined;
      return {
        name: 'next.js',
        version,
        category: FrameworkCategory.Fullstack,
        confidence: hasNextConfig ? 0.95 : 0.7,
      };
    }
    return null;
  }
}

export class ExpressDetector implements FrameworkDetector {
  name = 'express';
  category = FrameworkCategory.Backend;

  detect(pkg: PackageJsonInfo | null, files: string[], content: string): FrameworkInfo | null {
    const isDep = pkg?.dependencies?.['express'];
    const hasExpress = /\bexpress\b/.test(content) || files.some((f) => f.includes('express'));

    if (isDep || hasExpress) {
      return {
        name: 'express',
        version: isDep?.replace('^', ''),
        category: FrameworkCategory.Backend,
        confidence: isDep ? 0.95 : 0.5,
      };
    }
    return null;
  }
}

export class ReactDetector implements FrameworkDetector {
  name = 'react';
  category = FrameworkCategory.Frontend;

  detect(pkg: PackageJsonInfo | null, _files: string[], content: string): FrameworkInfo | null {
    const isDep = pkg?.dependencies?.['react'] || pkg?.devDependencies?.['react'];
    const hasReact = /import\s+React|from\s+['"]react['"]|jsx|tsx/.test(content);

    if (isDep || hasReact) {
      return {
        name: 'react',
        version: isDep?.replace('^', ''),
        category: FrameworkCategory.Frontend,
        confidence: isDep ? 0.95 : 0.6,
      };
    }
    return null;
  }
}

export class NestJSDetector implements FrameworkDetector {
  name = 'nestjs';
  category = FrameworkCategory.Backend;

  detect(pkg: PackageJsonInfo | null, _files: string[], content: string): FrameworkInfo | null {
    const isDep = pkg?.dependencies?.['@nestjs/core'];
    const hasNest = /@(?:Module|Controller|Injectable|Get|Post|Put|Delete|Body|Param|Req|Res)\(/.test(content);

    if (isDep || hasNest) {
      return {
        name: 'nestjs',
        version: isDep?.replace('^', ''),
        category: FrameworkCategory.Backend,
        confidence: isDep ? 0.95 : 0.6,
      };
    }
    return null;
  }
}

export class FastifyDetector implements FrameworkDetector {
  name = 'fastify';
  category = FrameworkCategory.Backend;

  detect(pkg: PackageJsonInfo | null, _files: string[], content: string): FrameworkInfo | null {
    const isDep = pkg?.dependencies?.['fastify'];
    const hasFastify = /require\(['"]fastify['"]\)|from\s+['"]fastify['"]/.test(content);

    if (isDep || hasFastify) {
      return {
        name: 'fastify',
        version: isDep?.replace('^', ''),
        category: FrameworkCategory.Backend,
        confidence: isDep ? 0.95 : 0.5,
      };
    }
    return null;
  }
}

export class NodeJSDetector implements FrameworkDetector {
  name = 'node.js';
  category = FrameworkCategory.Backend;

  detect(pkg: PackageJsonInfo | null, _files: string[], _content: string): FrameworkInfo | null {
    if (pkg && Object.keys(pkg.scripts ?? {}).length > 0) {
      return {
        name: 'node.js',
        category: FrameworkCategory.Backend,
        confidence: 0.8,
      };
    }
    return null;
  }
}
