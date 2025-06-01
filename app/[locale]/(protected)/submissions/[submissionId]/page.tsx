/**
 * Submission Details Page Component
 * 
 * This page displays detailed information about a specific form submission.
 * It includes:
 * - Submission metadata (timestamp, user)
 * - Form field responses
 * - Form preview in read-only mode
 * - Role-based access control
 */

import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { CalendarDays } from "lucide-react";
import { FormPreview } from "@/components/forms/FormPreview";
import { FormField, FormStyle } from "@/lib/schemas/form";
import { isGridPosition } from "@/lib/utils/typeGuards";
import { FormFieldType } from "@prisma/client";
import { getDictionary } from "@/lib/dictionary";

/**
 * Page Props Interface
 * Defines the expected parameters for the page component
 */
export interface PageProps {
  params: Promise<{
    submissionId: string;
    locale: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

interface DatabaseForm {
  id: string;
  title: string;
  description: string | null;
  style: any;
  header: { logo?: string; text?: string; } | null;
  footer: { logo?: string; text?: string; } | null;
  fields: DatabaseFormField[];
}

/**
 * Submission with Form Type
 * Defines the shape of a submission with its associated form data
 */
interface SubmissionWithForm {
  id: string;
  userId: string;
  formId: string;
  responses: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  form: DatabaseForm;
}

/**
 * Database Form Field Type
 * Represents the form field as stored in the database
 */
interface DatabaseFormField {
  id: string;
  type: FormFieldType;
  question: string;
  required: boolean;
  options: string[];
  description: string | null;
  gridPosition: any;
  order: number;
}

/**
 * Processed Submission Type
 * Represents the submission after processing database fields into application fields
 */
interface ProcessedSubmission {
  id: string;
  userId: string;
  formId: string;
  responses: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  form: {
    id: string;
    title: string;
    description: string | null;
    style: FormStyle;
    header: { logo?: string; text?: string; } | null;
    footer: { logo?: string; text?: string; } | null;
    fields: FormField[];
  };
}

/**
 * Fetches a form submission with its associated form and fields
 * 
 * @param {string} submissionId - The ID of the submission to fetch
 * @param {string} userId - The ID of the user requesting the submission
 * @returns {Promise<ProcessedSubmission | null>} The processed submission with form and field data
 */
async function getSubmission(submissionId: string, userId: string): Promise<ProcessedSubmission | null> {
  const submission = await prisma.formSubmission.findFirst({
    where: {
      id: submissionId,
      userId: userId,
    },
    include: {
      form: {
        include: {
          fields: {
            orderBy: {
              order: "asc",
            },
          },
        },
      },
    },
  }) as SubmissionWithForm | null;

  if (!submission) return null;

  // Convert database fields to FormField type with proper grid positioning
  const formattedFields: FormField[] = submission.form.fields.map((field: DatabaseFormField) => ({
    id: field.id,
    type: field.type,
    question: field.question,
    required: field.required,
    options: field.options,
    description: field.description,
    gridPosition: isGridPosition(field.gridPosition) ? field.gridPosition : { x: 0, y: 0, width: 12, height: 1 }
  }));

  // Sort fields by gridPosition.y for proper layout
  const sortedFields = [...formattedFields].sort((a, b) => {
    const aPos = a.gridPosition;
    const bPos = b.gridPosition;
    return aPos.y - bPos.y;
  });

  return {
    ...submission,
    form: {
      ...submission.form,
      style: submission.form.style as any, // FormPreview will handle style processing
      fields: sortedFields,
      description: submission.form.description || '',
      header: submission.form.header,
      footer: submission.form.footer,
    },
  } as ProcessedSubmission;
}

/**
 * Submission Details Page Component
 * Displays a form submission with its responses and metadata
 * 
 * @param {PageProps} props - The component props
 * @returns {Promise<JSX.Element>} The rendered submission details page
 * @throws {notFound} If the submission doesn't exist or user is not authorized
 */
export default async function SubmissionPage({ params, searchParams }: PageProps) {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const dict = await getDictionary(resolvedParams.locale === 'es' ? 'es' : 'en');

  // Verify user authentication
  const session = await auth();
  if (!session?.user?.id) {
    notFound();
  }

  const submission = await getSubmission(resolvedParams.submissionId, session.user.id);

  if (!submission) {
    notFound();
  }

  const timeAgo = formatDistanceToNow(new Date(submission.createdAt));

  return (
    <div className="container py-8 space-y-8">
      {/* Submission details card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{dict.submissions.details.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Submission timestamp */}
          <div className="flex items-center text-sm text-muted-foreground">
            <CalendarDays className="mr-2 h-4 w-4" />
            <span>
              {dict.submissions.details.submitted.replace("{0}", timeAgo)}
            </span>
          </div>
          
          {/* Form preview with responses */}
          <div className="mt-8">
            <FormPreview
              form={{
                ...submission.form,
                style: submission.form.style,
              }}
              fields={submission.form.fields}
              submissionResponses={submission.responses}
              isReadOnly={true}
              submissionDate={new Date(submission.createdAt)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 