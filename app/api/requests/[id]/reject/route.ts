/**
 * Form Publication Request Rejection API Route
 * 
 * This module provides an API endpoint for rejecting form publication requests.
 * Features:
 * - Reject publication requests
 * - Role-based access control
 * - Request validation
 * - Status tracking
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { formLogger } from '@/lib/formLogger';

/**
 * Route Parameters Type
 * Defines the expected parameters for the route handler
 */
type RouteParams = {
  params: Promise<{ id: string }>;
};

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/requests/[id]/reject
 * Rejects a form publication request
 * 
 * @param {Request} req - The incoming request
 * @param {RouteParams} params - Route parameters containing request ID
 * @returns {Promise<NextResponse>} Updated request or error response
 * @throws {401} If user is not authenticated
 * @throws {403} If user lacks permission to reject request
 * @throws {404} If request is not found
 * @throws {500} If server error occurs
 * 
 * Access Control:
 * - SADMIN: Can reject all requests
 * - Form Owner: Can reject requests for their forms
 * 
 * Process:
 * 1. Validates request existence
 * 2. Verifies user permissions
 * 3. Updates request status to rejected
 * 4. Returns updated request data
 */
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    
    // Check if user is authenticated
    if (!session?.user) {
      formLogger.warn('Unauthorized attempt to reject form request', {
        event: 'FORM_REQUEST_UNAUTHORIZED',
        userId: 'anonymous'
      });
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

   
    // Verify that the request exists
    const request = await db.publicRequest.findUnique({
      where: { id },
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
      formLogger.warn('Attempt to reject non-existent request', {
        event: 'FORM_REQUEST_NOT_FOUND',
        requestId: id,
        userId: session.user.id,
        userName: session.user.name
      });
      return new NextResponse("Request not found", { status: 404 });
    }

    // Check if user has permission to reject the request
    const canRejectRequest = 
      session.user.role === "SADMIN" || // SADMIN can reject all requests
      request.form.userId === session.user.id; // Form owner can reject requests for their form

    if (!canRejectRequest) {
      formLogger.warn('Unauthorized attempt to reject form request', {
        event: 'FORM_REQUEST_FORBIDDEN',
        requestId: id,
        userId: session.user.id,
        userName: session.user.name,
        formId: request.formId,
        formTitle: request.form.title,
        userRole: session.user.role
      });
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Update the request status
    const updatedRequest = await db.publicRequest.update({
      where: { id },
      data: {
        accepted: false
      }
    });

    // Log successful request rejection
    formLogger.info('Form publication request rejected', {
      event: 'FORM_REQUEST_REJECTED',
      requestId: id,
      userId: session.user.id,
      userName: session.user.name,
      formId: request.formId,
      formTitle: request.form.title,
      formOwner: request.form.userId
    });

    return NextResponse.json({ request: updatedRequest });
  } catch (error) {
    console.error("REQUEST_REJECT_ERROR", error);
    // Get the resolved params for error logging
    const resolvedParams = await params;
    const session = await auth();
    
    formLogger.error('Error rejecting form publication request', {
      event: 'FORM_REQUEST_ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: resolvedParams.id,
      userId: session?.user?.id || 'unknown'
    });
    return new NextResponse("Internal Error", { status: 500 });
  }
} 