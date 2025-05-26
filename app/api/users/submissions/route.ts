/**
 * User Submissions API Route
 * 
 * GET /api/users/submissions
 * Fetches all form submissions made by the authenticated user
 * 
 * @returns {Promise<NextResponse>} List of submissions or error response
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();

    // Verify user authentication
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch user's submissions with form details
    const submissions = await db.formSubmission.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        formId: true,
        createdAt: true,
        responses: true,
        form: {
          select: {
            title: true,
            description: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("SUBMISSIONS_FETCH_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 