/**
 * Form Schema Definitions
 * 
 * This module defines Zod validation schemas for form-related data structures.
 * These schemas provide runtime validation for form data, ensuring type safety
 * and data integrity throughout the application.
 */

import * as z from "zod";

/**
 * Form Field Schema
 * Validates the structure of individual form fields
 * 
 * @property {string} id - Unique identifier for the field
 * @property {FormFieldType} type - Type of form field (text, paragraph, etc.)
 * @property {string} question - Field question text (minimum 1 character)
 * @property {boolean} required - Whether the field is required
 * @property {string[]} [options] - Optional array of choices for selection fields
 */
export const FormFieldSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'paragraph', 'multiple_choice', 'checkbox', 'dropdown']),
  question: z.string().min(1, "Question is required"),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
});

/**
 * Form Schema
 * Validates the structure of a complete form
 * 
 * @property {string} title - Form title (minimum 1 character)
 * @property {string} [description] - Optional form description
 * @property {FormField[]} fields - Array of form fields
 */
export const FormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  fields: z.array(FormFieldSchema),
});

/**
 * Form Submission Schema
 * Validates the structure of form submissions
 * 
 * @property {string} formId - ID of the submitted form
 * @property {Record<string, string|string[]|boolean>} responses - 
 *   Object containing field responses, where:
 *   - Keys are field IDs
 *   - Values can be strings, arrays of strings, or booleans
 */
export const FormSubmissionSchema = z.object({
  formId: z.string(),
  responses: z.record(z.string(), z.union([
    z.string(),
    z.array(z.string()),
    z.boolean(),
  ])),
});

// Type definitions inferred from Zod schemas
export type FormField = z.infer<typeof FormFieldSchema>;
export type Form = z.infer<typeof FormSchema>;
export type FormSubmission = z.infer<typeof FormSubmissionSchema>; 