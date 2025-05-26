/**
 * Admin Forms API Route
 * 
 * This endpoint returns all forms created by the admin that the user is connected to.
 * It's used to display available forms in the user dashboard.
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

    // Only regular users can access this endpoint
    if (session.user.role !== "USER") {
      return new NextResponse("Only regular users can access this endpoint", { status: 403 });
    }

    // Get user with admin information
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        adminCode: {
          select: {
            adminId: true
          }
        }
      }
    });

    if (!user?.adminCode?.adminId) {
      return new NextResponse("User is not connected to an admin", { status: 404 });
    }

    // Get all published forms from the admin
    const forms = await db.form.findMany({
      where: {
        userId: user.adminCode.adminId,
        isPublished: true
      },
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ forms });
  } catch (error) {
    console.error("ADMIN_FORMS_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 