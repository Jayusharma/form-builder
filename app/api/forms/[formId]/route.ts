/**
 * Form Management API Route
 * 
 * This module provides API endpoints for managing individual forms.
 * Features:
 * - Retrieve form details
 * - Update form content and structure
 * - Delete forms
 * - Role-based access control
 * - Form field management
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { FormFieldType } from "@/lib/schemas/form";

/**
 * Route Parameters Type
 * Defines the expected parameters for the route handlers
 */
type RouteParams = {
  params: Promise<{ formId: string }>;
};

interface FormField {
  type: FormFieldType;
  question: string;
  required: boolean;
  options?: string[];
  description?: string;
  gridPosition: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface FormData {
  title?: string;
  description?: string | null;
  fields?: FormField[];
  style?: {
    fontFamily: string;
    fontSize: string;
    backgroundColor: string;
    textColor: string;
  };
  isPublished?: boolean;
}

/**
 * GET /api/forms/[formId]
 * Retrieves form details
 * 
 * @param {Request} req - The incoming request
 * @param {RouteParams} params - Route parameters containing formId
 * @returns {Promise<NextResponse>} Form data or error response
 * @throws {404} If form is not found
 * @throws {500} If server error occurs
 */
export async function GET(
  req: Request,
  { params }: RouteParams
) {
  try {
    const resolvedParams = await params;
    const form = await db.form.findUnique({
      where: {
        id: resolvedParams.formId,
      },
    });

    if (!form) {
      return new NextResponse("Form not found", { status: 404 });
    }

    return NextResponse.json(form);
  } catch (error) {
    console.error("[FORM_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

/**
 * PATCH /api/forms/[formId]
 * Updates form content and structure
 * 
 * @param {Request} req - The incoming request with form update data
 * @param {RouteParams} params - Route parameters containing formId
 * @returns {Promise<NextResponse>} Updated form data or error response
 * @throws {401} If user is not authenticated
 * @throws {404} If form is not found
 * @throws {500} If server error occurs
 * 
 * Request Body:
 * - title: Form title
 * - description: Form description
 * - fields: Array of form fields
 * - style: Form styling options
 * 
 * Note: Updates form fields in a transaction to ensure consistency
 */
export async function PATCH(
  req: Request,
  { params }: RouteParams
) {
  try {
    // Verify user authentication
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const resolvedParams = await params;
    const data = await req.json() as FormData;

    // Verify form exists and user is owner
    const form = await db.form.findUnique({
      where: {
        id: resolvedParams.formId,
        userId: session.user.id,
      },
      include: {
        fields: true,
      },
    });

    if (!form) {
      return new NextResponse("Form not found", { status: 404 });
    }

    // Update form and fields in a transaction
    const updatedForm = await db.$transaction(async (tx) => {
      // Update form metadata
      const updatedForm = await tx.form.update({
        where: {
          id: resolvedParams.formId,
        },
        data: {
          title: data.title,
          description: data.description,
          style: data.style,
        },
      });

      // Replace existing fields with new fields
      await tx.formField.deleteMany({
        where: {
          formId: resolvedParams.formId,
        },
      });

      // Create new fields with order
      const formFields = await Promise.all(
        data.fields?.map((field: FormField, index: number) => {
          return tx.formField.create({
            data: {
              formId: resolvedParams.formId,
              type: field.type,
              question: field.question,
              required: field.required,
              options: field.options || [],
              description: field.description || '',
              gridPosition: field.gridPosition,
              order: index,
            },
          });
        }) || []
      );

      return {
        ...updatedForm,
        fields: formFields,
      };
    });

    return NextResponse.json(updatedForm);
  } catch (error) {
    console.error("[FORM_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

/**
 * DELETE /api/forms/[formId]
 * Removes a form and its associated data
 * 
 * @param {Request} req - The incoming request
 * @param {RouteParams} params - Route parameters containing formId
 * @returns {Promise<NextResponse>} Success or error response
 * @throws {401} If user is not authenticated
 * @throws {404} If form is not found
 * @throws {500} If server error occurs
 * 
 * Note: Only form owners can delete their forms
 */
export async function DELETE(
  req: Request,
  { params }: RouteParams
) {
  try {
    // Verify user authentication
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const resolvedParams = await params;
    
    // Verify form exists and user is owner
    const form = await db.form.findUnique({
      where: {
        id: resolvedParams.formId,
        userId: session.user.id,
      },
    });

    if (!form) {
      return new NextResponse("Form not found", { status: 404 });
    }

    // Delete form (cascading deletes will handle related records)
    await db.form.delete({
      where: {
        id: resolvedParams.formId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[FORM_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 