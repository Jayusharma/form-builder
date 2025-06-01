/**
 * Type Guard Utilities
 * 
 * This module provides type guard functions for runtime type checking.
 * These functions help ensure type safety by validating object structures
 * at runtime, complementing TypeScript's static type checking.
 */

// Import interfaces from the schema file
import { GridPosition, FormStyle } from '@/types/form';
import { FormFieldType } from '@/lib/schemas/form';

/**
 * Grid Position Type Guard
 * Validates if a value matches the GridPosition interface structure
 * 
 * @param {unknown} value - The value to check
 * @returns {value is GridPosition} True if the value is a valid GridPosition
 * 
 * @example
 * const pos = { x: 0, y: 0, width: 6, height: 1 };
 * if (isGridPosition(pos)) {
 *   // pos is typed as GridPosition
 * }
 */
export function isGridPosition(value: unknown): value is GridPosition {
  if (typeof value !== 'object' || value === null) return false;
  
  const position = value as Record<string, unknown>;
  return (
    typeof position.x === 'number' &&
    typeof position.y === 'number' &&
    typeof position.width === 'number' &&
    typeof position.height === 'number'
  );
}

/**
 * Form Style Type Guard
 * Validates if a value matches the FormStyle interface structure
 * 
 * @param {unknown} value - The value to check
 * @returns {value is FormStyle} True if the value is a valid FormStyle
 * 
 * @example
 * const style = {
 *   width: 'medium',
 *   alignment: 'center',
 *   // ... other style properties
 * };
 * if (isFormStyle(style)) {
 *   // style is typed as FormStyle
 * }
 */
export function isFormStyle(value: unknown): value is FormStyle {
  if (typeof value !== 'object' || value === null) return false;
  
  const style = value as Record<string, unknown>;
  return (
    typeof style.fontFamily === 'string' &&
    typeof style.fontSize === 'string' &&
    typeof style.backgroundColor === 'string' &&
    typeof style.textColor === 'string'
  );
}

export function isFormFieldType(value: unknown): value is FormFieldType {
  if (typeof value !== 'string') return false;
  
  const validTypes: FormFieldType[] = [
    'TEXT',
    'PARAGRAPH',
    'MULTIPLE_CHOICE',
    'CHECKBOX',
    'DROPDOWN',
    'SUBMIT',
    'IMAGE_UPLOAD',
    'RICH_TEXT'
  ];
  
  return validTypes.includes(value as FormFieldType);
} 