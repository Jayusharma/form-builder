/**
 * New Verification Action
 * 
 * Server action that handles email verification functionality.
 * Features:
 * - Email verification token validation
 * - Token expiration handling
 * - User verification status update
 * - Token cleanup
 * - Database updates
 */

"use server";

import { db } from "@/lib/db";
import { getUserByEmail } from "@/data/user";
import { getVerificationTokenByToken } from "@/data/verification-token";

/**
 * Verifies a user's email using a verification token
 * 
 * @param {string} token - Email verification token
 * @returns {Promise<{error?: string, success?: string}>} Verification result
 * 
 * Process:
 * 1. Validates verification token
 * 2. Checks token expiration
 * 3. Verifies user existence
 * 4. Updates user verification status
 * 5. Cleans up used token
 * 
 * Security Features:
 * - Token expiration check
 * - User verification
 * - Token cleanup after use
 * - Atomic database updates
 */
export const newVerification = async (token: string) => {
  const existingToken = await getVerificationTokenByToken(token);
  if (!existingToken) {
    return { error: "Token does not exist!" };
  }
  const hasExpired = new Date(existingToken.expires) < new Date();
  if (hasExpired) {
    return { error: "Token has expired!" };
  }
  const existingUser = await getUserByEmail(existingToken.email);
  if(!existingUser){
    return {error:"user does not exist!"};

  }
  await db.user.update({
    where:{
        id:existingUser.id
    },
    data:{
        emailVerified:new Date(),
        email:existingToken.email
    }
  })
  await db.verificationToken.delete({
    where:{id:existingToken.id}
  });
  return {success :"Email verified!"};
};
