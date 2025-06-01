/**
 * Form Publication Requests API Route
 * 
 * This module provides API endpoints for managing form publication requests.
 * Features:
 * - List publication requests
 * - Create new publication requests
 * - Role-based access control
 * - Request validation and duplicate prevention
 * - Form ownership verification
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

/**
 * GET /api/forms/requests
 * Retrieves form publication requests
 * 
 * @param {Request} req - The incoming request
 * @returns {Promise<NextResponse>} List of requests or error response
 * @throws {401} If user is not authenticated
 * @throws {500} If server error occurs
 * 
 * Access Control:
 * - SADMIN: Can view all requests
 * - Other users: Can only view their own requests
 * 
 * Response includes:
 * - Request details (id, status, timestamp)
 * - Form details with creator information
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const requests = await db.publicRequest.findMany({
      where: {
        form: {
          userId: session.user.id
        }
      },
      include: {
        form: {
          include: {
            user: true
          }
        }
      }
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("[FORM_REQUESTS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

/**
 * POST /api/forms/requests
 * Creates a new form publication request
 * 
 * @param {Request} req - The incoming request with form ID
 * @returns {Promise<NextResponse>} Created request or error response
 * @throws {401} If user is not authenticated
 * @throws {403} If user lacks permission to create requests
 * @throws {400} If form ID is missing or request already exists
 * @throws {404} If form is not found or unauthorized
 * @throws {500} If server error occurs
 * 
 * Access Control:
 * - Only ADMIN and MANAGER roles can create requests
 * - Users can only request publication for their own forms
 * 
 * Request Body:
 * - formId: ID of the form to publish
 */
export async function POST(req: Request) {
  try {
    // Verify user authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user role has permission to create requests
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Extract and validate form ID
    const body = await req.json();
    const { formId } = body;

    if (!formId) {
      return NextResponse.json(
        { error: "Form ID is required" },
        { status: 400 }
      );
    }

    // Verify form exists and belongs to the user
    const form = await db.form.findFirst({
      where: {
        id: formId,
        userId: session.user.id
      }
    });

    if (!form) {
      return NextResponse.json(
        { error: "Form not found or unauthorized" },
        { status: 404 }
      );
    }

    // Check for existing pending request
    const existingRequest = await db.publicRequest.findFirst({
      where: {
        formId,
        accepted: false
      }
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "A pending request already exists for this form" },
        { status: 400 }
      );
    }

    // Create new publication request
    const request = await db.publicRequest.create({
      data: {
        formId,
        accepted: false
      },
      include: {
        form: {
          include: {
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

    return NextResponse.json({ request });
  } catch (error) {
    console.error("REQUEST_CREATE_ERROR", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 