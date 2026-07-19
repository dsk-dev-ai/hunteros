export interface OSInfo {
  name: string;
  version: string;
  platform: string;
  kernel: string;
  isWSL: boolean;
}

export interface ShellInfo {
  name: string;
  path: string;
}

export interface ArchitectureInfo {
  arch: string;
  endianness: string;
}

export interface CPUInfo {
  model: string;
  cores: number;
  speedMHz: number;
  loadAverage: number[];
}

export interface RAMInfo {
  totalGB: number;
  freeGB: number;
  usedGB: number;
  usagePercent: number;
}

export interface DockerInfo {
  installed: boolean;
  version: string;
  composeVersion: string;
}

export interface RuntimeInfo {
  nodeVersion: string;
  pythonVersion: string;
  goVersion: string;
  rustVersion: string;
}

export interface EnvironmentReport {
  os: OSInfo;
  shell: ShellInfo;
  architecture: ArchitectureInfo;
  cpu: CPUInfo;
  ram: RAMInfo;
  docker: DockerInfo;
  runtimes: RuntimeInfo;
  packageManager: string;
  timestamp: string;
}
