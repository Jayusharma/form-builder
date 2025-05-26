/**
 * Connect to Admin API Route
 * 
 * This endpoint allows users to connect to an admin organization using an admin code.
 * It validates the code and updates the user's adminCodeId if valid.
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    // Verify user authentication
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Only regular users can connect to admins
    if (session.user.role !== "USER") {
      return new NextResponse("Only regular users can connect to admins", { status: 403 });
    }

    // Check if user is already connected to an admin
    const existingUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { adminCodeId: true }
    });

    if (existingUser?.adminCodeId) {
      return new NextResponse("User is already connected to an admin", { status: 400 });
    }

    const { code } = await req.json();

    if (!code || typeof code !== "string") {
      return new NextResponse("Invalid admin code", { status: 400 });
    }

    // Find admin code and verify it exists
    const adminCode = await db.adminCode.findUnique({
      where: { code },
      include: {
        admin: {
          select: {
            role: true
          }
        }
      }
    });

    if (!adminCode) {
      return new NextResponse("Invalid admin code", { status: 404 });
    }

    // Verify the code belongs to an admin
    if (adminCode.admin.role !== "ADMIN") {
      return new NextResponse("Invalid admin code", { status: 400 });
    }

    // Update user with admin code
    await db.user.update({
      where: { id: session.user.id },
      data: {
        adminCodeId: adminCode.id
      }
    });

    return NextResponse.json({ 
      message: "Successfully connected to admin",
      adminCodeId: adminCode.id
    });
  } catch (error) {
    console.error("CONNECT_ADMIN_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 