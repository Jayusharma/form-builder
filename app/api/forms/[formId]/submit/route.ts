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
      return new NextResponse("Form not found", { status: 404 });
    }

    if (!form.isPublished) {
      return new NextResponse("Form is not published", { status: 400 });
    }

    // Check if user is connected to the form creator through AdminCode
    const isConnectedToAdmin = form.user.adminCodes.some(adminCode => 
      adminCode.users.some(user => user.id === session.user.id)
    );

    if (!isConnectedToAdmin) {
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

    return NextResponse.json(submission);
  } catch (error) {
    console.error("[FORM_SUBMIT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 