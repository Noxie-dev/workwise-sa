// server/utils/logger.ts
import * as fs from 'fs';
import * as path from 'path';

// Log levels
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

// Log entry interface
interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  requestId?: string;
  [key: string]: any;
}

// Logger configuration
interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  logFilePath: string;
  logFileMaxSize: number; // in bytes
  logFileRotation: number; // number of files to keep
}

class Logger {
  private config: LoggerConfig;
  private logStream: fs.WriteStream | null = null;

  constructor(config?: Partial<LoggerConfig>) {
    // Default configuration
    this.config = {
      level: this.getLogLevelFromEnv(),
      enableConsole: true,
      enableFile: process.env.NODE_ENV === 'production',
      logFilePath: path.join(process.cwd(), 'logs', 'app.log'),
      logFileMaxSize: 10 * 1024 * 1024, // 10MB
      logFileRotation: 5,
      ...config,
    };

    // Initialize file logging if enabled
    if (this.config.enableFile) {
      this.initializeFileLogging();
    }
  }

  /**
   * Get log level from environment variable
   */
  private getLogLevelFromEnv(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase();
    
    switch (envLevel) {
      case 'debug':
        return LogLevel.DEBUG;
      case 'info':
        return LogLevel.INFO;
      case 'warn':
        return LogLevel.WARN;
      case 'error':
        return LogLevel.ERROR;
      default:
        return process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
    }
  }

  /**
   * Initialize file logging
   */
  private initializeFileLogging(): void {
    try {
      // Create logs directory if it doesn't exist
      const logDir = path.dirname(this.config.logFilePath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      // Check if log file needs rotation
      this.rotateLogFileIfNeeded();

      // Create write stream
      this.logStream = fs.createWriteStream(this.config.logFilePath, { flags: 'a' });
      
      // Handle process exit
      process.on('exit', () => {
        if (this.logStream) {
          this.logStream.end();
        }
      });
    } catch (error) {
      console.error('Failed to initialize file logging:', error);
      this.config.enableFile = false;
    }
  }

  /**
   * Rotate log file if it exceeds the maximum size
   */
  private rotateLogFileIfNeeded(): void {
    try {
      if (fs.existsSync(this.config.logFilePath)) {
        const stats = fs.statSync(this.config.logFilePath);
        
        if (stats.size >= this.config.logFileMaxSize) {
          // Rotate log files
          for (let i = this.config.logFileRotation - 1; i > 0; i--) {
            const oldPath = `${this.config.logFilePath}.${i}`;
            const newPath = `${this.config.logFilePath}.${i + 1}`;
            
            if (fs.existsSync(oldPath)) {
              fs.renameSync(oldPath, newPath);
            }
          }
          
          // Rename current log file
          fs.renameSync(this.config.logFilePath, `${this.config.logFilePath}.1`);
        }
      }
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  /**
   * Format log entry as JSON string
   */
  private formatLogEntry(level: string, message: string, meta?: Record<string, any>): string {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
    };

    return JSON.stringify(entry);
  }

  /**
   * Write log entry to configured outputs
   */
  private log(level: LogLevel, levelName: string, message: string, meta?: Record<string, any>): void {
    // Skip if log level is higher than configured level
    if (level > this.config.level) {
      return;
    }

    const formattedEntry = this.formatLogEntry(levelName, message, meta);

    // Write to console
    if (this.config.enableConsole) {
      const consoleMethod = level === LogLevel.ERROR ? 'error' : 
                           level === LogLevel.WARN ? 'warn' : 
                           level === LogLevel.DEBUG ? 'debug' : 'log';
      
      console[consoleMethod](formattedEntry);
    }

    // Write to file
    if (this.config.enableFile && this.logStream) {
      this.logStream.write(`${formattedEntry}\n`);
    }
  }

  /**
   * Log error message
   */
  error(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.ERROR, 'ERROR', message, meta);
  }

  /**
   * Log warning message
   */
  warn(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.WARN, 'WARN', message, meta);
  }

  /**
   * Log info message
   */
  info(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.INFO, 'INFO', message, meta);
  }

  /**
   * Log debug message
   */
  debug(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, 'DEBUG', message, meta);
  }

  /**
   * Update logger configuration
   */
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Reinitialize file logging if enabled
    if (this.config.enableFile && !this.logStream) {
      this.initializeFileLogging();
    }
  }
}

// Create and export singleton logger instance
export const logger = new Logger();