/**
 * Form Publication Request Management API Route
 * 
 * This module provides API endpoints for managing individual form publication requests.
 * Features:
 * - Approve/reject publication requests
 * - View request details
 * - Delete requests
 * - Role-based access control
 * - Request status validation
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
// import { formLogger } from "@/lib/formLogger";

/**
 * Route Parameters Type
 * Defines the expected parameters for the route handlers
 */
type RouteParams = {
  params: Promise<{ requestId: string }>;
};

/**
 * PATCH /api/forms/requests/[requestId]
 * Updates the status of a publication request
 * 
 * @param {Request} req - The incoming request with status update
 * @param {RouteParams} params - Route parameters containing requestId
 * @returns {Promise<NextResponse>} Updated request or error response
 * @throws {401} If user is not authenticated
 * @throws {400} If request data is invalid
 * @throws {403} If user lacks permission to update request
 * @throws {404} If request is not found
 * @throws {500} If server error occurs
 * 
 * Request Body:
 * - accepted: Boolean indicating request approval/rejection
 * 
 * Access Control:
 * - SADMIN: Can update all requests
 * - Form Owner: Can update requests for their forms
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const { accepted } = await req.json();
    const resolvedParams = await params;
    const { requestId } = resolvedParams;

    const request = await db.publicRequest.findUnique({
      where: { id: requestId },
      include: { form: true }
    });

    if (!request) {
      return new NextResponse("Request not found", { status: 404 });
    }

    // Only form owner can update request status
    if (request.form.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const updatedRequest = await db.publicRequest.update({
      where: { id: requestId },
      data: { accepted },
      include: { form: true }
    });

    // Log the request status change
    // await formLogger.info(`Form request status updated to ${accepted}`, {
    //   formId: request.formId,
    //   userId: session.user.id,
    //   metadata: {
    //     requestId,
    //     oldStatus: request.accepted,
    //     newStatus: accepted
    //   }
    // });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("[REQUEST_UPDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

/**
 * GET /api/forms/requests/[requestId]
 * Retrieves details of a specific publication request
 * 
 * @param {Request} req - The incoming request
 * @param {RouteParams} params - Route parameters containing requestId
 * @returns {Promise<NextResponse>} Request details or error response
 * @throws {401} If user is not authenticated
 * @throws {403} If user lacks permission to view request
 * @throws {404} If request is not found
 * @throws {500} If server error occurs
 * 
 * Access Control:
 * - SADMIN: Can view all requests
 * - Form Owner: Can view requests for their forms
 */
export async function GET(req: Request, { params }: RouteParams) {
  try {
    // Verify user authentication
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const resolvedParams = await params;
    const { requestId } = resolvedParams;

    // Fetch request with form and user details
    const request = await db.publicRequest.findUnique({
      where: { id: requestId },
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

    if (!request) {
      return new NextResponse("Request not found", { status: 404 });
    }

    // Verify user has permission to view request
    const canViewRequest = 
      session.user.role === "SADMIN" || // SADMIN can view all requests
      request.form.userId === session.user.id; // Form owner can view requests for their form

    if (!canViewRequest) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    return NextResponse.json({ request });
  } catch (error) {
    console.error("REQUEST_GET_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

/**
 * DELETE /api/forms/requests/[requestId]
 * Removes a publication request
 * 
 * @param {Request} req - The incoming request
 * @param {RouteParams} params - Route parameters containing requestId
 * @returns {Promise<NextResponse>} Success or error response
 * @throws {401} If user is not authenticated
 * @throws {403} If user lacks permission to delete request
 * @throws {404} If request is not found
 * @throws {500} If server error occurs
 * 
 * Access Control:
 * - SADMIN: Can delete all requests
 * - Form Owner: Can delete requests for their forms
 */
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    // Verify user authentication
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const resolvedParams = await params;
    const { requestId } = resolvedParams;

    // Fetch request with form and user details
    const request = await db.publicRequest.findUnique({
      where: { id: requestId },
      include: {
        form: {
          include: {
            user: {
              select: {
                id: true,
                role: true
              }
            }
          }
        }
      }
    });

    if (!request) {
      return new NextResponse("Request not found", { status: 404 });
    }

    // Verify user has permission to delete request
    const canDeleteRequest = 
      session.user.role === "SADMIN" || // SADMIN can delete all requests
      request.form.userId === session.user.id; // Form owner can delete requests for their form

    if (!canDeleteRequest) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Delete request
    await db.publicRequest.delete({
      where: { id: requestId }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("REQUEST_DELETE_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 