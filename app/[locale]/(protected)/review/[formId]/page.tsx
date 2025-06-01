/**
 * Form Review Page Component
 * 
 * This page allows super administrators to review form publication requests.
 * It includes:
 * - Form preview with read-only mode
 * - Review actions (accept/reject)
 * - Role-based access control
 * - Form field validation and display
 */

import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Form, publicRequest } from "@prisma/client";
import { FormPreview } from "@/components/forms/FormPreview";
import { FormField, FormStyle } from "@/lib/schemas/form";
import { ReviewActions } from "@/components/forms/ReviewActions";
import { auth } from "@/auth";
import { getDictionary } from "@/lib/dictionary";
import { Metadata } from "next";
import { JsonValue } from "@prisma/client/runtime/library";
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
 * Database Form Field Interface
 * Represents the raw form field data from the database
 */
interface DatabaseFormField {
  id: string;
  type: string;
  question: string;
  required: boolean;
  options: string[];
  description: string | null;
  gridPosition: JsonValue;
  order: number;
}

/**
 * Form with Relations Type
 * Extends the Form type to include related data
 */
type FormWithRelations = Form & {
  fields: DatabaseFormField[];
  publicRequest: publicRequest[];
  header: { logo?: string; text?: string; } | null;
  footer: { logo?: string; text?: string; } | null;
}

/**
 * Page Props Type
 * Defines the expected parameters for the page component
 */
type PageProps = {
  params: Promise<{ formId: string; locale: Locale }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const dict = await getDictionary(params.locale);

  return {
    title: dict.review.metadata.title,
    description: dict.review.metadata.description,
  };
}

/**
 * Type guard for GridPosition
 */
function isValidGridPosition(value: unknown): value is GridPosition {
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
 * Fetches a form with its fields and publication request
 * 
 * @param {string} formId - The ID of the form to fetch
 * @returns {Promise<FormWithRelations & { formattedFields: FormField[] }>} The form with its fields and request
 * @throws {notFound} If the form doesn't exist
 */
async function getForm(formId: string): Promise<FormWithRelations & { formattedFields: FormField[] }> {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: {
      fields: {
        orderBy: {
          order: 'asc'
        }
      },
      publicRequest: true
    }
  }) as FormWithRelations | null;

  if (!form) {
    notFound();
  }

  // Convert database fields to FormField type
  const formattedFields: FormField[] = form.fields.map(field => {
    // Parse gridPosition from JSON
    let gridPosition: GridPosition;
    try {
      const parsedPos = JSON.parse(JSON.stringify(field.gridPosition));
      gridPosition = isValidGridPosition(parsedPos) ? parsedPos : { x: 0, y: 0, width: 12, height: 1 };
    } catch {
      gridPosition = { x: 0, y: 0, width: 12, height: 1 };
    }

    return {
      id: field.id,
      type: field.type as FormField['type'],
      question: field.question,
      required: field.required,
      options: field.options,
      description: field.description ?? undefined,
      gridPosition
    };
  });

  // Sort fields by gridPosition.y for proper layout
  const sortedFields = [...formattedFields].sort((a, b) => {
    return a.gridPosition.y - b.gridPosition.y;
  });

  return {
    ...form,
    formattedFields: sortedFields
  };
}

/**
 * Form Review Page Component
 * Renders the form review interface for super administrators
 * 
 * @param {PageProps} props - The component props
 * @returns {Promise<JSX.Element>} The rendered review page
 * @throws {redirect} If user is not authenticated or not a super admin
 */
export default async function ReviewPage(props: PageProps) {
  // Verify user authentication and role
  const session = await auth();
  if (!session?.user || session.user.role !== 'SADMIN') {
    redirect('/unauthorized');
  }

  const params = await props.params;
  const form = await getForm(params.formId);
  const publicRequest = form.publicRequest[0]; // Get the first request

  if (!publicRequest) {
    notFound();
  }

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

  // Parse form style from JSON
  let formStyle: FormStyle;
  try {
    const parsedStyle = JSON.parse(JSON.stringify(form.style));
    formStyle = typeof parsedStyle === 'object' && parsedStyle !== null ? parsedStyle as FormStyle : defaultStyle;
  } catch {
    formStyle = defaultStyle;
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Review actions component for accept/reject */}
      <ReviewActions 
        requestId={publicRequest.id} 
      />

      {/* Form preview in read-only mode */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <FormPreview
          form={{
            id: form.id,
            title: form.title,
            description: form.description || '',
            style: formStyle,
            header: form.header,
            footer: form.footer,
            fields: form.formattedFields
          }}
          isReadOnly={true}
        />
      </div>
    </div>
  );
}
