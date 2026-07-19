import { describe, it, expect } from 'vitest';
import { NextJSDetector, ExpressDetector } from '../src/detectors.js';
import { FrameworkDetectorRegistry } from '../src/registry.js';
import { createLogger } from '@hunteros/logger';
import { LogLevel } from '@hunteros/shared';
import type { PackageJsonInfo } from '@hunteros/parser';

describe('FrameworkDetectors', () => {
  it('NextJSDetector should detect Next.js from config', () => {
    const detector = new NextJSDetector();
    const result = detector.detect(null, ['next.config.js'], '');
    expect(result).not.toBeNull();
    expect(result!.name).toBe('next.js');
  });

  it('ExpressDetector should detect Express from dependency', () => {
    const detector = new ExpressDetector();
    const pkg: PackageJsonInfo = {
      dependencies: { express: '^4.18.0' },
      devDependencies: {},
      scripts: {},
    };
    const result = detector.detect(pkg, [], '');
    expect(result).not.toBeNull();
    expect(result!.name).toBe('express');
  });

  it('FrameworkDetectorRegistry should run all detectors', () => {
    const logger = createLogger({ level: LogLevel.Silent });
    const registry = new FrameworkDetectorRegistry(logger);
    const pkg: PackageJsonInfo = {
      dependencies: { next: '^14.0.0', react: '^18.0.0', express: '^4.18.0' },
      devDependencies: {},
      scripts: { dev: 'next dev' },
    };
    const result = registry.detectAll(pkg, ['next.config.js'], '');
    expect(result.length).toBeGreaterThanOrEqual(3);
  });
});
