import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { Form, FormField, GridPosition, FormStyle, FormSubmission, FormFieldType } from '@/lib/schemas/form';
import { JsonValue } from '@prisma/client/runtime/library';
import { isGridPosition, isFormStyle } from '@/lib/utils/typeGuards';
import { FormPreview } from '@/components/forms/FormPreview';
import { auth } from '@/auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Prisma } from '@prisma/client';

// Update the props type to use Promise params
type Props = {
  params: Promise<{ submissionId: string }>;
};

// Define a type for the data fetched, which includes the form with fields and style
interface SubmissionWithForm extends FormSubmission {
  form: Form & {
    header: JsonValue;
    footer: JsonValue;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    isPublished: boolean;
  };
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

  // Safely handle JsonValue responses and cast to Record<string, any>
  const typedSubmission: SubmissionWithForm = {
    ...submission,
    submittedAt: submission.createdAt,
    responses: (submission.responses && typeof submission.responses === 'object' && !Array.isArray(submission.responses))
      ? submission.responses as Record<string, any>
      : {},
    form: {
      ...submission.form,
      userId: submission.form.userId,
      createdAt: submission.form.createdAt,
      updatedAt: submission.form.updatedAt,
      isPublished: submission.form.isPublished,
      fields: submission.form.fields.map((field: any) => ({
        ...field,
        gridPosition: isGridPosition(field.gridPosition)
          ? field.gridPosition
          : { x: 0, y: 0, width: 12, height: 1 } as GridPosition,
        options: field.options as string[],
        type: field.type as FormFieldType,
      })) as FormField[],
      style: submission.form.style as any, // FormPreview will handle style processing
      description: submission.form.description || '',
      title: submission.form.title,
      id: submission.form.id,
      header,
      footer,
    },
  };

  return typedSubmission;
}

export default async function AdminSubmissionPage({ params }: Props) {
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  const resolvedParams = await params;
  const submission = await getSubmission(resolvedParams.submissionId);

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
              <CardTitle className="text-lg">Submission Details</CardTitle>
              <div className="flex items-center text-sm text-muted-foreground mt-2">
                <CalendarDays className="mr-2 h-4 w-4" />
                <span>
                  Submitted {formatDistanceToNow(new Date(submission.submittedAt))} ago
                </span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Form: {submission.form.title}
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
                style: submission.form.style as any, // FormPreview will handle style processing
                header: header as { logo?: string; text?: string; } | null,
                footer: footer as { logo?: string; text?: string; } | null,
              }}
              fields={submission.form.fields}
              submissionResponses={submission.responses as Record<string, any>}
              isReadOnly={true}
              submissionDate={new Date(submission.createdAt)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 