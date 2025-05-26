/**
 * Register Action
 * 
 * Server action that handles new user registration.
 * Features:
 * - User account creation
 * - Password hashing
 * - Email verification
 * - Duplicate email prevention
 * - Database operations
 */

"use server";

import * as z from "zod";
import { RegisterSchema } from "@/schemas";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getUserByEmail } from "@/data/user";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";

/**
 * Creates a new user account and initiates email verification
 * 
 * @param {z.infer<typeof RegisterSchema>} values - Registration data
 * @returns {Promise<{error?: string, success?: string}>} Registration result
 * 
 * Process:
 * 1. Validates registration data
 * 2. Checks for existing users
 * 3. Hashes password
 * 4. Creates user account
 * 5. Generates verification token
 * 6. Sends verification email
 * 
 * Security Features:
 * - Password hashing
 * - Email verification
 * - Duplicate prevention
 * - Data validation
 */
export const register = async (values: z.infer<typeof RegisterSchema>) => {
  const Validate = RegisterSchema.safeParse(values);
  if (!Validate.success) {
    return { error: "invalid fileds" };
  }
  const { email, password, name } = Validate.data;
  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return { error: "Email already in use" };
  }
  await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });
const verificationToken =await generateVerificationToken(email);
await sendVerificationEmail(
  verificationToken.email,
  verificationToken.token, 
)
  return { success: "Confirmation email sent!" };
};
