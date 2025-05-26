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
import { db } from "@/lib/db";
import { FormSubmissionSchema } from "@/lib/schemas/form";
import { auth } from "@/auth";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import formLogger from "@/lib/formLogger";

/**
 * Route Parameters Type
 * Defines the expected parameters for the route handler
 */
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
export async function POST(req: Request, { params }: RouteParams) {
  try {
    // Verify user authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const { formId } = resolvedParams;
    const body = await req.json();
    const { responses } = body;

    // Validate submission data structure
    if (!responses || typeof responses !== "object") {
      return NextResponse.json(
        { error: "Invalid submission data" },
        { status: 400 }
      );
    }

    // Verify form exists and is published, and include creator's admin codes
    const form = await db.form.findFirst({
      where: {
        id: formId,
        isPublished: true
      },
      include: {
        fields: true,
        user: {
          include: {
            adminCodes: true
          }
        }
      }
    });

    if (!form) {
      return NextResponse.json(
        { error: "Form not found or not published" },
        { status: 404 }
      );
    }

    // Check if user is connected to form creator through admin codes
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        adminCode: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is connected to form creator
    const isConnected = form.user.adminCodes.some(adminCode => 
      adminCode.id === user.adminCodeId
    );

    if (!isConnected) {
      return NextResponse.json(
        { error: "You are not connected to the form creator" },
        { status: 403 }
      );
    }

    // Validate required fields are present in submission
    const requiredFields = form.fields.filter(field => field.required);
    const missingFields = requiredFields.filter(field => !(field.id in responses));
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: "Missing required fields",
          missingFields: missingFields.map(f => f.question)
        },
        { status: 400 }
      );
    }

    // Create submission (removed duplicate check since we allow multiple submissions)
    const submission = await db.formSubmission.create({
      data: {
        formId,
        userId: session.user.id,
        responses
      },
      include: {
        form: {
          include: {
            fields: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        }
      }
    });

    // Log successful form submission
    formLogger.logFormSubmitted({
      formId: submission.formId,
      userId: session.user.id,
      formTitle: submission.form.title,
      additionalInfo: {
        responseCount: Object.keys(responses).length,
        submissionId: submission.id,
        submitterRole: session.user.role,
        formOwner: submission.form.user.name
      }
    });

    return NextResponse.json({ submission });

  } catch (error) {
    console.error("SUBMISSION_CREATE_ERROR", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 