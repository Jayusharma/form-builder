/**
 * Form Logger Module
 * 
 * This module provides structured logging functionality specifically for form-related events.
 * It uses the base logger to record form activities with appropriate log levels and formatting.
 */

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
  | 'FORM_SHARED';      // When a form is shared with others

/**
 * Form Log Data Interface
 * Defines the structure of data to be logged for form events
 */
interface FormLogData {
  formId: string;                    // Unique identifier of the form
  userId?: string;                   // ID of the user performing the action
  formTitle?: string;                // Title of the form
  additionalInfo?: Record<string, unknown>; // Any additional context-specific information
}

export type LogLevel = 'info' | 'warning' | 'error';

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
    const { formId, userId, formTitle, additionalInfo } = data;
    
    const message = {
      event: eventType,
      formId,
      userId,
      formTitle,
      ...additionalInfo,
    };

    // Log with appropriate level based on event type
    switch (eventType) {
      case 'FORM_CREATED':
      case 'FORM_UPDATED':
      case 'FORM_MADE_PRIVATE':
      case 'FORM_MADE_PUBLIC':
      case 'FORM_SHARED':
        formLogger.info(`Form Event: ${JSON.stringify(message)}`);
        break;
      
      case 'FORM_SUBMITTED':
        formLogger.info(`Form Submission: ${JSON.stringify(message)}`);
        break;
      
      case 'FORM_DELETED':
        formLogger.warning(`Form Deleted: ${JSON.stringify(message)}`);
        break;
      
      case 'FORM_RESPONSE_VIEWED':
        formLogger.debug(`Form Response Viewed: ${JSON.stringify(message)}`);
        break;
      
      default:
        formLogger.info(`Form Event: ${JSON.stringify(message)}`);
    }
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

  async log(
    level: LogLevel,
    message: string,
    metadata: Record<string, unknown> = {},
    userId?: string
  ) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        metadata,
        userId,
      };

      switch (level) {
        case 'warning':
          console.warn(JSON.stringify(logEntry, null, 2));
          break;
        case 'error':
          console.error(JSON.stringify(logEntry, null, 2));
          break;
        default:
          console.log(JSON.stringify(logEntry, null, 2));
      }
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  },

  info(message: string, metadata: Record<string, unknown> = {}, userId?: string) {
    return this.log('info', message, metadata, userId);
  },

  warning(message: string, metadata: Record<string, unknown> = {}, userId?: string) {
    return this.log('warning', message, metadata, userId);
  },

  error(message: string, metadata: Record<string, unknown> = {}, userId?: string) {
    return this.log('error', message, metadata, userId);
  },

  debug(message: string, metadata: Record<string, unknown> = {}, userId?: string) {
    return this.log('info', message, metadata, userId);
  },
};

export default formLogger; 