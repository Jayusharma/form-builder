/**
 * Form Submission API Route
 * 
 * This module provides an API endpoint for submitting form responses.
 * Features:
 * - Submit form responses with validation
 * - Verify user is connected to form creator through AdminCode
 * - Validate response data format
 * - Handle required field validation
 * - Return submission status and details
 * - Error handling for various scenarios
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formLogger } from "@/lib/formLogger";

type RouteParams = {
  params: Promise<{ formId: string }>;
};

type ProcessedResponses = Record<string, string | string[] | null>;

/**
 * POST /api/forms/[formId]/submit
 * Handles form submission with admin connection verification
 */
export async function POST(
  req: Request,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    const resolvedParams = await params;
    const formId = resolvedParams.formId;
    const data = await req.json();

    // Verify user authentication
    if (!session?.user?.id) {
      formLogger.warn("Unauthenticated form submission attempt", {
        event: 'FORM_REQUEST_UNAUTHORIZED',
        formId
      });
      return new NextResponse("Authentication required to submit form", { status: 401 });
    }

    // Verify form exists and is published
    const form = await db.form.findUnique({
      where: { id: formId },
      include: { 
        fields: true,
        user: {
          select: {
            id: true,
            name: true,
            adminCodes: {
              select: {
                users: {
                  where: {
                    id: session.user.id
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!form) {
      formLogger.warn("Attempt to submit to non-existent form", {
        event: 'FORM_REQUEST_NOT_FOUND',
        formId,
        userId: session.user.id
      });
      return new NextResponse("Form not found", { status: 404 });
    }

    if (!form.isPublished) {
      formLogger.warn("Attempt to submit to unpublished form", {
        event: 'FORM_REQUEST_ERROR',
        formId,
        formTitle: form.title,
        userId: session.user.id,
        additionalInfo: {
          formStatus: 'unpublished',
          formOwnerId: form.user.id
        }
      });
      return new NextResponse("Form is not published", { status: 400 });
    }

    // Check if user is connected to the form creator through AdminCode
    const isConnectedToAdmin = form.user.adminCodes.some(adminCode => 
      adminCode.users.some(user => user.id === session.user.id)
    );

    if (!isConnectedToAdmin) {
      formLogger.warn("Unauthorized form submission attempt - no admin connection", {
        event: 'FORM_REQUEST_FORBIDDEN',
        formId,
        formTitle: form.title,
        userId: session.user.id,
        additionalInfo: {
          formOwnerId: form.user.id,
          formOwnerName: form.user.name
        }
      });
      return new NextResponse(
        "You must be connected to the form creator through an admin code to submit this form", 
        { status: 401 }
      );
    }

    // Process and validate the responses
    const processedResponses: ProcessedResponses = {};
    
    // Extract responses from the submitted data
    const submittedResponses = data.responses || {};

    // Validate each field and process its response
    for (const field of form.fields) {
      const response = submittedResponses[field.id];

      // Skip submit button field
      if (field.type === 'SUBMIT') continue;

      // Check required fields
      if (field.required && (response === undefined || response === null || response === '')) {
        formLogger.warn("Form submission rejected - missing required field", {
          event: 'FORM_REQUEST_ERROR',
          formId,
          formTitle: form.title,
          userId: session.user.id,
          additionalInfo: {
            fieldId: field.id,
            fieldQuestion: field.question,
            fieldType: field.type
          }
        });
        return new NextResponse(
          `Missing required field: ${field.question}`,
          { status: 400 }
        );
      }

      // Process response based on field type
      switch (field.type) {
        case 'MULTIPLE_CHOICE':
        case 'TEXT':
        case 'PARAGRAPH':
          processedResponses[field.id] = response || '';
          break;
        case 'CHECKBOX':
          processedResponses[field.id] = Array.isArray(response) ? response : [];
          break;
        case 'DROPDOWN':
          processedResponses[field.id] = response || '';
          break;
        case 'IMAGE_UPLOAD':
          processedResponses[field.id] = response || null;
          break;
        case 'RICH_TEXT':
          // Rich text fields don't need responses
          break;
      }
    }

    // Create submission with processed responses
    const submission = await db.formSubmission.create({
      data: {
        formId,
        userId: session.user.id,
        responses: processedResponses
      }
    });

    // Log successful submission
    formLogger.logFormSubmitted({
      formId,
      formTitle: form.title,
      userId: session.user.id,
      additionalInfo: {
        submissionId: submission.id,
        fieldCount: form.fields.length,
        responseCount: Object.keys(processedResponses).length,
        formOwner: {
          id: form.user.id,
          name: form.user.name
        }
      }
    });

    return NextResponse.json(submission);
  } catch (error) {
    // Get current session and params in catch block to avoid Promise issues
    const [currentSession, resolvedParams] = await Promise.all([
      auth(),
      params
    ]);

    formLogger.error("Failed to process form submission", {
      event: 'FORM_REQUEST_ERROR',
      formId: resolvedParams.formId,
      userId: currentSession?.user?.id,
      additionalInfo: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
    console.error("[FORM_SUBMIT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 