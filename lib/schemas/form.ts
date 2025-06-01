/**
 * Form Schema Definitions
 * 
 * This module defines Zod schemas and TypeScript interfaces for form-related data structures.
 * It includes validation rules, type definitions, and interfaces for:
 * - Form fields and their types
 * - Form submissions and responses
 * - Grid positioning
 * - Form styling
 * - Complete form structure
 * 
 * The schemas provide runtime validation while the interfaces provide type safety.
 */

import { z } from 'zod';

/**
 * Form Field Type Enumeration
 * Defines the available types of form fields
 * 
 * @enum {string}
 * - TEXT: Single-line text input
 * - PARAGRAPH: Multi-line text input
 * - MULTIPLE_CHOICE: Radio button selection
 * - CHECKBOX: Multiple selection
 * - DROPDOWN: Select dropdown
 * - SUBMIT: Submit button
 * - IMAGE_UPLOAD: Image upload field
 * - RICH_TEXT: Rich text editor
 */
export const FormFieldTypeEnum = z.enum([
  'TEXT',
  'PARAGRAPH',
  'MULTIPLE_CHOICE',
  'CHECKBOX',
  'DROPDOWN',
  'SUBMIT',
  'IMAGE_UPLOAD',
  'RICH_TEXT'
]);

/**
 * Form Submission Schema
 * Validates form submission data structure
 * 
 * @property {string} formId - Required form identifier
 * @property {Record<string, any>} responses - Form responses with validation
 *   - Must contain at least one response
 *   - Responses can be strings, numbers, booleans, or string arrays
 */
export const FormSubmissionSchema = z.object({
  formId: z.string().min(1, "Form ID is required"),
  responses: z.record(
    z.union([
      z.string().min(1, "Response cannot be empty"),
      z.number(),
      z.boolean(),
      z.array(z.string()).min(1, "At least one option must be selected"),
    ])
  ).refine(
    (responses) => Object.keys(responses).length > 0,
    "At least one response is required"
  ),
});

/**
 * Grid Position Schema
 * Validates grid positioning for form fields
 * 
 * @property {number} x - X coordinate (0 or greater)
 * @property {number} y - Y coordinate (0 or greater)
 * @property {number} width - Width (1-12 grid units)
 * @property {number} height - Height (minimum 1 unit)
 */
export const GridPositionSchema = z.object({
  x: z.number().min(0, "X position must be 0 or greater"),
  y: z.number().min(0, "Y position must be 0 or greater"),
  width: z.number().min(1, "Width must be at least 1").max(12, "Width cannot exceed 12"),
  height: z.number().min(1, "Height must be at least 1"),
});

/**
 * Form Field Schema
 * Validates individual form field structure
 * 
 * @property {string} [id] - Optional field identifier
 * @property {FormFieldType} type - Field type from enum
 * @property {string} question - Required question text
 * @property {boolean} required - Whether field is required
 * @property {string[]} [options] - Optional choices for selection fields
 * @property {string|null} [description] - Optional field description
 * @property {GridPosition} gridPosition - Field position in grid
 */
export const FormFieldSchema = z.object({
  id: z.string().optional(),
  type: FormFieldTypeEnum,
  question: z.string().min(1, "Question is required"),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional().default([]),
  description: z.string().nullable().optional().default(null),
  gridPosition: GridPositionSchema,
});

/**
 * Form Style Schema
 * Validates form styling properties
 * All properties are optional with defaults
 * 
 * @property {string} [width] - Form width
 * @property {string} [alignment] - Content alignment
 * @property {string} [spacing] - Element spacing
 * @property {string} [borderRadius] - Border radius
 * @property {string} [backgroundColor] - Background color
 * @property {string} [textColor] - Text color
 * @property {string} [primaryColor] - Primary color
 * @property {string} [borderColor] - Border color
 * @property {string} [fontFamily] - Font family
 * @property {string} [headingFontSize] - Heading font size
 * @property {string} [bodyFontSize] - Body font size
 */
export const FormStyleSchema = z.object({
  width: z.string().optional(),
  alignment: z.string().optional(),
  spacing: z.string().optional(),
  borderRadius: z.string().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  primaryColor: z.string().optional(),
  borderColor: z.string().optional(),
  fontFamily: z.string().optional(),
  headingFontSize: z.string().optional(),
  bodyFontSize: z.string().optional(),
}).optional().default({});

/**
 * Form Schema
 * Validates complete form structure
 * 
 * @property {string} title - Required form title
 * @property {string|null} [description] - Optional form description
 * @property {FormField[]} fields - Array of form fields
 * @property {FormStyle} [style] - Optional form styling
 * @property {FormHeader} [header] - Optional form header
 * @property {FormFooter} [footer] - Optional form footer
 */
export const FormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable().optional().default(null),
  fields: z.array(FormFieldSchema).min(1, "At least one field is required"),
  style: FormStyleSchema,
  header: z.object({
    logo: z.string().optional(),
    text: z.string().optional(),
  }).nullable().optional().default(null),
  footer: z.object({
    logo: z.string().optional(),
    text: z.string().optional(),
  }).nullable().optional().default(null),
});

// Type Definitions
export type FormFieldType = z.infer<typeof FormFieldTypeEnum>;

/**
 * Grid Position Interface
 * Defines the structure for field positioning in the grid
 */
export interface GridPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Form Field Interface
 * Defines the structure of a form field
 */
export interface FormField {
  id: string;
  type: FormFieldType;
  question: string;
  required: boolean;
  options?: string[];
  description?: string;
  gridPosition: GridPosition;
}

/**
 * Form Style Interface
 * Defines the styling properties for a form
 * All properties have specific allowed values
 */
export interface FormStyle {
  width: 'small' | 'medium' | 'large';
  alignment: 'left' | 'center' | 'right';
  spacing: 'compact' | 'comfortable' | 'spacious';
  borderRadius: 'sm' | 'md' | 'lg';
  backgroundColor: string;
  textColor: string;
  primaryColor: string;
  borderColor: string;
  fontFamily: string;
  headingFontSize: string;
  bodyFontSize: string;
}

/**
 * Form Interface
 * Defines the complete structure of a form
 */
export interface Form {
  id: string;
  title: string;
  description: string | null;
  fields: FormField[];
  style: FormStyle;
  createdAt: Date;
  updatedAt: Date;
  isPublished: boolean;
}

/**
 * Form Response Interface
 * Defines the structure of a form response
 */
export interface FormResponse {
  formId: string;
  responses: Record<string, FormFieldValue>;
  submittedAt: Date;
}

/**
 * Answer Interface
 * Defines the structure of an answer to a form field
 */
export interface Answer {
  fieldId: string;
  value: string | number | boolean | null;
}

/**
 * Form Submission Interface
 * Extends FormResponse with additional metadata
 */
export interface FormSubmission extends FormResponse {
  id: string;
  formId: string;
  answers: Answer[];
  createdAt: Date;
  updatedAt: Date;
}

export type FormFieldValue = string | number | boolean | null | File; 