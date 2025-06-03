/**
 * Form Privacy Management API Route
 * 
 * This module provides an API endpoint for managing form privacy settings.
 * Features:
 * - Make published forms private
 * - Role-based access control (form owner or SADMIN)
 * - Form existence and state validation
 * - Returns updated form with related data
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
// import { formLogger } from '@/lib/formLogger';

/**
 * Route Parameters Type
 * Defines the expected parameters for the route handler
 */
type RouteParams = {
  params: Promise<{ formId: string }>;
};

/**
 * POST /api/forms/[formId]/private
 * Makes a published form private
 * 
 * @param {Request} req - The incoming request
 * @param {RouteParams} params - Route parameters containing formId
 * @returns {Promise<NextResponse>} Updated form data or error response
 * @throws {401} If user is not authenticated
 * @throws {403} If user lacks permission to modify form
 * @throws {404} If form is not found
 * @throws {400} If form is already private
 * @throws {500} If server error occurs
 */
export async function POST(
  req: Request,
  { params }: RouteParams
) {
  try {
    // Verify user authentication
    const session = await auth();
    if (!session?.user) {
      // formLogger.warn("Unauthorized attempt to make form private", {
      //   event: 'FORM_REQUEST_UNAUTHORIZED'
      // });
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const { formId } = resolvedParams;

    // Fetch form to verify ownership and current state
    const form = await prisma.form.findUnique({
      where: { id: formId },
      select: {
        id: true,
        userId: true,
        isPublished: true,
        title: true
      }
    });

    // Handle form not found
    if (!form) {
      // formLogger.warn("Attempt to make non-existent form private", {
      //   event: 'FORM_REQUEST_NOT_FOUND',
      //   formId,
      //   userId: session.user.id
      // });
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }

    // Prevent redundant privacy changes
    if (!form.isPublished) {
      // formLogger.warn("Attempt to make already private form private", {
      //   event: 'FORM_REQUEST_ERROR',
      //   formId,
      //   formTitle: form.title,
      //   userId: session.user.id,
      //   additionalInfo: {
      //     currentStatus: 'private'
      //   }
      // });
      return NextResponse.json(
        { error: "Form is already private" },
        { status: 400 }
      );
    }

    // Verify user has permission to modify form
    // Either form owner or super admin can make form private
    const isOwner = form.userId === session.user.id;
    const isSAdmin = session.user.role === "SADMIN";

    if (!isOwner && !isSAdmin) {
      // formLogger.warn("Unauthorized attempt to make form private", {
      //   event: 'FORM_REQUEST_FORBIDDEN',
      //   formId,
      //   formTitle: form.title,
      //   userId: session.user.id,
      //   additionalInfo: {
      //     isOwner,
      //     isSAdmin,
      //     formOwnerId: form.userId
      //   }
      // });
      return NextResponse.json(
        { error: "You don't have permission to make this form private" },
        { status: 403 }
      );
    }

    // Update form privacy status and return updated data
    const updatedForm = await prisma.form.update({
      where: { id: formId },
      data: { isPublished: false },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        fields: {
          orderBy: {
            order: 'asc'
          }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      }
    });

    // Log successful privacy change
    // formLogger.logFormMadePrivate({
    //   formId,
    //   formTitle: form.title,
    //   userId: session.user.id,
    //   additionalInfo: {
    //     userName: session.user.name,
    //     userRole: session.user.role,
    //     submissionCount: updatedForm._count.submissions
    //   }
    // });

    return NextResponse.json(updatedForm);
  } catch (error) {
    console.error("[FORM_MAKE_PRIVATE]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 