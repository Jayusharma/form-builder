/**
 * Form Publication Requests API Route
 * 
 * This module provides an API endpoint for managing form publication requests.
 * Features:
 * - List all publication requests
 * - Include form details
 * - Order requests by creation date
 * - Error handling and logging
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/requests
 * Retrieves all form publication requests
 * 
 * @returns {Promise<NextResponse>} List of requests or error response
 * @throws {500} If server error occurs
 * 
 * Response includes:
 * - Request details (id, status, timestamp)
 * - Form metadata (id, title)
 * - Ordered by most recent first
 */
export async function GET() {
  try {
    const requests = await prisma.publicRequest.findMany({
      include: {
        form: {
          select: {
            id: true,
            title: true,
            // Add other form fields you want to include
          }
        }
      },
      orderBy: {
        id: 'desc' // Most recent first
      }
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching public requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch public requests' },
      { status: 500 }
    );
  }
}

