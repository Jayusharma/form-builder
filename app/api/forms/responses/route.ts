/**
 * Form Responses API Route
 * 
 * This module provides an API endpoint for retrieving form responses.
 * Features:
 * - List all forms with their responses
 * - Include form fields and submission data
 * - Type-safe response handling
 * - Default form styling
 * - Order responses by creation date
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { Form, FormSubmission, FormField } from '@/lib/schemas/form';
import { isGridPosition, isFormStyle } from '@/lib/utils/typeGuards';

/**
 * GET /api/forms/responses
 * Retrieves all forms with their responses for the authenticated user
 * 
 * @returns {Promise<NextResponse>} List of forms with responses or error response
 * @throws {401} If user is not authenticated
 * @throws {500} If server error occurs
 * 
 * Response includes:
 * - Form metadata (id, title, description)
 * - Form fields with grid positions
 * - Form submissions with responses
 * - Form styling information
 * - Default values for missing fields
 * 
 * Note: All responses are type-checked and transformed to ensure data consistency
 */
export async function GET() {
  try {
    // Verify user authentication
    const session = await auth();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Fetch user's forms with submissions and fields
    const forms = await db.form.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        submissions: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        fields: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform and type-check form data
    const typedForms: Form[] = forms.map(form => ({
      ...form,
      // Transform submissions with type checking
      submissions: form.submissions.map(submission => ({
        ...submission,
        submittedAt: submission.createdAt,
        responses: (submission.responses && typeof submission.responses === 'object' && !Array.isArray(submission.responses))
          ? submission.responses as Record<string, any>
          : {},
        formId: submission.formId,
        id: submission.id,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt,
      })) as FormSubmission[],
      // Transform fields with type checking and default grid positions
      fields: form.fields.map(field => ({
        ...field,
        gridPosition: isGridPosition(field.gridPosition)
          ? field.gridPosition
          : { x: 0, y: 0, width: 12, height: 1 },
        options: field.options as string[],
        type: field.type,
        id: field.id,
        question: field.question,
        required: field.required,
      })) as FormField[],
      // Set default values for optional fields
      description: form.description || '',
      // Apply default form style if not set
      style: isFormStyle(form.style) ? form.style : {
        width: 'medium',
        alignment: 'center',
        spacing: 'comfortable',
        borderRadius: 'md',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        primaryColor: '#2563eb',
        borderColor: '#e5e7eb',
        fontFamily: 'inter',
        headingFontSize: '2xl',
        bodyFontSize: 'base',
      },
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
      userId: form.userId,
      isPublished: form.isPublished,
      title: form.title,
      id: form.id,
    }));

    return NextResponse.json(typedForms);
  } catch (error) {
    console.error('Error fetching form responses:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 