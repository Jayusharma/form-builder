/**
 * Authentication Middleware
 * 
 * This module implements route protection and authentication middleware.
 * It handles:
 * - Route access control
 * - Authentication state management
 * - Redirect logic for protected routes
 * - Public and private route handling
 */

import authConfig from "@/auth.config";
import NextAuth from "next-auth";
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
} from "@/routes";

// Initialize NextAuth middleware
const { auth } = NextAuth(authConfig);

/**
 * Authentication Middleware Function
 * Protects routes and manages authentication state
 * 
 * @param {Object} req - Next.js request object
 * @returns {Response|undefined} Redirect response or undefined
 */
export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);

  // Allow API authentication routes
  if (isApiAuthRoute) {
    return;
  }

  // Handle authentication routes
  if (isAuthRoute) {
    if (isLoggedIn) {
      // Redirect authenticated users away from auth pages
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return;
  }

  // Protect private routes
  if (!isLoggedIn && !isPublicRoute) {
    // Preserve the callback URL for post-login redirect
    let callbackUrl = nextUrl.pathname;
    if(nextUrl.search){
      callbackUrl += nextUrl.search;
    }
    const encodedCallbakUrl = encodeURIComponent(callbackUrl);
    return Response.redirect(
      new URL(`/auth/login?callbackUrl=${encodedCallbakUrl}`, nextUrl)
    );
  }

  return;
});

/**
 * Middleware Configuration
 * Defines which routes should be processed by the middleware
 */
export const config = {
  matcher: [
    // Skip Next.js internals and static files
    // Excludes common static file extensions
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always process API routes
    "/(api|trpc)(.*)",
  ],
};
