/**
 * Admin Info API Route
 * 
 * This endpoint returns information about the admin that a user is connected to.
 * It's used to display organization information in the user dashboard.
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
            admin: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!user?.adminCode?.admin) {
      return new NextResponse("User is not connected to an admin", { status: 404 });
    }

    return NextResponse.json({ 
      admin: user.adminCode.admin
    });
  } catch (error) {
    console.error("ADMIN_INFO_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 