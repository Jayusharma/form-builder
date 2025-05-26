/**
 * Logout Action
 * 
 * Server action that handles user session termination.
 * Features:
 * - Secure session termination
 * - OAuth session cleanup
 * - Server-side session invalidation
 */

"use server";
import { signOut } from "@/auth";

/**
 * Terminates the current user session
 * 
 * @returns {Promise<void>} Resolves when logout is complete
 * 
 * Process:
 * 1. Invalidates server-side session
 * 2. Clears client-side session data
 * 3. Handles OAuth provider logout if applicable
 */
export const logout = async () => {
  await signOut();
};
