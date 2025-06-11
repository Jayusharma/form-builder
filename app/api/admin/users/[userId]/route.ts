/**
 * User Management API Routes
 * 
 * This module provides API endpoints for managing user accounts.
 * It includes:
 * - GET: Fetch user details
 * - PATCH: Update user information
 * - DELETE: Remove user accounts
 * 
 * All routes require super admin (SADMIN) authentication.
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

/**
 * Route Parameters Type
 * Defines the expected parameters for the route handlers
 */
type RouteParams = {
  params: Promise<{ userId: string }>;
};

/**
 * GET /api/admin/users/[userId]
 * Fetches detailed information about a specific user
 * 
 * @param {Request} req - The incoming request
 * @param {RouteParams} params - Route parameters containing userId
 * @returns {Promise<NextResponse>} User data or error response
 * @throws {403} If user is not authenticated or not a super admin
 * @throws {404} If user is not found
 * @throws {500} If server error occurs
 */
export async function GET(
  req: Request,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    
    // Verify super admin authentication
    if (!session?.user || session.user.role !== "SADMIN") {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const resolvedParams = await params;
    const userId = resolvedParams.userId;

    // Fetch user with selected fields
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        location: true,
        bio: true,
        isTwoFactorEnabled: true,
        createdAt: true,
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("USER_GET_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

/**
 * Generates a random admin code
 * @returns {string} A random 8-character alphanumeric code
 */
function generateAdminCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * PATCH /api/admin/users/[userId]
 * Updates user information including name, role, and 2FA status
 * 
 * @param {Request} req - The incoming request with update data
 * @param {RouteParams} params - Route parameters containing userId
 * @returns {Promise<NextResponse>} Updated user data or error response
 * @throws {400} If role is invalid
 * @throws {403} If user is not authenticated or not a super admin
 * @throws {500} If server error occurs
 */
export async function PATCH(
  req: Request,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    
    // Verify super admin authentication
    if (!session?.user || session.user.role !== "SADMIN") {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const resolvedParams = await params;
    const userId = resolvedParams.userId;
    const { name, email, role, isTwoFactorEnabled } = await req.json();

    // Validate role value
    if (role !== "ADMIN" && role !== "USER" && role !== "MANAGER" && role !== "SADMIN") {
      return new NextResponse("Invalid role", { status: 400 });
    }

    // If role is being changed to ADMIN, generate a new admin code
    let adminCode = null;
    if (role === "ADMIN") {
      const existingUser = await db.user.findUnique({
        where: { id: userId },
        include: { adminCodes: true }
      });

      // Only generate new code if user doesn't already have one
      if (!existingUser?.adminCodes?.length) {
        adminCode = await db.adminCode.create({
          data: {
            code: generateAdminCode(),
            adminId: userId,
          }
        });
      }
    }

    // Update user with new data
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        role,
        isTwoFactorEnabled,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isTwoFactorEnabled: true,
        adminCodes: {
          select: {
            code: true
          }
        }
      },
    });

    return NextResponse.json({ 
      user: updatedUser,
      adminCode: adminCode?.code // Include the new admin code in response if generated
    });
  } catch (error) {
    console.error("USER_UPDATE_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

/**
 * DELETE /api/admin/users/[userId]
 * Removes a user account and all associated data
 * 
 * @param {Request} req - The incoming request
 * @param {RouteParams} params - Route parameters containing userId
 * @returns {Promise<NextResponse>} Success or error response
 * @throws {400} If attempting to delete own account
 * @throws {403} If user is not authenticated or not a super admin
 * @throws {500} If server error occurs
 */
export async function DELETE(
  req: Request,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    
    // Verify super admin authentication
    if (!session?.user || session.user.role !== "SADMIN") {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const resolvedParams = await params;
    const userId = resolvedParams.userId;

    // Prevent self-deletion
    if (session.user.id === userId) {
      return new NextResponse("Cannot delete your own account", { status: 400 });
    }

    // Delete user (cascading deletes will handle related records)
    await db.user.delete({
      where: { id: userId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("USER_DELETE_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}