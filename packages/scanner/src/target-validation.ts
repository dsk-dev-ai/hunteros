import type { ScanTarget } from '@hunteros/shared';

const UNSAFE_CHARACTERS = /[\s;&|`$"'\\<>]/;

const TARGET_TYPE_PATTERNS: Record<ScanTarget['type'], RegExp> = {
  host: /^[a-zA-Z0-9][a-zA-Z0-9.-]*$/,
  domain: /^[a-zA-Z0-9][a-zA-Z0-9.-]*$/,
  ip: /^[0-9a-fA-F:.]+$/,
  network: /^[0-9a-fA-F:./]+$/,
  url: /^https?:\/\/[a-zA-Z0-9][A-Za-z0-9\-._~:\/?#@!%*+=,()[\]]*$/,
  file: /^[a-zA-Z0-9._:\/~-]+$/,
  directory: /^[a-zA-Z0-9._:\/~-]+$/,
};

export function validateTarget(target: ScanTarget): ScanTarget {
  const { type, value } = target;

  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Invalid scan target of type "${type}": value must be a non-empty string`);
  }

  if (UNSAFE_CHARACTERS.test(value)) {
    throw new Error(
      `Invalid scan target of type "${type}": "${value}" contains shell metacharacters or whitespace and will not be executed`,
    );
  }

  const pattern = TARGET_TYPE_PATTERNS[type];
  if (!pattern.test(value)) {
    throw new Error(
      `Invalid scan target of type "${type}": "${value}" does not match the allowed format for this target type`,
    );
  }

  return target;
}
