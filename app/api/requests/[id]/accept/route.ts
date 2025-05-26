import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

type RouteParams = {
  params: Promise<{ id: string }>;
};

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    
    // Check if user is authenticated
    if (!session?.user) {
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
      return new NextResponse("Request not found", { status: 404 });
    }

    // Check if user has permission to accept the request
    const canAcceptRequest = 
      session.user.role === "SADMIN" || // SADMIN can accept all requests
      request.form.userId === session.user.id; // Form owner can accept requests for their form

    if (!canAcceptRequest) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Update the request and form in a transaction
    const result = await db.$transaction(async (tx) => {
      // Update request status
      const updatedRequest = await tx.publicRequest.update({
        where: { id },
        data: {
          accepted: true
        }
      });

      // Update form publication status
      const updatedForm = await tx.form.update({
        where: { id: request.formId },
        data: { isPublished: true }
      });

      return { request: updatedRequest, form: updatedForm };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("REQUEST_ACCEPT_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 