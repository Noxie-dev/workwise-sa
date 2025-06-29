/**
 * Structured logger for the application
 */

// Log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

// Log entry interface
interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: any;
}

// Environment
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Minimum log level based on environment
const getMinLogLevel = (): LogLevel => {
  if (isTest) return LogLevel.ERROR; // Only log errors in test
  if (isDevelopment) return LogLevel.DEBUG; // Log everything in development
  return LogLevel.INFO; // Default to INFO in production
};

// Log level priority
const LOG_LEVEL_PRIORITY = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
};

// Should this log level be logged?
const shouldLog = (level: LogLevel): boolean => {
  const minLevel = getMinLogLevel();
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[minLevel];
};

// Format log entry for console output
const formatLogEntry = (entry: LogEntry): string => {
  // Extract main properties
  const { level, message, timestamp, ...rest } = entry;
  
  // Format the log message
  let formattedMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  
  // Add additional properties if they exist
  if (Object.keys(rest).length > 0) {
    // In development, format for readability
    if (isDevelopment) {
      formattedMessage += '\n' + JSON.stringify(rest, null, 2);
    } else {
      // In production, keep it compact
      formattedMessage += ' ' + JSON.stringify(rest);
    }
  }
  
  return formattedMessage;
};

// Color the log output in development
const colorize = (level: LogLevel, message: string): string => {
  if (!isDevelopment) return message;
  
  const colors = {
    [LogLevel.DEBUG]: '\x1b[34m', // Blue
    [LogLevel.INFO]: '\x1b[32m',  // Green
    [LogLevel.WARN]: '\x1b[33m',  // Yellow
    [LogLevel.ERROR]: '\x1b[31m', // Red
    reset: '\x1b[0m',
  };
  
  return `${colors[level]}${message}${colors.reset}`;
};

// Log a message at a specific level
const log = (level: LogLevel, message: string | object, ...args: any[]): void => {
  if (!shouldLog(level)) return;
  
  // Create the log entry
  const entry: LogEntry = {
    level,
    message: typeof message === 'string' ? message : message.toString(),
    timestamp: new Date().toISOString(),
  };
  
  // If message is an object, merge it with the entry
  if (typeof message === 'object') {
    Object.assign(entry, message);
  }
  
  // Add additional arguments if provided
  if (args.length === 1 && typeof args[0] === 'object') {
    Object.assign(entry, args[0]);
  }
  
  // Format the log entry
  const formattedEntry = formatLogEntry(entry);
  
  // Output to console with appropriate color
  switch (level) {
    case LogLevel.DEBUG:
      console.debug(colorize(level, formattedEntry));
      break;
    case LogLevel.INFO:
      console.info(colorize(level, formattedEntry));
      break;
    case LogLevel.WARN:
      console.warn(colorize(level, formattedEntry));
      break;
    case LogLevel.ERROR:
      console.error(colorize(level, formattedEntry));
      break;
  }
  
  // In production, you might want to send logs to a service like Loggly, Papertrail, etc.
  // This would be implemented here
};

// Export the logger
export const logger = {
  debug: (message: string | object, ...args: any[]) => log(LogLevel.DEBUG, message, ...args),
  info: (message: string | object, ...args: any[]) => log(LogLevel.INFO, message, ...args),
  warn: (message: string | object, ...args: any[]) => log(LogLevel.WARN, message, ...args),
  error: (message: string | object, ...args: any[]) => log(LogLevel.ERROR, message, ...args),
};
