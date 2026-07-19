import type { FrameworkInfo, FrameworkCategory } from '@hunteros/shared';
import type { PackageJsonInfo } from '@hunteros/parser';
import type { Logger } from '@hunteros/logger';
import type { FrameworkDetector } from './detectors.js';
import {
  NextJSDetector, ExpressDetector, ReactDetector,
  NestJSDetector, FastifyDetector, NodeJSDetector,
} from './detectors.js';

export class FrameworkDetectorRegistry {
  private detectors: FrameworkDetector[] = [];
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.registerDefaults();
  }

  private registerDefaults(): void {
    this.detectors.push(
      new NextJSDetector(),
      new ExpressDetector(),
      new ReactDetector(),
      new NestJSDetector(),
      new FastifyDetector(),
      new NodeJSDetector(),
    );
  }

  register(detector: FrameworkDetector): void {
    this.detectors.push(detector);
  }

  detectAll(
    pkg: PackageJsonInfo | null,
    files: string[],
    content: string,
  ): FrameworkInfo[] {
    const frameworks: FrameworkInfo[] = [];
    for (const detector of this.detectors) {
      try {
        const result = detector.detect(pkg, files, content);
        if (result) {
          frameworks.push(result);
          this.logger.debug(`Detected framework: ${result.name} (confidence: ${result.confidence})`);
        }
      } catch (error) {
        this.logger.error(`Framework detector ${detector.name} failed`, error as Error);
      }
    }
    return frameworks;
  }

  getDetectors(): FrameworkDetector[] {
    return [...this.detectors];
  }
}
