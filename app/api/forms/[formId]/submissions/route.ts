/**
 * Form Submissions API Route
 * 
 * This module provides API endpoints for managing form submissions.
 * Features:
 * - Create new form submissions
 * - Retrieve form submissions with role-based access
 * - Validate required fields
 * - Handle submission data storage
 * - Role-based submission viewing permissions
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

/**
 * Route Parameters Type
 * Defines the expected parameters for the route handlers
 */
type RouteParams = {
  params: Promise<{ formId: string }>;
};

/**
 * POST /api/forms/[formId]/submissions
 * Creates a new submission for a form
 * 
 * @param {Request} req - The incoming request with submission data
 * @param {RouteParams} params - Route parameters containing formId
 * @returns {Promise<NextResponse>} Created submission or error response
 * @throws {401} If user is not authenticated
 * @throws {400} If submission data is invalid or missing required fields
 * @throws {404} If form is not found or not published
 * @throws {500} If server error occurs
 * 
 * Request Body:
 * - responses: Object containing field responses
 */
export async function POST(req: Request, { params }: RouteParams) {
  try {
    // Verify user authentication
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const resolvedParams = await params;
    const { formId } = resolvedParams;
    const body = await req.json();
    const { responses } = body;

    // Validate submission data structure
    if (!responses || typeof responses !== "object") {
      return new NextResponse("Invalid submission data", { status: 400 });
    }

    // Verify form exists and is published
    const form = await db.form.findFirst({
      where: {
        id: formId,
        isPublished: true
      },
      include: {
        fields: true
      }
    });

    if (!form) {
      return new NextResponse("Form not found or not published", { status: 404 });
    }

    // Validate required fields are present in submission
    const requiredFields = form.fields.filter(field => field.required);
    const missingFields = requiredFields.filter(field => !(field.id in responses));
    
    if (missingFields.length > 0) {
      return new NextResponse(
        `Missing required fields: ${missingFields.map(f => f.question).join(", ")}`,
        { status: 400 }
      );
    }

    // Create submission with form and user details
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

    return NextResponse.json({ submission });
  } catch (error) {
    console.error("SUBMISSION_CREATE_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

/**
 * GET /api/forms/[formId]/submissions
 * Retrieves all submissions for a form
 * 
 * @param {Request} req - The incoming request
 * @param {RouteParams} params - Route parameters containing formId
 * @returns {Promise<NextResponse>} List of submissions or error response
 * @throws {401} If user is not authenticated
 * @throws {403} If user lacks permission to view submissions
 * @throws {404} If form is not found
 * @throws {500} If server error occurs
 * 
 * Access Control:
 * - SADMIN: Can view all submissions
 * - Form Owner: Can view their form's submissions
 * - ADMIN: Can view USER submissions
 * - MANAGER: Can view USER submissions
 */
export async function GET(req: Request, { params }: RouteParams) {
  try {
    // Verify user authentication
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const resolvedParams = await params;
    const { formId } = resolvedParams;

    // Verify form exists and get owner details
    const form = await db.form.findUnique({
      where: { id: formId },
      include: {
        user: {
          select: {
            id: true,
            role: true,
            adminCodes: {
              include: {
                users: {
                  where: {
                    id: session.user.id
                  },
                  select: {
                    id: true
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

    // Check user's permission to view submissions
    const isConnectedToAdmin = form.user.adminCodes?.some(adminCode => 
      adminCode.users.some(user => user.id === session.user.id)
    );

    const canViewSubmissions = 
      session.user.role === "SADMIN" || // SADMIN can view all submissions
      form.userId === session.user.id || // Form owner can view their form's submissions
      (session.user.role === "ADMIN" && form.user.role === "USER") || // ADMIN can view USER submissions
      (session.user.role === "MANAGER" && form.user.role === "USER") || // MANAGER can view USER submissions
      (session.user.role === "USER" && isConnectedToAdmin); // USER can view submissions if connected to admin

    if (!canViewSubmissions) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Build where clause based on user role
    const whereClause: Prisma.FormSubmissionWhereInput = {
      formId: formId
    };

    // If user role is USER, only show their own submissions
    if (session.user.role === "USER") {
      whereClause.userId = session.user.id;
    }

    // Fetch submissions with submitter details
    const submissions = await db.formSubmission.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("SUBMISSIONS_GET_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}