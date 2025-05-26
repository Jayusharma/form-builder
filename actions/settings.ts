/**
 * Settings Action
 * 
 * Server action that handles user settings updates.
 * Features:
 * - User profile updates
 * - Email change verification
 * - Password updates
 * - 2FA management
 * - OAuth account handling
 * - Security validation
 */

"use server";
import * as z from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { SettingsSchema } from "@/schemas";
import { getUserByEmail, getUserById } from "@/data/user";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
import bcrypt from "bcryptjs";

/**
 * Updates user settings and profile information
 * 
 * @param {z.infer<typeof SettingsSchema>} values - Updated settings data
 * @returns {Promise<{error?: string, success?: string}>} Update result
 * 
 * Process:
 * 1. Verifies user authentication
 * 2. Validates user existence
 * 3. Handles OAuth restrictions
 * 4. Processes email changes
 * 5. Updates password if provided
 * 6. Applies settings updates
 * 
 * Security Features:
 * - Authentication verification
 * - Password validation
 * - Email verification
 * - OAuth protection
 * - Data validation
 * 
 * Note: OAuth users have restricted update capabilities
 * for security-sensitive fields
 */
export const settings = async (values: z.infer<typeof SettingsSchema>) => {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  const dbUser = await getUserById(session.user.id);
  if (!dbUser) {
    return { error: "Unauthorized" };
  }

  if (session.user.isOAuth) {
    values.email = undefined;
    values.password = undefined;
    values.Newpassword = undefined;
    values.isTwoFactorEnabled = undefined;
  }

  if (values.email && values.email !== session.user.email) {
    const existingUser = await getUserByEmail(values.email);
    if (existingUser && existingUser.id !== session.user.id) {
      return { error: "Email already in use!" };
    }
    const verificationToken = await generateVerificationToken(values.email);
    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token
    );
    return { success: "Verification email sent!" };
  }

  if (values.password && values.Newpassword && dbUser.password) {
    const passwordMatch = await bcrypt.compare(
      values.password,
      dbUser.password
    );
    if (!passwordMatch) {
      return { error: "Incorrect password!" };
    }
    const hashedPassowrd = await bcrypt.hash(values.Newpassword, 10);
    values.password = hashedPassowrd;
    values.Newpassword = undefined;
  }

  await db.user.update({
    where: { id: session.user.id },
    data: {
      ...values,
    },
  });
  return { success: "Settings Updated!" };
};
