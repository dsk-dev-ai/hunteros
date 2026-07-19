export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  module?: string;
  error?: Error;
  metadata?: Record<string, unknown>;
}

export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: Error, meta?: Record<string, unknown>): void;
  child(module: string): Logger;
}
