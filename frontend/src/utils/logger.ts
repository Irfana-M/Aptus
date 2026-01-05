export const LogLevel = {
  ERROR: "ERROR",
  WARN: "WARN",
  INFO: "INFO",
  DEBUG: "DEBUG",
} as const;

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

class Logger {
  private level: LogLevel;
  private levelPriority: Record<LogLevel, number> = {
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.ERROR]: 3,
  };

  constructor(level: LogLevel = LogLevel.DEBUG) {
    this.level = level;
  }

  debug(...args: unknown[]) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log("🔍 [DEBUG]", ...args);
    }
  }

  info(...args: unknown[]) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log("ℹ️ [INFO]", ...args);
    }
  }

  warn(...args: unknown[]) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn("⚠️ [WARN]", ...args);
    }
  }

  error(...args: unknown[]) {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error("❌ [ERROR]", ...args);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levelPriority[this.level] <= this.levelPriority[level];
  }

  api(url: string, method: string, data?: unknown) {
    this.debug(`🔄 API ${method.toUpperCase()} ${url}`, data);
  }

  auth(action: string, data?: unknown) {
    this.info(`🔐 AUTH ${action}`, data);
  }
}

const isProd =
  typeof process !== "undefined"
    ? process.env.NODE_ENV === "production"
    : import.meta.env.MODE === "production";

export const logger = new Logger(isProd ? LogLevel.WARN : LogLevel.INFO);
