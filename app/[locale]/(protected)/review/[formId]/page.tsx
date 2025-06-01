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
  fields: FormFieldWithGrid[];
}

/**
 * Form with Relations Type
 * Extends the Form type to include related data
 */
type FormWithRelations = Form & {
  fields: FormField[];
  publicRequest: publicRequest[];
  header: { logo?: string; text?: string; } | null;
  footer: { logo?: string; text?: string; } | null;
}

/**
 * Page Props Interface
 * Defines the expected parameters for the page component
 */
export interface PageProps {
  params: Promise<{ formId: string; locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.locale === 'es' ? 'es' : 'en');
  
  return {
    title: dict.review.metadata.title,
    description: dict.review.metadata.description,
  };
}

/**
 * Fetches a form with its fields and publication request
 * 
 * @param {string} formId - The ID of the form to fetch
 * @returns {Promise<FormWithRelations>} The form with its fields and request
 * @throws {notFound} If the form doesn't exist
 */
async function getForm(formId: string): Promise<FormWithRelations> {
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

  // Convert database fields to expected FormField type
  const formattedFields: FormField[] = form.fields.map(field => ({
    ...field,
    gridPosition: field.gridPosition as any // Safe because it's stored as JSON
  }));

  // Sort fields by gridPosition.y for proper layout
  const sortedFields = [...formattedFields].sort((a, b) => {
    const aPos = a.gridPosition;
    const bPos = b.gridPosition;
    return aPos.y - bPos.y;
  });

  return {
    ...form,
    fields: sortedFields,
    header: form.header,
    footer: form.footer
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
export default async function ReviewPage({ params, searchParams }: PageProps) {
  // Verify user authentication and role
  const session = await auth();
  if (!session?.user || session.user.role !== 'SADMIN') {
    redirect('/unauthorized');
  }

  const [resolvedParams, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const form = await getForm(resolvedParams.formId);
  const publicRequest = form.publicRequest[0]; // Get the first request

  if (!publicRequest) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Review actions component for accept/reject */}
      <ReviewActions 
        formId={form.id} 
        requestId={publicRequest.id} 
      />

      {/* Form preview in read-only mode */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <FormPreview
          form={{
            id: form.id,
            title: form.title,
            description: form.description || '',
            style: form.style as any, // FormPreview will handle style processing and validation
            header: form.header,
            footer: form.footer
          }}
          fields={form.fields}
          isReadOnly={true}
        />
      </div>
    </div>
  );
}
