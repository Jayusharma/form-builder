/**
 * Authentication Middleware
 * 
 * This module implements route protection and authentication middleware.
 * It handles:
 * - Route access control
 * - Authentication state management
 * - Redirect logic for protected routes
 * - Public and private route handling
 * - Locale detection and routing
 */

import authConfig from "@/auth.config";
import NextAuth from "next-auth";
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
} from "@/routes";
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { i18n } from './lib/i18n-config'
import type { Locale } from './lib/i18n-config'
import { match as matchLocale } from '@formatjs/intl-localematcher'
import Negotiator from 'negotiator'

// Initialize NextAuth middleware
const { auth } = NextAuth(authConfig);

function getLocale(request: NextRequest): Locale {
  // First try to get the locale from the cookie
  const storedLocale = request.cookies.get('preferredLanguage')?.value;
  if (storedLocale && i18n.locales.includes(storedLocale as Locale)) {
    return storedLocale as Locale;
  }

  // If no cookie or invalid locale, use negotiator
  const negotiatorHeaders: Record<string, string> = {}
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value))

  const languages = new Negotiator({ headers: negotiatorHeaders }).languages()

  try {
    const locale = matchLocale(languages, i18n.locales, i18n.defaultLocale)
    return locale as Locale
  } catch (e) {
    return i18n.defaultLocale
  }
}

export default auth(async (req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // Get the current locale from the URL if it exists
  const currentLocale = nextUrl.pathname.split('/')[1];
  const hasValidLocale = i18n.locales.includes(currentLocale as Locale);

  // Check if it's an auth route by removing locale prefix if present
  const pathnameWithoutLocale = hasValidLocale 
    ? nextUrl.pathname.replace(`/${currentLocale}`, '') 
    : nextUrl.pathname;
  const isAuthRoute = authRoutes.includes(pathnameWithoutLocale);
  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isApiRoute = nextUrl.pathname.startsWith('/api/');
  const isPublicRoute = publicRoutes.includes(pathnameWithoutLocale);

  // Allow API authentication routes
  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // Handle API routes
  if (isApiRoute) {
    if (!isLoggedIn && !isPublicRoute) {
      return new Response("Unauthorized", { status: 401 });
    }
    return NextResponse.next();
  }

  // If the path has an invalid locale, redirect to the preferred locale
  if (currentLocale && !hasValidLocale) {
    const locale = getLocale(req);
    const newPath = `/${locale}${nextUrl.pathname}`;
    return NextResponse.redirect(new URL(newPath, req.url));
  }

  // For paths without a locale prefix, add the preferred locale
  if (!currentLocale || !hasValidLocale) {
    const locale = getLocale(req);
    return NextResponse.redirect(new URL(`/${locale}${nextUrl.pathname}`, req.url));
  }

  // Create response to set/update cookie
  const response = NextResponse.next();

  // Update language preference cookie if needed
  if (!req.cookies.has('preferredLanguage') || currentLocale !== req.cookies.get('preferredLanguage')?.value) {
    response.cookies.set('preferredLanguage', currentLocale, {
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });
  }

  // Handle authentication routes
  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(`/${currentLocale}${DEFAULT_LOGIN_REDIRECT}`, req.url));
    }
    return response;
  }

  // Protect private routes
  if (!isLoggedIn && !isPublicRoute) {
    const callbackUrl = nextUrl.pathname + nextUrl.search;
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    return NextResponse.redirect(new URL(`/${currentLocale}/auth/login?callbackUrl=${encodedCallbackUrl}`, req.url));
  }

  return response;
});

/**
 * Middleware Configuration
 * Defines which routes should be processed by the middleware
 */
export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Process API routes
    "/api/:path*",
    // Process all paths that should be internationalized
    '/((?!api|_next|.*\\..*).*)'
  ],
};
