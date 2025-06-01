/**
 * Form Submission API Route
 * 
 * This module provides an API endpoint for submitting form responses.
 * Features:
 * - Submit form responses with validation
 * - Prevent duplicate submissions
 * - Handle required field validation
 * - Return submission status and details
 * - Error handling for various scenarios
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formLogger } from "@/lib/formLogger";

interface FormSubmissionData {
  formId: string;
  responses: Record<string, string | number | boolean | string[]>;
}

type RouteParams = {
  params: Promise<{ formId: string }>;
};

/**
 * POST /api/forms/[formId]/submit
 * Handles form submission with duplicate prevention
 * 
 * @param {Request} req - The incoming request with submission data
 * @param {RouteParams} params - Route parameters containing formId
 * @returns {Promise<NextResponse>} Submission result or error response
 * @throws {401} If user is not authenticated
 * @throws {400} If submission data is invalid or missing required fields
 * @throws {404} If form is not found or not published
 * @throws {409} If user has already submitted the form
 * @throws {500} If server error occurs
 * 
 * Request Body:
 * - responses: Object containing field responses
 * 
 * Response:
 * - submission: Created submission data (on success)
 * - message: Error message (on duplicate submission)
 * - submittedAt: Timestamp of existing submission (on duplicate)
 * - submissionId: ID of existing submission (on duplicate)
 */
export async function POST(
  req: Request,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    const resolvedParams = await params;
    const formId = resolvedParams.formId;
    const data = await req.json() as FormSubmissionData;

    // Verify form exists and is published
    const form = await db.form.findUnique({
      where: { id: formId },
      include: { fields: true }
    });

    if (!form) {
      return new NextResponse("Form not found", { status: 404 });
    }

    if (!form.isPublished) {
      return new NextResponse("Form is not published", { status: 400 });
    }

    // Check for required fields
    const missingRequired = form.fields
      .filter(field => field.required)
      .filter(field => !data.responses[field.id]);

    if (missingRequired.length > 0) {
      return new NextResponse(
        `Missing required fields: ${missingRequired.map(f => f.question).join(", ")}`,
        { status: 400 }
      );
    }

    // Verify user authentication for submission
    if (!session?.user?.id) {
      return new NextResponse("Authentication required to submit form", { status: 401 });
    }

    // Create submission
    const submission = await db.formSubmission.create({
      data: {
        formId,
        userId: session.user.id,
        responses: data.responses
      }
    });

    // Log submission
    await formLogger.logFormSubmitted({
      formId,
      userId: session?.user?.id,
      formTitle: form.title
    });

    return NextResponse.json(submission);
  } catch (error) {
    console.error("[FORM_SUBMIT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 