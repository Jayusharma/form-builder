/**
 * Admin Submission Details Page Component
 * 
 * This page displays detailed information about a form submission for administrators.
 * It includes:
 * - Submission metadata (timestamp, user)
 * - Form field responses
 * - Form preview in read-only mode
 * - Role-based access control
 */

import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { FormField, GridPosition, FormStyle, FormFieldType } from '@/lib/schemas/form';
import { JsonValue } from '@prisma/client/runtime/library';
import { isGridPosition } from '@/lib/utils/typeGuards';
import { FormPreview, FormResponseData } from '@/components/forms/FormPreview';
import { auth } from '@/auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Prisma } from '@prisma/client';
import { getDictionary } from '@/lib/dictionary';
import { Locale } from '@/lib/i18n-config';

// Update the props type to use Promise params
type PageProps = {
  params: Promise<{ submissionId: string; locale: Locale }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// Define a type for the data fetched, which includes the form with fields and style
interface SubmissionWithForm {
  id: string;
  formId: string;
  userId: string;
  responses: FormResponseData;
  createdAt: Date;
  updatedAt: Date;
  submittedAt: Date;
  form: {
    id: string;
    title: string;
    description: string | null;
    fields: FormField[];
    style?: FormStyle;
    header: JsonValue;
    footer: JsonValue;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    isPublished: boolean;
  };
}

// Define the type for raw database field
interface RawFormField {
  id: string;
  type: string;
  question: string;
  required: boolean;
  options?: string[];
  description?: string | null;
  gridPosition: JsonValue;
  order: number;
}

// Define the include type for the database query
const submissionInclude = {
  form: {
    include: {
      fields: {
        orderBy: {
          order: 'asc',
        },
      },
    },
  },
} satisfies Prisma.FormSubmissionInclude;

async function getSubmission(submissionId: string): Promise<SubmissionWithForm | null> {
  const submission = await db.formSubmission.findUnique({
    where: { id: submissionId },
    include: submissionInclude,
  });

  if (!submission) {
    console.log('No submission found for ID:', submissionId);
    return null;
  }

  // Parse header and footer from JSON
  const header = submission.form.header ? JSON.parse(JSON.stringify(submission.form.header)) : null;
  const footer = submission.form.footer ? JSON.parse(JSON.stringify(submission.form.footer)) : null;

  // Get style directly from the database
  console.log('Raw form style from DB:', submission.form.style);
  const style = submission.form.style as unknown as FormStyle | undefined;
  console.log('Final style:', style);

  // Safely handle JsonValue responses and cast to FormResponseData
  const typedSubmission: SubmissionWithForm = {
    id: submission.id,
    formId: submission.formId,
    userId: submission.userId,
    responses: (submission.responses && typeof submission.responses === 'object' && !Array.isArray(submission.responses))
      ? submission.responses as FormResponseData
      : {},
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
    submittedAt: submission.createdAt,
    form: {
      id: submission.form.id,
      title: submission.form.title,
      description: submission.form.description || '',
      fields: submission.form.fields.map((field: RawFormField) => ({
        id: field.id,
        type: field.type as FormFieldType,
        question: field.question,
        required: field.required,
        options: field.options as string[],
        description: field.description,
        gridPosition: isGridPosition(field.gridPosition)
          ? field.gridPosition
          : { x: 0, y: 0, width: 12, height: 1 } as GridPosition,
      })) as FormField[],
      style,
      userId: submission.form.userId,
      createdAt: submission.form.createdAt,
      updatedAt: submission.form.updatedAt,
      isPublished: submission.form.isPublished,
      header,
      footer,
    },
  };

  return typedSubmission;
}

export default async function AdminSubmissionPage(props: PageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  const params = await props.params;
  const submission = await getSubmission(params.submissionId);
  const dict = await getDictionary(params.locale);

  if (!submission) {
    notFound();
  }

  // Parse header and footer for the form preview
  const header = submission.form.header ? JSON.parse(JSON.stringify(submission.form.header)) : undefined;
  const footer = submission.form.footer ? JSON.parse(JSON.stringify(submission.form.footer)) : undefined;

  return (
    <div className="container mx-auto px-4 py-6 max-w-[1200px]">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">{dict.responses.submissionDetails}</CardTitle>
              <div className="flex items-center text-sm text-muted-foreground mt-2">
                <CalendarDays className="mr-2 h-4 w-4" />
                <span>
                  {dict.responses.submittedAgo.replace('{0}', formatDistanceToNow(new Date(submission.submittedAt)))}
                </span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {dict.responses.form}: {submission.form.title}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="border border-border rounded-lg">
            <FormPreview
              form={{
                id: submission.form.id,
                title: submission.form.title,
                description: submission.form.description || '',
                style: submission.form.style,
                header: header as { logo?: string; text?: string; } | null,
                footer: footer as { logo?: string; text?: string; } | null,
                fields: submission.form.fields,
              }}
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