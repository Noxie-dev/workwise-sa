// server/utils/enhanced-logger.ts
import winston from 'winston';
import { Request } from 'express';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'info';
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(colors);

// Define the format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.metadata ? ' ' + JSON.stringify(info.metadata) : ''}`
  )
);

// Define the format for file output (JSON)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.json()
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: consoleFormat,
  }),
];

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create the logger
export const logger = winston.createLogger({
  level: level(),
  levels,
  format: winston.format.combine(
    winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
    winston.format.json()
  ),
  transports,
  defaultMeta: { service: 'workwise-api' },
});

// Extract request information for logging
export const extractRequestInfo = (req: Request) => {
  return {
    requestId: (req as any).requestId || 'unknown',
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  };
};

// HTTP request logger middleware
export const httpLogger = (req: Request, res: Response, next: Function) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const requestInfo = extractRequestInfo(req);
    
    logger.http(`${req.method} ${req.path}`, {
      ...requestInfo,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  
  next();
};