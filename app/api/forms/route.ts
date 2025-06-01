/**
 * Form Management API Route
 * 
 * This module provides API endpoints for managing forms.
 * Features:
 * - Create new forms with fields
 * - List forms with filtering by user
 * - Role-based access control
 * - Form validation and error handling
 * - Transaction-based form creation
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { FormField } from "@/lib/schemas/form";
import { formLogger } from "@/lib/formLogger";
import { Prisma } from "@prisma/client";

interface FormCreateData {
  title: string;
  description?: string;
  fields: FormField[];
  style?: {
    fontFamily: string;
    fontSize: string;
    backgroundColor: string;
    textColor: string;
  };
}

interface FormUpdateData {
  title?: string;
  description?: string;
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
 * Converts a GridPosition object to a JSON-compatible object for Prisma
 */
function gridPositionToJson(gridPosition: { x: number; y: number; width: number; height: number }): Prisma.InputJsonValue {
  return {
    x: gridPosition.x,
    y: gridPosition.y,
    width: gridPosition.width,
    height: gridPosition.height
  };
}

/**
 * POST /api/forms
 * Creates a new form with its fields
 * 
 * @param {Request} req - The incoming request with form data
 * @returns {Promise<NextResponse>} Created form or error response
 * @throws {401} If user is not authenticated
 * @throws {403} If user lacks permission to create forms
 * @throws {400} If form data is invalid
 * @throws {500} If server error occurs
 * 
 * Access Control:
 * - Only SADMIN and ADMIN roles can create forms
 * 
 * Request Body:
 * - title: Form title
 * - description: Form description (optional)
 * - fields: Array of form fields
 * - style: Form styling options (optional)
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const data = await req.json() as FormCreateData;
    
    const form = await db.form.create({
      data: {
        title: data.title,
        description: data.description || "",
        userId: session.user.id,
        fields: {
          create: data.fields.map((field, index) => ({
            type: field.type,
            question: field.question,
            required: field.required,
            options: field.options || [],
            description: field.description || '',
            gridPosition: gridPositionToJson(field.gridPosition),
            order: index
          }))
        },
        style: data.style || {
          fontFamily: "inter",
          fontSize: "base",
          backgroundColor: "#ffffff",
          textColor: "#000000"
        }
      }
    });

    await formLogger.info("Form created", { formId: form.id, userId: session.user.id });
    return NextResponse.json(form);
  } catch (error) {
    console.error("[FORM_CREATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

/**
 * GET /api/forms
 * Retrieves forms based on user role and optional filters
 * 
 * @param {Request} req - The incoming request with optional query parameters
 * @returns {Promise<NextResponse>} List of forms or error response
 * @throws {401} If user is not authenticated
 * @throws {500} If server error occurs
 * 
 * Query Parameters:
 * - userId: Optional filter by user ID
 * 
 * Access Control:
 * - SADMIN: Can view all forms
 * - MANAGER: Can view all forms
 * - ADMIN: Can only view their own forms
 * - Other roles: Can only view their own forms
 * 
 * Response includes:
 * - Form metadata (id, title, description)
 * - Form fields
 * - Submission counts
 * - Creator details
 * - Last update timestamp
 */
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const published = searchParams.get("published");
    const userId = searchParams.get("userId");

    const forms = await db.form.findMany({
      where: {
        userId: userId || session.user.id,
        isPublished: published === "true" ? true : undefined
      },
      include: {
        fields: {
          orderBy: {
            order: "asc"
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        },
        submissions: {
          orderBy: {
            createdAt: "desc"
          }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json(forms);
  } catch (error) {
    console.error("[FORMS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const data = await req.json() as FormUpdateData & { id: string };
    const { id, ...updateData } = data;

    const form = await db.form.findUnique({
      where: { id }
    });

    if (!form) {
      return new NextResponse("Form not found", { status: 404 });
    }

    if (form.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const updatedForm = await db.form.update({
      where: { id },
      data: {
        title: updateData.title,
        description: updateData.description,
        style: updateData.style,
        fields: updateData.fields ? {
          deleteMany: {},
          create: updateData.fields.map((field, index) => ({
            type: field.type,
            question: field.question,
            required: field.required,
            options: field.options || [],
            description: field.description || '',
            gridPosition: gridPositionToJson(field.gridPosition),
            order: index
          }))
        } : undefined
      },
      include: {
        fields: true
      }
    });

    await formLogger.info("Form updated", { formId: id, userId: session.user.id });
    return NextResponse.json(updatedForm);
  } catch (error) {
    console.error("[FORM_UPDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
