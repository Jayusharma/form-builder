/**
 * Login Action
 * 
 * Server action that handles user authentication with the following features:
 * - Email/password authentication
 * - Two-factor authentication (2FA)
 * - Email verification
 * - Password validation
 * - Session management
 * - OAuth integration
 * - Error handling
 */

"use server";

import * as z from "zod";
import { LoginSchema } from "@/schemas";
import { signIn } from "@/auth";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { AuthError } from "next-auth";
import { generateVerificationToken } from "@/lib/tokens";
import { getUserByEmail } from "@/data/user";
import { sendVerificationEmail, sendTwoFactorTokenEmail } from "@/lib/mail";
import { getTwoFactorTokenByEmail } from "@/data/two-factor-token";
import { generateTwoFactorToken } from "@/lib/tokens";
import { db } from "@/lib/db";
import { getTwoFactorConfirmationByUserID } from "@/data/two-factor-confirmation";
import bcrypt from "bcryptjs";

/**
 * Authenticates a user and manages their login session
 * 
 * @param {z.infer<typeof LoginSchema>} values - Login credentials and optional 2FA code
 * @param {string | null} [callbackUrl] - Optional URL to redirect after successful login
 * @returns {Promise<{error?: string, success?: string, twoFactor?: boolean}>} Login result
 * 
 * Authentication Flow:
 * 1. Validates login credentials
 * 2. Verifies user existence and email verification
 * 3. Validates password
 * 4. Handles 2FA if enabled
 * 5. Creates user session
 * 6. Manages redirects
 * 
 * Error Cases:
 * - Invalid credentials
 * - Unverified email
 * - Invalid 2FA code
 * - Expired 2FA token
 * - Server errors
 */
export const login = async (values: z.infer<typeof LoginSchema>, callbackUrl?: string | null) => {
  const Validate = LoginSchema.safeParse(values);
  if (!Validate.success) {
    return { error: "invalid fileds" };
  }
  const { email, password, code } = Validate.data;

  const existingUser = await getUserByEmail(email);
  if (!existingUser || !existingUser.email || !existingUser.password) {
    return { error: "Email does not exist!" };
  }

  if (!existingUser.emailVerified) {
    const verificationToken = await generateVerificationToken(
      existingUser.email
    );
    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token
    );
    return { success: "Confirmation email sent!" };
  }

  // First verify password using bcrypt
  const passwordMatch = await bcrypt.compare(password, existingUser.password);
  if (!passwordMatch) {
    return { error: "Invalid Credentials!" };
  }

  // If password is correct, handle 2FA if enabled
  if (existingUser.isTwoFactorEnabled && existingUser.email) {
    if (code) {
      const twofactorToken = await getTwoFactorTokenByEmail(existingUser.email);
      if (!twofactorToken) {
        return { error: "Invalid code!" };
      }
      if (twofactorToken.token !== code) {
        return { error: "Invalid code!" };
      }
      const hasExpired = new Date(twofactorToken.expires) < new Date();
      if (hasExpired) {
        return { error: "Code expired!" };
      }
      await db.twoFactorToken.delete({
        where: {
          id: twofactorToken.id,
        },
      });
      const existingConfirmation = await getTwoFactorConfirmationByUserID(
        existingUser.id
      );
      if (existingConfirmation) {
        await db.twofactorConfirmation.delete({
          where: {
            id: existingConfirmation.id,
          },
        });
      }
      await db.twofactorConfirmation.create({
        data:{
          userId:existingUser.id,
        }
      });
    } else {
      const twoFactorToken = await generateTwoFactorToken(existingUser.email);
      await sendTwoFactorTokenEmail(twoFactorToken.email, twoFactorToken.token);
      return { twoFactor: true };
    }
  }

  // If we get here, either 2FA is not enabled or 2FA code was verified
  // Now we can complete the login
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl || DEFAULT_LOGIN_REDIRECT,
    });
    return { success: "Login successful" };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Something went wrong during login!" };
    }
    throw error;
  }
};
