/**
 * Sitemap Generation
 * 
 * Generates XML sitemap for search engine crawlers.
 * Helps search engines discover and index all public pages.
 * 
 * Automatically served at /sitemap.xml
 */

import { MetadataRoute } from 'next'

/**
 * Generates sitemap for all public routes
 * 
 * @returns Sitemap array with URLs, priorities, and change frequencies
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://app.fabletogether.com'

  const routes = [
    '', // Home page
    '/dashboard',
    '/stories',
    '/voices',
    '/voices/clone',
    '/quests',
    '/settings',
    '/profile',
    '/sign-in',
    '/auth/landing',
    '/creator', // FAQ page
    '/insights',
    '/community',
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly' as const,
    priority: route === '' ? 1 : 0.8,
  }))
}

