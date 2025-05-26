/**
 * Form Logger Module
 * 
 * This module provides structured logging functionality specifically for form-related events.
 * It uses the base logger to record form activities with appropriate log levels and formatting.
 */

import logger from './logger';

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
  additionalInfo?: Record<string, any>; // Any additional context-specific information
}

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
        logger.info(`Form Event: ${JSON.stringify(message)}`);
        break;
      
      case 'FORM_SUBMITTED':
        logger.info(`Form Submission: ${JSON.stringify(message)}`);
        break;
      
      case 'FORM_DELETED':
        logger.warn(`Form Deleted: ${JSON.stringify(message)}`);
        break;
      
      case 'FORM_RESPONSE_VIEWED':
        logger.debug(`Form Response Viewed: ${JSON.stringify(message)}`);
        break;
      
      default:
        logger.info(`Form Event: ${JSON.stringify(message)}`);
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
};

export default formLogger; 