/**
 * Form Public Request API Route
 * 
 * This endpoint handles requests to make forms public:
 * - Creates a public request for a form
 * - Validates user authentication
 * - Prevents duplicate requests
 * - Returns updated form status
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";

/**
 * Route Parameters Type
 * Defines the expected parameters for the route handler
 */
type RouteParams = {
  params: Promise<{ formId: string }>;
};

/**
 * POST /api/forms/[formId]/request-public
 * Creates a public request for a form
 * 
 * @param {Request} req - The incoming request
 * @param {RouteParams} params - Route parameters containing formId
 * @returns {Promise<NextResponse>} Request result or error response
 * @throws {401} If user is not authenticated
 * @throws {404} If form is not found
 * @throws {409} If a pending request already exists
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

    // Verify form exists
    const form = await db.form.findUnique({
      where: { id: formId },
      include: {
        publicRequest: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    if (!form) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }

    // Check user permissions
    const isSuperAdmin = session.user.role === UserRole.SADMIN;
    const isFormOwner = session.user.id === form.user.id;
    const isAdmin = session.user.role === UserRole.ADMIN;

    // Only allow super admins or form owners (if they are admins) to request
    if (!isSuperAdmin && !(isAdmin && isFormOwner)) {
      return NextResponse.json(
        { error: "Only super admins or form owners (if they are admins) can request to make forms public" },
        { status: 403 }
      );
    }

    // Check for existing pending request
    const existingRequest = form.publicRequest?.find(request => !request.accepted);
    if (existingRequest) {
      return NextResponse.json(
        { error: "A public request is already pending" },
        { status: 409 }
      );
    }

    // Create public request
    const updatedForm = await db.form.update({
      where: { id: formId },
      data: {
        publicRequest: {
          create: {
            accepted: false
          }
        }
      },
      include: {
        publicRequest: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        fields: true,
        _count: {
          select: {
            submissions: true
          }
        }
      }
    });

    return NextResponse.json(updatedForm);

  } catch (error) {
    console.error("PUBLIC_REQUEST_CREATE_ERROR", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 