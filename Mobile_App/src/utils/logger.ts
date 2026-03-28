/**
 * Logger Utility
 * 
 * Provides conditional logging that only works in development mode.
 * In production, all logs are no-ops to improve performance.
 */

type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = __DEV__ || false;
  }

  /**
   * Log a message (only in development)
   */
  log(...args: any[]): void {
    if (this.isDevelopment) {
      console.log(...args);
    }
  }

  /**
   * Log a warning (only in development)
   */
  warn(...args: any[]): void {
    if (this.isDevelopment) {
      console.warn(...args);
    }
  }

  /**
   * Log an error (always logged, even in production)
   */
  error(...args: any[]): void {
    // Errors should always be logged for debugging production issues
    console.error(...args);
  }

  /**
   * Log an info message (only in development)
   */
  info(...args: any[]): void {
    if (this.isDevelopment) {
      console.info(...args);
    }
  }

  /**
   * Log a debug message (only in development)
   */
  debug(...args: any[]): void {
    if (this.isDevelopment) {
      console.debug(...args);
    }
  }

  /**
   * Group related logs together (only in development)
   */
  group(...args: any[]): void {
    if (this.isDevelopment) {
      console.group(...args);
    }
  }

  /**
   * End a log group (only in development)
   */
  groupEnd(): void {
    if (this.isDevelopment) {
      console.groupEnd();
    }
  }

  /**
   * Log a table (only in development)
   */
  table(...args: any[]): void {
    if (this.isDevelopment) {
      console.table(...args);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export default for convenience
export default logger;

