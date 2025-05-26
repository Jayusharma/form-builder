/**
 * User Search API Route
 * 
 * This module provides an API endpoint for searching users.
 * Features:
 * - Search users by name or email
 * - Case-insensitive search
 * - Returns user details with form counts
 * - Requires super admin authentication
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

/**
 * GET /api/search
 * Searches for users based on query parameters
 * 
 * @param {Request} req - The incoming request with search parameters
 * @returns {Promise<NextResponse>} List of matching users or error response
 * @throws {403} If user is not authenticated or not a super admin
 * @throws {500} If server error occurs
 * 
 * Query Parameters:
 * - query: Optional search term to filter users by name or email
 *          If not provided, returns all users
 */
export async function GET(req: Request) {
  try {
    const session = await auth();
    
    // Verify super admin authentication
    if (!session || session.user.role !== "SADMIN") {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Extract search query from URL
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");

    // Return all users if no search query provided
    if (!query) {
      const allUsers = await db.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          _count: {
            select: {
              forms: true,
            },
          },
        }
      });
      return NextResponse.json(allUsers);
    }

    // Search users with case-insensitive matching
    const users = await db.user.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: "insensitive"
            }
          },
          {
            email: {
              contains: query,
              mode: "insensitive"
            }
          },
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        _count: {
          select: {
            forms: true,
          },
        },
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("SEARCH_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}