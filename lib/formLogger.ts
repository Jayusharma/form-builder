/**
 * Form Logger Module
 * 
 * This module provides structured logging functionality specifically for form-related events.
 * It uses the base logger to record form activities with appropriate log levels and formatting.
 * Logs are stored in date-based files in the logs directory.
 */

import fs from 'fs';
import path from 'path';
import { EOL } from 'os';

/**
 * Form Event Types
 * Defines all possible form-related events that can be logged
 */
export type FormEventType = 
  | 'FORM_CREATED'      // When a new form is created
  | 'FORM_UPDATED'      // When an existing form is modified
  | 'FORM_DELETED'      // When a form is deleted
  | 'FORM_MADE_PRIVATE' // When a form's visibility is set to private
  | 'FORM_MADE_PUBLIC'  // When a form's visibility is set to public
  | 'FORM_SUBMITTED'    // When a form receives a new submission
  | 'FORM_RESPONSE_VIEWED' // When form responses are viewed
  | 'FORM_SHARED'       // When a form is shared with others
  | 'FORM_REQUEST_UNAUTHORIZED' // When unauthorized access is attempted
  | 'FORM_REQUEST_PROCESSING'   // When processing a form request
  | 'FORM_REQUEST_NOT_FOUND'    // When a requested form is not found
  | 'FORM_REQUEST_FORBIDDEN'    // When access is forbidden
  | 'FORM_REQUEST_ACCEPTED'     // When a request is accepted
  | 'FORM_REQUEST_REJECTED'     // When a request is rejected
  | 'FORM_REQUEST_ERROR';       // When an error occurs during request processing

/**
 * Form Log Data Interface
 * Defines the structure of data to be logged for form events
 */
interface FormLogData {
  formId?: string;                    // Unique identifier of the form
  userId?: string;                    // ID of the user performing the action
  formTitle?: string;                 // Title of the form
  additionalInfo?: Record<string, unknown>; // Any additional context-specific information
}

/**
 * Log Entry Interface
 * Defines the structure of a log entry
 */
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  event: FormEventType;
  formId?: string;
  formTitle?: string;
  userId?: string;
  userName?: string;
  additionalInfo?: Record<string, unknown>;
  message?: string;
}

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

// Function to get the current date in YYYY-MM-DD format
const getCurrentDate = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

// Function to get formatted timestamp
const getFormattedTimestamp = () => {
  return new Date().toISOString();
};

// Function to clean and format log data
const cleanLogData = (data: Partial<LogEntry>): LogEntry => {
  // Remove undefined and null values
  const cleaned = Object.entries(data).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, unknown>);

  // Ensure essential fields are present
  return {
    ...cleaned,
    timestamp: getFormattedTimestamp()
  } as LogEntry;
};

// Function to create a log entry
const createLogEntry = (
  level: LogLevel,
  event: FormEventType,
  data: FormLogData,
  message?: string
): LogEntry => {
  const baseEntry: Partial<LogEntry> = {
    timestamp: getFormattedTimestamp(),
    level,
    event,
    formId: data.formId,
    formTitle: data.formTitle,
    userId: data.userId,
    userName: typeof data.additionalInfo?.userName === 'string' ? data.additionalInfo.userName : undefined
  };

  // If there's additional info, add it separately
  if (data.additionalInfo) {
    // Destructure userName but don't use it since it's handled above
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { userName: _, ...otherInfo } = data.additionalInfo;
    if (Object.keys(otherInfo).length > 0) {
      baseEntry.additionalInfo = otherInfo;
    }
  }

  // Add message if provided
  if (message) {
    baseEntry.message = message;
  }

  return cleanLogData(baseEntry);
};

// Function to write logs to appropriate files based on level
const writeToFile = async (logEntry: LogEntry, level: LogLevel = 'info') => {
  try {
    const logsDir = path.join(process.cwd(), 'logs');
    const currentDate = getCurrentDate();
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Format log entry as a single line with proper line ending
    const logString = JSON.stringify(logEntry) + EOL;

    // Write to combined logs
    const combinedLogFile = path.join(logsDir, `combined-${currentDate}.log`);
    fs.appendFileSync(combinedLogFile, logString);

    // Write errors to separate error log
    if (level === 'error') {
      const errorLogFile = path.join(logsDir, `error-${currentDate}.log`);
      fs.appendFileSync(errorLogFile, logString);
    }
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
};

/**
 * Form Logger Object
 * Provides methods for logging form-related events with appropriate log levels
 */
export const formLogger = {
  /**
   * Logs a form event with the specified type and data
   * @param eventType - The type of form event being logged
   * @param data - The data associated with the form event
   */
  logFormEvent: (eventType: FormEventType, data: FormLogData) => {
    const logEntry = createLogEntry('info', eventType, data);
    writeToFile(logEntry);
    console.log(`[${logEntry.timestamp}] ${eventType}:`, JSON.stringify(logEntry, null, 2));
  },

  /**
   * Convenience method to log form creation events
   * @param data - Form creation event data
   */
  logFormCreated: (data: FormLogData) => {
    formLogger.logFormEvent('FORM_CREATED', data);
  },

  /**
   * Convenience method to log form privacy changes to private
   * @param data - Form privacy change event data
   */
  logFormMadePrivate: (data: FormLogData) => {
    formLogger.logFormEvent('FORM_MADE_PRIVATE', data);
  },

  /**
   * Convenience method to log form privacy changes to public
   * @param data - Form privacy change event data
   */
  logFormMadePublic: (data: FormLogData) => {
    formLogger.logFormEvent('FORM_MADE_PUBLIC', data);
  },

  /**
   * Convenience method to log form submission events
   * @param data - Form submission event data
   */
  logFormSubmitted: (data: FormLogData) => {
    formLogger.logFormEvent('FORM_SUBMITTED', data);
  },

  /**
   * Convenience method to log form deletion events
   * @param data - Form deletion event data
   */
  logFormDeleted: (data: FormLogData) => {
    formLogger.logFormEvent('FORM_DELETED', data);
  },

  /**
   * Convenience method to log form sharing events
   * @param data - Form sharing event data
   */
  logFormShared: (data: FormLogData) => {
    formLogger.logFormEvent('FORM_SHARED', data);
  },

  /**
   * Convenience method to log form response viewing events
   * @param data - Form response viewing event data
   */
  logFormResponseViewed: (data: FormLogData) => {
    formLogger.logFormEvent('FORM_RESPONSE_VIEWED', data);
  },

  /**
   * Basic logging method with level support
   */
  async log(
    level: LogLevel,
    message: string,
    metadata: Record<string, unknown> = {},
    userId?: string
  ) {
    const logEntry = createLogEntry(
      level,
      (typeof metadata.event === 'string' ? metadata.event as FormEventType : 'FORM_REQUEST_ERROR'),
      {
        formId: typeof metadata.formId === 'string' ? metadata.formId : undefined,
        formTitle: typeof metadata.formTitle === 'string' ? metadata.formTitle : undefined,
        userId,
        additionalInfo: metadata
      },
      message
    );

    writeToFile(logEntry, level);

    // For console output only, use pretty printing
    const prettyLog = JSON.stringify(logEntry, null, 2);
    switch (level) {
      case 'warn':
        console.warn(prettyLog);
        break;
      case 'error':
        console.error(prettyLog);
        break;
      default:
        console.log(prettyLog);
    }
  },

  info(message: string, metadata: Record<string, unknown> = {}, userId?: string) {
    return this.log('info', message, metadata, userId);
  },

  warn(message: string, metadata: Record<string, unknown> = {}, userId?: string) {
    return this.log('warn', message, metadata, userId);
  },

  error(message: string, metadata: Record<string, unknown> = {}, userId?: string) {
    return this.log('error', message, metadata, userId);
  },

  debug(message: string, metadata: Record<string, unknown> = {}, userId?: string) {
    return this.log('debug', message, metadata, userId);
  },
};

export default formLogger; 