/**
 * NextAuth Configuration and Authentication Setup
 * 
 * This module configures NextAuth.js for authentication, including:
 * - Custom sign-in pages and error handling
 * - OAuth and credentials providers
 * - Session management with JWT strategy
 * - Two-factor authentication support
 * - Role-based access control
 * - Account linking and email verification
 */
import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import { UserRole } from "@prisma/client";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "./lib/db";
import { getUserById } from "./data/user";
import { getTwoFactorConfirmationByUserID } from "@/data/two-factor-confirmation";
import { getAccountByUserId } from "./data/accounts";

export const { auth, handlers, signIn, signOut } = NextAuth({
  // Custom pages for authentication flows
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },

  // Event handlers for authentication events
  events: {
    /**
     * Handles account linking events
     * Automatically verifies email when an OAuth account is linked
     */
    async linkAccount({ user }) {
      await db.user.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date(),
        },
      });
    },
  },

  // Authentication callbacks
  callbacks: {
    /**
     * Sign-in callback
     * Handles authentication logic including:
     * - Credentials validation
     * - Email verification check
     * - Two-factor authentication
     * 
     * @param {Object} params - Sign-in parameters
     * @returns {Promise<boolean>} Whether sign-in is allowed
     */
    async signIn({ user, account }) {
      // Allow OAuth sign-ins to proceed
      if (account?.provider !== "credentials") return true;
      if (!user.id) return false;

      // Check email verification
      const existingUser = await getUserById(user.id);
      if (!existingUser?.emailVerified) return false;

      // Handle two-factor authentication
      if (existingUser.isTwoFactorEnabled) {
        const twoFactorConfirmation = await getTwoFactorConfirmationByUserID(
          existingUser.id
        );
        if (!twoFactorConfirmation) return false;
        // Clean up 2FA confirmation after successful sign-in
        await db.twofactorConfirmation.delete({
          where: {
            id: twoFactorConfirmation.id,
          },
        });
      }
      return true;
    },

    /**
     * Session callback
     * Enriches the session with user data including:
     * - User ID
     * - Role
     * - Two-factor status
     * - OAuth status
     * 
     * @param {Object} params - Session parameters
     * @returns {Promise<Session>} Enhanced session object
     */
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (token.role && session.user) {
        session.user.role = token.role as UserRole;
      }
      if (session.user) {
        session.user.isTwoFactorEnabled = token.isTwoFactorEnabled as boolean;
      }
      if (session.user) {
        session.user.name = token.name;
        session.user.email = token.email as string;
        session.user.isOAuth = token.isOAuth as boolean;
      
      }
      return session;
    },

    /**
     * JWT callback
     * Enhances the JWT token with user data
     * 
     * @param {Object} params - JWT parameters
     * @returns {Promise<JWT>} Enhanced JWT token
     */
    async jwt({ token }) {
      if (!token.sub) return token;

      // Fetch and attach user data to token
      const existingUser = await getUserById(token.sub);
      if (!existingUser) {
        // Use undefined instead of null for sub
        token.isDeletedUser = true;
        token.sub = undefined;  // This will fail auth checks while maintaining type safety
        token.name = undefined;
        token.email = undefined;
        token.role = undefined;
        token.isTwoFactorEnabled = false;
        token.points = 0;
        token.isDeleted = true; // Optional flag to track deleted status
        
        return token;
      }
      const existingAccount = await getAccountByUserId(existingUser.id);
      
      // Add user data to token
      token.isOAuth = !!existingAccount;
      token.name = existingUser.name;
      token.email = existingUser.email;
      token.role = existingUser.role;
      token.isTwoFactorEnabled = existingUser.isTwoFactorEnabled;
      return token;
    },
  },

  // Use Prisma adapter for database integration
  adapter: PrismaAdapter(db),
  // Use JWT strategy for session management
  session: { strategy: "jwt" },
  // Merge with additional auth configuration
  ...authConfig,
});
