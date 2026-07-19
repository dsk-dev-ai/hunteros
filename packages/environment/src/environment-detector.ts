import { execSync } from 'node:child_process';
import { arch, cpus, endianness, freemem, platform, release, totalmem } from 'node:os';
import { accessSync, constants } from 'node:fs';
import { createLogger } from '@hunteros/logger';
import type { Logger } from '@hunteros/logger';
import type { EnvironmentReport, OSInfo, ShellInfo, ArchitectureInfo, CPUInfo, RAMInfo, DockerInfo, RuntimeInfo } from './types.js';

export class EnvironmentDetector {
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger ?? createLogger({}, 'environment');
  }

  async detect(): Promise<EnvironmentReport> {
    this.logger.info('Detecting environment');
    const os = this.detectOS();
    const shell = this.detectShell();
    const architecture = this.detectArchitecture();
    const cpu = this.detectCPU();
    const ram = this.detectRAM();
    const docker = await this.detectDocker();
    const runtimes = await this.detectRuntimes();
    const packageManager = this.detectPackageManager();
    return {
      os,
      shell,
      architecture,
      cpu,
      ram,
      docker,
      runtimes,
      packageManager,
      timestamp: new Date().toISOString(),
    };
  }

  private detectOS(): OSInfo {
    const osPlatform = platform();
    const osRelease = release();
    let name: string = osPlatform;
    let version: string = osRelease;
    const isWSL = this.checkWSL();
    if (osPlatform === 'linux') {
      try {
        const osReleaseContent = execSync('cat /etc/os-release 2>/dev/null || cat /usr/lib/os-release 2>/dev/null', { encoding: 'utf-8', timeout: 3000 });
        const idMatch = osReleaseContent.match(/^ID=(.+)$/m);
        const versionMatch = osReleaseContent.match(/^VERSION_ID="?(.+?)"?$/m);
        if (idMatch) name = idMatch[1]!.trim();
        if (versionMatch) version = versionMatch[1]!.trim();
      } catch {
        name = 'linux';
      }
    }
    if (osPlatform === 'darwin') {
      name = 'macOS';
      try {
        const swVers = execSync('sw_vers -productVersion 2>/dev/null', { encoding: 'utf-8', timeout: 3000 }).trim();
        if (swVers) version = swVers;
      } catch {
        // ignore
      }
    }
    if (osPlatform === 'win32') {
      name = 'Windows';
    }
    return { name, version, platform: osPlatform, kernel: osRelease, isWSL };
  }

  private checkWSL(): boolean {
    try {
      const content = execSync('uname -r 2>/dev/null', { encoding: 'utf-8', timeout: 2000 }).toLowerCase();
      return content.includes('microsoft') || content.includes('wsl');
    } catch {
      return false;
    }
  }

  private detectShell(): ShellInfo {
    const shellEnv = process.env['SHELL'] ?? process.env['ComSpec'];
    const name = shellEnv ? shellEnv.split('/').pop()?.split('\\').pop() ?? 'unknown' : 'unknown';
    return { name, path: shellEnv ?? 'unknown' };
  }

  private detectArchitecture(): ArchitectureInfo {
    return { arch: arch(), endianness: endianness() };
  }

  private detectCPU(): CPUInfo {
    const cpuInfo = cpus();
    const first = cpuInfo[0];
    return {
      model: first?.model ?? 'unknown',
      cores: cpuInfo.length,
      speedMHz: first?.speed ?? 0,
      loadAverage: (() => {
        try {
          return execSync('cat /proc/loadavg 2>/dev/null', { encoding: 'utf-8', timeout: 2000 })
            .trim()
            .split(/\s+/)
            .slice(0, 3)
            .map(Number);
        } catch {
          return [0, 0, 0];
        }
      })(),
    };
  }

  private detectRAM(): RAMInfo {
    const totalBytes = totalmem();
    const freeBytes = freemem();
    const totalGB = Math.round((totalBytes / (1024 ** 3)) * 100) / 100;
    const freeGB = Math.round((freeBytes / (1024 ** 3)) * 100) / 100;
    const usedGB = Math.round((totalGB - freeGB) * 100) / 100;
    const usagePercent = totalGB > 0 ? Math.round(((totalGB - freeGB) / totalGB) * 100 * 100) / 100 : 0;
    return { totalGB, freeGB, usedGB, usagePercent };
  }

  private async detectDocker(): Promise<DockerInfo> {
    let installed = false;
    let version = '';
    let composeVersion = '';
    try {
      const out = execSync('docker --version 2>/dev/null', { encoding: 'utf-8', timeout: 5000 }).trim();
      installed = true;
      version = out;
    } catch {
      installed = false;
    }
    try {
      const out = execSync('docker compose version 2>/dev/null || docker-compose --version 2>/dev/null', { encoding: 'utf-8', timeout: 5000 }).trim();
      composeVersion = out;
    } catch {
      composeVersion = '';
    }
    return { installed, version, composeVersion };
  }

  private async detectRuntimes(): Promise<RuntimeInfo> {
    const runCmd = (cmd: string): string => {
      try {
        return execSync(cmd, { encoding: 'utf-8', timeout: 3000 }).trim();
      } catch {
        return '';
      }
    };
    return {
      nodeVersion: runCmd('node --version 2>/dev/null'),
      pythonVersion: runCmd('python3 --version 2>/dev/null || python --version 2>/dev/null'),
      goVersion: runCmd('go version 2>/dev/null'),
      rustVersion: runCmd('rustc --version 2>/dev/null'),
    };
  }

  private detectPackageManager(): string {
    const managers = ['apt', 'apt-get', 'dnf', 'yum', 'pacman', 'zypper', 'apk', 'brew', 'choco', 'snap', 'flatpak'];
    for (const mgr of managers) {
      try {
        accessSync(`/usr/bin/${mgr}`, constants.X_OK);
        return mgr;
      } catch {
        try {
          accessSync(`/usr/local/bin/${mgr}`, constants.X_OK);
          return mgr;
        } catch {
          // not found
        }
      }
    }
    try {
      const out = execSync('which apt 2>/dev/null || which brew 2>/dev/null || which choco 2>/dev/null', { encoding: 'utf-8', timeout: 2000 }).trim();
      if (out) return out.split('/').pop() ?? 'unknown';
    } catch {
      // ignore
    }
    return 'unknown';
  }

  async getReportJson(): Promise<EnvironmentReport> {
    return this.detect();
  }
}
