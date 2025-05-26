/**
 * User Submissions API Route
 * 
 * This module provides an API endpoint for retrieving a user's form submissions.
 * Features:
 * - Lists all submissions for the authenticated user
 * - Includes form details and field information
 * - Orders submissions by creation date
 * - Includes response counts
 * - Requires user authentication
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/submissions/my-submissions
 * Retrieves all form submissions for the authenticated user
 * 
 * @returns {Promise<NextResponse>} List of user's submissions or error response
 * @throws {401} If user is not authenticated
 * @throws {500} If server error occurs
 * 
 * Response includes:
 * - Submission metadata (id, createdAt)
 * - Form details (id, title, description)
 * - Form fields (id, question, type, order)
 * - Response count for each submission
 */
export async function GET() {
  try {
    const session = await auth();

    // Verify user authentication
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Fetch user's submissions with form and field details
    const submissions = await prisma.formSubmission.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        form: {
          select: {
            id: true,
            title: true,
            description: true,
            fields: {
              select: {
                id: true,
                question: true,
                type: true,
                order: true
              },
              orderBy: {
                order: 'asc'
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Add response count to each submission
    const submissionsWithCounts = submissions.map(submission => ({
      ...submission,
      responseCount: Object.keys(submission.responses as Record<string, any>).length
    }));

    return NextResponse.json(submissionsWithCounts);
  } catch (error) {
    console.error("[MY_SUBMISSIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 