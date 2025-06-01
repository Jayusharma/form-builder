/**
 * Route Configuration
 * Defines public, protected, and authentication routes
 */

export const publicRoutes = [
    "/",
    "/auth/new-verification",
    "/api/trending",
    "/api/featured-authors", // Add this line
];

export const authRoutes = [
    "/auth/login",
    "/auth/register",
    "/auth/error",
    "/auth/reset",
    "/auth/new-password",
    // Add localized versions
    "/en/auth/login",
    "/en/auth/register",
    "/en/auth/error",
    "/en/auth/reset",
    "/en/auth/new-password",
    "/es/auth/login",
    "/es/auth/register",
    "/es/auth/error",
    "/es/auth/reset",
    "/es/auth/new-password"
];

export const apiAuthPrefix = "/api/auth";

export const DEFAULT_LOGIN_REDIRECT = "/profile";

