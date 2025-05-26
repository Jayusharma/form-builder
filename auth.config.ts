/**
 * NextAuth Configuration
 * 
 * This module defines the authentication providers and configuration for NextAuth.js.
 * It includes:
 * - OAuth providers (Google, GitHub)
 * - Credentials provider for email/password login
 * - Password hashing and validation
 * - User authentication logic
 */

import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { LoginSchema } from "@/schemas";
import { getUserByEmail } from "./data/user";
import bcrypt from "bcryptjs";
import Github from "next-auth/providers/github";
import Google from "next-auth/providers/google";

/**
 * NextAuth Configuration Object
 * Defines authentication providers and their settings
 */
export default {
  providers: [
    /**
     * Google OAuth Provider
     * Enables sign-in with Google accounts
     * Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables
     */
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    /**
     * GitHub OAuth Provider
     * Enables sign-in with GitHub accounts
     * Requires GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables
     */
    Github({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),

    /**
     * Credentials Provider
     * Handles email/password authentication
     * 
     * @param {Object} credentials - User credentials
     * @returns {Promise<User|null>} Authenticated user or null
     */
    Credentials({
      async authorize(credentials) {
        // Validate credentials against schema
        const validatedFeilds = LoginSchema.safeParse(credentials);

        if (validatedFeilds.success) {
          const { email, password } = validatedFeilds.data;

          // Find user and verify password
          const user = await getUserByEmail(email);
          if (!user || !user.password) return null;

          // Compare password hash
          const passwordMatch = await bcrypt.compare(password, user.password);
          if (passwordMatch) return user;
        }
        return null;
      },
    }),
  ],
} satisfies NextAuthConfig;
