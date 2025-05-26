/**
 * Type Guard Utilities
 * 
 * This module provides type guard functions for runtime type checking.
 * These functions help ensure type safety by validating object structures
 * at runtime, complementing TypeScript's static type checking.
 */

// Import interfaces from the schema file
import { GridPosition, FormStyle } from '@/lib/schemas/form';

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
  if (!value || typeof value !== 'object') return false;
  const pos = value as any;
  return (
    typeof pos.x === 'number' &&
    typeof pos.y === 'number' &&
    typeof pos.width === 'number' &&
    typeof pos.height === 'number'
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
  if (!value || typeof value !== 'object') return false;
  const style = value as any;
  return (
    typeof style.width === 'string' &&
    typeof style.alignment === 'string' &&
    typeof style.spacing === 'string' &&
    typeof style.borderRadius === 'string' &&
    typeof style.backgroundColor === 'string' &&
    typeof style.textColor === 'string' &&
    typeof style.primaryColor === 'string' &&
    typeof style.borderColor === 'string' &&
    typeof style.fontFamily === 'string' &&
    typeof style.headingFontSize === 'string' &&
    typeof style.bodyFontSize === 'string'
  );
} 