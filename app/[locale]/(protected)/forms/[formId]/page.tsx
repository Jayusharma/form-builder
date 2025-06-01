/**
 * Form Preview Page Component
 * 
 * This page displays a published form in preview mode. It includes:
 * - Form field rendering with grid layout
 * - Form styling and customization
 * - Field validation and type checking
 * - Responsive layout handling
 */

import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { FormField, FormStyle, FormFieldType } from '@/lib/schemas/form';
import { JsonValue } from '@prisma/client/runtime/library';
import { FormPreview } from '@/components/forms/FormPreview';
import { Card } from '@/components/ui/card';
import { Locale } from '@/lib/i18n-config';

/**
 * Grid Position Interface
 * Defines the positioning of form fields in a grid layout
 */
interface GridPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Form Field with Grid Interface
 * Extends FormField to include grid positioning
 */
interface FormFieldWithGrid extends FormField {
  gridPosition: GridPosition;
}

/**
 * Form with Fields Interface
 * Defines the complete form structure including fields and styling
 */
interface FormWithFields {
  id: string;
  title: string;
  description: string;
  style?: FormStyle;
  header?: { logo?: string; text?: string; } | null;
  footer?: { logo?: string; text?: string; } | null;
  fields: FormFieldWithGrid[];
}

/**
 * Grid Position Type Guard
 * Validates if a value matches the GridPosition interface
 * 
 * @param {unknown} value - The value to check
 * @returns {boolean} True if the value is a valid GridPosition
 */
function isGridPosition(value: unknown): value is GridPosition {
  if (!value || typeof value !== 'object') return false;
  const pos = value as Record<string, unknown>;
  return (
    typeof pos.x === 'number' &&
    typeof pos.y === 'number' &&
    typeof pos.width === 'number' &&
    typeof pos.height === 'number'
  );
}

/**
 * Form Style Type Guard
 * Validates if a value matches the FormStyle interface
 * 
 * @param {unknown} value - The value to check
 * @returns {boolean} True if the value is a valid FormStyle
 */
function isFormStyle(value: unknown): value is FormStyle {
  if (!value || typeof value !== 'object') {
    console.log('isFormStyle: value is not an object', value);
    return false;
  }
  const style = value as Record<string, unknown>;
  
  // Log the style object we're checking
  console.log('isFormStyle: checking style object', style);
  
  // Check if it has at least some of the required properties
  const hasRequiredProps = 
    typeof style.width === 'string' ||
    typeof style.alignment === 'string' ||
    typeof style.spacing === 'string' ||
    typeof style.backgroundColor === 'string' ||
    typeof style.textColor === 'string' ||
    typeof style.primaryColor === 'string' ||
    typeof style.borderColor === 'string';

  if (!hasRequiredProps) {
    console.log('isFormStyle: missing required properties');
    return false;
  }

  return true;
}

interface DatabaseForm {
  id: string;
  title: string;
  description: string | null;
  style: JsonValue;
  header: { logo?: string; text?: string; } | null;
  footer: { logo?: string; text?: string; } | null;
  fields: Array<{
    id: string;
    type: FormFieldType;
    question: string;
    required: boolean;
    options: string[];
    description: string | null;
    gridPosition: JsonValue;
    order: number;
  }>;
}

/**
 * Fetches a published form with its fields
 * 
 * @param {string} formId - The ID of the form to fetch
 * @returns {Promise<FormWithFields>} The form with its fields and styling
 * @throws {notFound} If the form doesn't exist or isn't published
 */
async function getForm(formId: string): Promise<FormWithFields> {
  const form = await db.form.findUnique({
    where: { id: formId, isPublished: true },
    include: {
      fields: {
        orderBy: {
          order: 'asc',
        },
      },
    },
  }) as DatabaseForm | null;

  if (!form) {
    notFound();
  }

  // Sort fields by gridPosition.y for proper layout
  const sortedFields = [...form.fields].sort((a, b) => {
    const aPos = isGridPosition(a.gridPosition) ? a.gridPosition : { x: 0, y: 0, width: 12, height: 1 };
    const bPos = isGridPosition(b.gridPosition) ? b.gridPosition : { x: 0, y: 0, width: 12, height: 1 };
    return aPos.y - bPos.y;
  });

  // Default form style if not valid
  const defaultStyle: FormStyle = {
    width: 'medium',
    alignment: 'left',
    spacing: 'comfortable',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    primaryColor: '#2563eb',
    borderColor: '#e5e7eb',
    fontFamily: 'Inter',
    headingFontSize: '1.5rem',
    bodyFontSize: '1rem',
    borderRadius: 'md'
  };

  return {
    id: form.id,
    title: form.title,
    description: form.description || '',
    style: isFormStyle(form.style) ? form.style as FormStyle : defaultStyle,
    header: form.header,
    footer: form.footer,
    fields: sortedFields.map(field => ({
      id: field.id,
      type: field.type,
      question: field.question,
      required: field.required,
      options: field.options,
      description: field.description ?? undefined,
      gridPosition: isGridPosition(field.gridPosition) 
        ? field.gridPosition 
        : { x: 0, y: 0, width: 12, height: 1 },
    })),
  };
}

/**
 * Page Props Type
 * Defines the expected parameters for the page component
 */
type PageProps = {
  params: Promise<{ formId: string; locale: Locale }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * Form Preview Page Component
 * Renders a published form with its fields and styling
 * 
 * @param {Props} props - The component props
 * @returns {Promise<JSX.Element>} The rendered form preview page
 */
export default async function FormPage(props: PageProps) {
  const params = await props.params;
  const form = await getForm(params.formId);

  return (
    <div className="flex flex-row w-screen items-center h-auto container">
      <Card className='flex justify-center items-center w-screen'>
        <FormPreview 
          form={form}
        />
      </Card>
    </div>
  );
} 