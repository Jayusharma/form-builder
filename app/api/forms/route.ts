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
import { UserRole } from "@prisma/client";
import formLogger from "@/lib/formLogger";

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

    // Only SADMIN, ADMIN, and MANAGER can create forms
    if (!["SADMIN", "ADMIN",].includes(session.user.role)) {
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

    // 3. Parse request body
    let body;
    try {
      body = await req.json();
     
    } catch (e) {
      console.error("Failed to parse request body:", e);
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: e instanceof Error ? e.message : "Unknown error",
        },
        { status: 400 }
      );
    }

    // 4. Validate data
    try {
      const validatedData = FormSchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof ZodError) {
        console.error("Validation error details:", {
          errors: validationError.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        });
        return NextResponse.json(
          {
            error: "Invalid form data",
            details: validationError.errors.map((e) => ({
              path: e.path.join("."),
              message: e.message,
            })),
          },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // 5. Create form in database
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
            header: body.header || null,
            footer: body.footer || null,
            userId: user.id,
            isPublished: false,
          },
        });

        // Create all form fields
        const formFields = await Promise.all(
          body.fields.map((field: any, index: number) => {
            return tx.formField.create({
              data: {
                formId: newForm.id,
                type: field.type as FormFieldType,
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
        formLogger.logFormCreated({
          formId: newForm.id,
          userId: user.id, 
          formTitle: newForm.title,
          additionalInfo: {
            fieldCount: formFields.length,
            isPublished: false,
            createdBy: user.role
          }
        });

        const PublicRequest = await tx.publicRequest.create({
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
    } catch (dbError: any) {
      console.error("Database error details:", {
        message: dbError.message,
        code: dbError.code,
        meta: dbError.meta,
        stack: dbError.stack,
      });

      // Check for specific database errors
      if (dbError.code === "P2002") {
        return NextResponse.json(
          { error: "A form with this title already exists" },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: "Database error",
          details: {
            message: dbError.message,
            code: dbError.code,
            meta: dbError.meta,
          },
        },
        { status: 500 }
      );
    } finally {
      await db.$disconnect();
    }
  } catch (error: any) {
    console.error("Unexpected error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause,
    });

    return NextResponse.json(
      {
        error: "Internal server error",
        details: {
          message: error.message,
          type: error.name,
          cause: error.cause,
        },
      },
      { status: 500 }
    );
  } finally {
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

    return NextResponse.json({ forms });
  } catch (error) {
    console.error("FORMS_GET_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
