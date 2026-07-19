import { accessSync, constants } from 'node:fs';

export function whichSync(binaryNames: string[]): string | null {
  const pathDirs = (process.env['PATH'] ?? '').split(':');
  for (const name of binaryNames) {
    for (const dir of pathDirs) {
      try {
        const fullPath = `${dir}/${name}`;
        accessSync(fullPath, constants.X_OK);
        return fullPath;
      } catch {
        // not in this directory
      }
    }
  }
  return null;
}
