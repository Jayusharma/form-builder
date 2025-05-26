/**
 * Form Type Definitions
 * 
 * This module defines TypeScript interfaces for form-related data structures.
 * These interfaces provide type safety and autocompletion support throughout
 * the application, complementing the Zod validation schemas.
 */

import { FormFieldType } from '@/lib/schemas/form';

/**
 * Grid Position Interface
 * Defines the positioning of form fields in a grid layout
 * 
 * @property {number} x - X coordinate in the grid (0-based)
 * @property {number} y - Y coordinate in the grid (0-based)
 * @property {number} width - Width of the field in grid units
 * @property {number} height - Height of the field in grid units
 */
export interface GridPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Form Field Interface
 * Defines the structure of a form field with its properties and layout
 * 
 * @property {string} id - Unique identifier for the field
 * @property {FormFieldType} type - Type of form field
 * @property {string} question - Field question text
 * @property {boolean} required - Whether the field is required
 * @property {string[]} [options] - Optional array of choices for selection fields
 * @property {string|null} description - Optional field description or rich text content
 * @property {GridPosition} gridPosition - Field position in the grid layout
 */
export interface FormField {
  id: string;
  type: FormFieldType;
  question: string;
  required: boolean;
  options?: string[];
  description: string | null;
  gridPosition: GridPosition;
}

/**
 * Form Style Interface
 * Defines the styling properties for a form
 * 
 * @property {'small'|'medium'|'large'} width - Form width setting
 * @property {'left'|'center'|'right'} alignment - Content alignment
 * @property {'compact'|'comfortable'|'spacious'} spacing - Element spacing
 * @property {'sm'|'md'|'lg'} borderRadius - Border radius size
 * @property {string} backgroundColor - Form background color
 * @property {string} textColor - Form text color
 * @property {string} primaryColor - Primary accent color
 * @property {string} borderColor - Border color
 * @property {string} fontFamily - Font family
 * @property {string} headingFontSize - Font size for headings
 * @property {string} bodyFontSize - Font size for body text
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
 * Defines the complete structure of a form with metadata
 * 
 * @property {string} id - Unique identifier for the form
 * @property {string} title - Form title
 * @property {string|null} description - Optional form description
 * @property {FormField[]} fields - Array of form fields
 * @property {FormStyle} [style] - Optional form styling
 * @property {string} createdAt - Form creation timestamp
 * @property {string} updatedAt - Last update timestamp
 * @property {boolean} isPublished - Form publication status
 */
export interface Form {
  id: string;
  title: string;
  description: string | null;
  fields: FormField[];
  style?: FormStyle;
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
} 