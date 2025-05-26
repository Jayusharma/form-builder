/**
 * Base Logger Module
 * 
 * This module provides the core logging functionality using Winston.
 * It configures logging levels, formats, and transports for both development
 * and production environments.
 */

import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';

/**
 * Log Levels Configuration
 * Defines the severity levels for logging, from most to least severe
 */
const levels = {
  error: 0,  // Critical errors that require immediate attention
  warn: 1,   // Warning messages for potential issues
  info: 2,   // General information about application flow
  http: 3,   // HTTP request logging
  debug: 4,  // Detailed debugging information
};

/**
 * Log Colors Configuration
 * Defines colors for different log levels in console output
 */
const colors = {
  error: 'red',    // Red for errors
  warn: 'yellow',  // Yellow for warnings
  info: 'green',   // Green for info
  http: 'magenta', // Magenta for HTTP logs
  debug: 'white',  // White for debug messages
};

// Add colors to winston for console output
winston.addColors(colors);

/**
 * Log Format Configuration
 * Defines how log messages should be formatted
 * Includes timestamp, colorization, and custom message format
 */
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

/**
 * Log Transports Configuration
 * Defines where and how logs should be stored
 */
const transports = [
  // Console transport for development environment
  new winston.transports.Console(),
  
  // File transport for error logs with daily rotation
  new winston.transports.DailyRotateFile({
    filename: path.join('logs', 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',        // Maximum size of each log file
    maxFiles: '14d',       // Keep logs for 14 days
    level: 'error',        // Only log error level messages
  }),
  
  // File transport for all logs with daily rotation
  new winston.transports.DailyRotateFile({
    filename: path.join('logs', 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',        // Maximum size of each log file
    maxFiles: '14d',       // Keep logs for 14 days
  }),
];

/**
 * Logger Instance
 * Creates and configures the Winston logger with the defined settings
 */
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info', // Set log level based on environment
  levels,
  format,
  transports,
});

/**
 * Stream Object for Morgan Middleware
 * Provides a write function for Morgan to pipe HTTP request logs to Winston
 */
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

export default logger; 