/**
 * New Password Action
 * 
 * Server action that handles password reset and update functionality.
 * Features:
 * - Password reset token validation
 * - Secure password hashing
 * - Token expiration handling
 * - User verification
 * - Database updates
 */

"use server";
import bcrypt from "bcryptjs";
import * as z from "zod";
import { NewPasswordSchema } from "@/schemas";
import { getPasswordResetByToken } from "@/data/password-reset-token";
import { getUserByEmail } from "@/data/user";
import { db } from "@/lib/db";

/**
 * Updates a user's password using a reset token
 * 
 * @param {z.infer<typeof NewPasswordSchema>} values - New password data
 * @param {string | null} [token] - Password reset token
 * @returns {Promise<{error?: string, success?: string}>} Update result
 * 
 * Process:
 * 1. Validates reset token
 * 2. Verifies token expiration
 * 3. Confirms user existence
 * 4. Hashes new password
 * 5. Updates user record
 * 6. Cleans up used token
 * 
 * Security Features:
 * - Token expiration check
 * - Secure password hashing
 * - Token cleanup after use
 * - User verification
 */
export const newPassword = async (
  values: z.infer<typeof NewPasswordSchema>,
  token?: string | null
) => {
  if (!token) {
    return { error: "Missing token" };
  }

  const validatedFields = NewPasswordSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }
  const { password } = validatedFields.data;
  const existingToken = await getPasswordResetByToken(token);
  if (!existingToken) {
    return { error: "Invalid token" };
  }
  const hasExpired = new Date(existingToken.expires) < new Date();
  if (hasExpired) {
    return { error: "Token has expired" };
  }
  const existingUser = await getUserByEmail(existingToken.email);

  if (!existingUser) {
    return { error: "Email does not exist" };
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  await db.user.update({
    where: {
      id: existingUser.id,
    },
    data: {
      password: hashedPassword,
    },
  });
  await db.passwordResetToken.delete({
    where:{
        id:existingToken.id
    }
  });
  return {success:"Password updated!"}
};
