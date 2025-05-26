/**
 * Reset Action
 * 
 * Server action that handles password reset requests.
 * Features:
 * - Password reset token generation
 * - Email validation
 * - Reset email delivery
 * - User verification
 * - Error handling
 */

"use server"
import { ResetSchema } from "@/schemas"
import * as z from "zod"
import { getUserByEmail } from "@/data/user"
import { sendPasswordResetEmail } from "@/lib/mail"
import { generatePasswordResetToken } from "@/lib/tokens"

/**
 * Initiates the password reset process for a user
 * 
 * @param {z.infer<typeof ResetSchema>} values - Reset request data
 * @returns {Promise<{error?: string, success?: string}>} Reset request result
 * 
 * Process:
 * 1. Validates email address
 * 2. Verifies user existence
 * 3. Generates reset token
 * 4. Sends reset email
 * 
 * Security Features:
 * - Email validation
 * - User verification
 * - Secure token generation
 * - Rate limiting (handled by email service)
 */
export const reset = async (values:z.infer<typeof ResetSchema>)=>{
const validatedFields =ResetSchema.safeParse(values);
if(!validatedFields.success){
    return {error:"Invalid email"}
}
const {email}= validatedFields.data;
const existingUser = await getUserByEmail(email);
if(!existingUser){
    return {error:"Email not found"}
}

const passwordResetToken = await generatePasswordResetToken(email);
await sendPasswordResetEmail(
    passwordResetToken.email,
    passwordResetToken.token
);

return{success:"Reset email sent "}
}
