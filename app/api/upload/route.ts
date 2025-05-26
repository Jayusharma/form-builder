/**
 * File Upload API Route
 * 
 * This module provides an API endpoint for handling file uploads.
 * Features:
 * - Image file upload (JPEG, PNG, GIF)
 * - File size validation (max 10MB)
 * - Unique filename generation
 * - Secure file storage in public/uploads
 * - Returns public URL for uploaded file
 */

import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/upload
 * Handles file upload requests
 * 
 * @param {Request} request - The incoming request containing form data
 * @returns {Promise<NextResponse>} Upload result or error response
 * @throws {400} If no file provided or invalid file type/size
 * @throws {500} If server error occurs
 * 
 * Request Body:
 * - file: The file to upload (multipart/form-data)
 * 
 * Response:
 * - url: Public URL of the uploaded file
 * - message: Success message
 */
export async function POST(request: Request) {
  try {
    // Extract file from form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    // Validate file presence
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG and GIF are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const uniqueId = uuidv4();
    const extension = file.name.split('.').pop();
    const filename = `${uniqueId}.${extension}`;

    // Define upload path
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    const filepath = join(uploadDir, filename);

    // Save file to disk
    await writeFile(filepath, buffer);

    // Return success response with file URL
    return NextResponse.json({ 
      url: `/uploads/${filename}`,
      message: 'File uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Error uploading file' },
      { status: 500 }
    );
  }
} 