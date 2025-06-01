/**
 * Next.js Configuration
 * 
 * This module defines the Next.js application configuration.
 * It includes settings for:
 * - Image optimization and domains
 * - Environment variables
 * - Build and development options
 * - Experimental features
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Image Configuration
   * Defines allowed image domains for Next.js Image Optimization
   * 
   * @property {string[]} domains - List of allowed image domains
   * - example.com: Example domain
   * - picsum.photos: Placeholder images
   * - lh3.googleusercontent.com: Google user profile images
   */
  images: {
    domains: [
      'example.com',
      'picsum.photos',
      'lh3.googleusercontent.com'
    ],
  },

  /**
   * Experimental Features
   * Enables experimental Next.js features
   */
  experimental: {
    typedRoutes: true,
  },
}

export default nextConfig 