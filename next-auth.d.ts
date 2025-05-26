/**
 * NextAuth Type Definitions
 * 
 * This module extends the default NextAuth types to include custom user properties
 * and session data. It adds support for:
 * - Custom user roles
 * - Two-factor authentication status
 * - OAuth provider information
 * - Additional user metadata
 */

import { type DefaultSession } from "next-auth";
import { UserRole } from "@prisma/client";

export type ExtendedUser = DefaultSession["user"] & {
  id: string;
  role: UserRole;
  isTwoFactorEnabled: boolean;
  isOAuth: boolean;
  adminCode?: string;
};

declare module "next-auth" {
  interface User extends ExtendedUser {}
  
  interface Session {
    user: ExtendedUser;
  }
}

/**
 * Extended Session Interface
 * Augments the default NextAuth session with custom user properties
 */
declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
  }
}