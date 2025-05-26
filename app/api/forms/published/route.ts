/**
 * Published Forms API Route
 * 
 * This module provides an API endpoint for retrieving published forms.
 * Features:
 * - List all published forms
 * - Include form creator details
 * - Include form fields and submission counts
 * - Order forms by last update
 * - Require user authentication
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// Force dynamic rendering and use Node.js runtime
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/forms/published
 * Retrieves all published forms with their details
 * 
 * @returns {Promise<NextResponse>} List of published forms or error response
 * @throws {401} If user is not authenticated
 * @throws {500} If server error occurs
 * 
 * Response includes:
 * - Form metadata (id, title, description)
 * - Creator details (name, email)
 * - Form fields (ordered by position)
 * - Submission count
 * - Last update timestamp
 */
export async function GET() {
  try {
    // Verify user authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    
    // Fetch published forms with related data
    const forms = await prisma.form.findMany({
      where: {
        isPublished: true
      },
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
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json(forms);
  } catch (error) {
    console.error("[FORMS_PUBLISHED]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 