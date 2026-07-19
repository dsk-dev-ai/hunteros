import type { ScanTarget } from '@hunteros/shared';

export interface ScanProfile {
  name: string;
  description: string;
  tools: string[];
  targets: ScanTarget[];
  timeout: number;
}

export type ScanPhase = 'discovery' | 'recon' | 'scanning' | 'enumeration' | 'exploitation' | 'post-exploitation' | 'reporting';
