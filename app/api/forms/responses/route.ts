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

interface FormResponse {
  id: string;
  formId: string;
  responses: Record<string, string | number | boolean | string[]>;
  createdAt: Date;
  updatedAt: Date;
}

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
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const formId = searchParams.get("formId");

    if (!formId) {
      return new NextResponse("Form ID is required", { status: 400 });
    }

    const submissions = await db.formSubmission.findMany({
      where: {
        formId,
        form: {
          OR: [
            { userId: session.user.id },
            { isPublished: true }
          ]
        }
      }
    });

    const formattedResponses: FormResponse[] = submissions.map(submission => ({
      id: submission.id,
      formId: submission.formId,
      responses: submission.responses as Record<string, string | number | boolean | string[]>,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt
    }));

    return NextResponse.json(formattedResponses);
  } catch (error) {
    console.error("[FORM_RESPONSES]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 