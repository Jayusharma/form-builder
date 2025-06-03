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
import { FormSchema } from "@/lib/schemas/form";
import { FormFieldType, Prisma } from "@prisma/client";
import { ZodError } from "zod";
// import formLogger from "@/lib/formLogger";

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
  title: string;
  description?: string;
  fields: FormField[];
  style?: {
    fontFamily: string;
    fontSize: string;
    backgroundColor: string;
    textColor: string;
  };
  header?: string | null;
  footer?: string | null;
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
    
    // Check if user is authenticated
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Only SADMIN and ADMIN can create forms
    if (!["SADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ 
        error: "Permission Denied",
        message: "You are not authorized to create forms. Please contact your administrator."
      }, { status: 403 });
    }

    // Verify user exists in database
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      console.error("User not found in database:", { userId: session.user.id });
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse and validate request body
    let body: FormData;
    try {
      const rawBody = await req.json();
      body = FormSchema.parse(rawBody) as FormData;
    } catch (e) {
      console.error("Failed to parse request body:", e);
      if (e instanceof ZodError) {
        return NextResponse.json(
          {
            error: "Invalid form data",
            details: e.errors.map((err) => ({
              path: err.path.join("."),
              message: err.message,
            })),
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: e instanceof Error ? e.message : "Unknown error",
        },
        { status: 400 }
      );
    }

    // Create form in database
    try {
      // First, verify database connection
      await db.$connect();

      // Create the form with its fields in a transaction
      const result = await db.$transaction(async (tx) => {
        // Create the form first
        const newForm = await tx.form.create({
          data: {
            title: body.title,
            description: body.description || "",
            style: body.style || {},
            header: body.header as Prisma.InputJsonValue | undefined,
            footer: body.footer as Prisma.InputJsonValue | undefined,
            userId: user.id,
            isPublished: false,
          },
        });

        // Create all form fields
        const formFields = await Promise.all(
          body.fields.map((field: FormField, index: number) => {
            return tx.formField.create({
              data: {
                formId: newForm.id,
                type: field.type,
                question: field.question,
                required: field.required,
                options: field.options || [],
                description: field.description || '',
                gridPosition: field.gridPosition,
                order: index,
              },
            });
          })
        );

        // Log form creation
        // formLogger.logFormCreated({
        //   formId: newForm.id,
        //   userId: user.id, 
        //   formTitle: newForm.title,
        //   additionalInfo: {
        //     fieldCount: formFields.length,
        //     isPublished: false,
        //     createdBy: user.role,
        //     description: newForm.description || 'No description',
        //     fields: formFields.map(field => ({
        //       type: field.type,
        //       question: field.question,
        //       required: field.required,
        //       order: field.order
        //     })),
        //     hasHeader: Boolean(body.header),
        //     hasFooter: Boolean(body.footer),
        //     style: body.style || {},
        //     createdAt: new Date().toISOString()
        //   }
        // });

        await tx.publicRequest.create({
          data: {
            formId: newForm.id,
          },
        });

        // Return the form with its fields
        return {
          ...newForm,
          fields: formFields,
        };
      });

      return NextResponse.json(result);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.error("Database error details:", {
          message: error.message,
          code: error.code,
          meta: error.meta,
        });

        // Check for specific database errors
        if (error.code === "P2002") {
          return NextResponse.json(
            { error: "A form with this title already exists" },
            { status: 400 }
          );
        }

        return NextResponse.json(
          {
            error: "Database error",
            details: {
              message: error.message,
              code: error.code,
              meta: error.meta,
            },
          },
          { status: 500 }
        );
      }

      throw error;
    } finally {
      await db.$disconnect();
    }
  } catch (error) {
    console.error("Unexpected error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? {
          message: error.message,
          type: error.name,
        } : { message: "Unknown error" },
      },
      { status: 500 }
    );
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
    
    // Check if user is authenticated
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    // Build the where clause based on user role
    let whereClause = {};
    
    switch (session.user.role) {
      case "SADMIN":
        // SADMIN can see all forms, optionally filtered by userId
        whereClause = userId ? { userId } : {};
        break;
      case "MANAGER":
        // MANAGER can see all forms
        whereClause = {};
        break;
      case "ADMIN":
        // ADMIN can only see their own forms
        whereClause = { userId: session.user.id };
        break;
      default:
        // Other roles can only see their own forms
        whereClause = { userId: session.user.id };
    }

    // Fetch forms with their fields and submissions
    const forms = await db.form.findMany({
      where: whereClause,
      include: {
        fields: true,
        submissions: {
          orderBy: {
            createdAt: "desc"
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    });

    // Return the forms array directly instead of wrapping it in an object
    return NextResponse.json(forms);
  } catch (error) {
    console.error("FORMS_GET_ERROR", error);
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

    // await formLogger.info("Form updated", { formId: id, userId: session.user.id });
    return NextResponse.json(updatedForm);
  } catch (error) {
    console.error("[FORM_UPDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
