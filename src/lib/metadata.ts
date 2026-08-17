/**
 * Metadata Generation Utility
 * 
 * Generates page-specific metadata for SEO optimization.
 * Creates consistent metadata structure with Open Graph and Twitter Card support.
 * 
 * Used by page layouts to generate dynamic metadata for each route.
 */

import type { Metadata } from "next"

/**
 * Options for generating page metadata
 */
interface PageMetadataOptions {
  title: string
  description: string
  path?: string
  keywords?: string[]
  noIndex?: boolean
}

/**
 * Generate page metadata with SEO optimization
 * 
 * Creates metadata including:
 * - Page title and description
 * - Open Graph tags for social sharing
 * - Twitter Card configuration
 * - Canonical URLs
 * - Robots directives
 * 
 * @param options - Metadata generation options
 * @returns Metadata object for Next.js
 * 
 * @example
 * export const metadata = generatePageMetadata({
 *   title: "Story Library",
 *   description: "Browse magical stories",
 *   path: "/stories",
 *   keywords: ["stories", "library"]
 * })
 */
export function generatePageMetadata({
  title,
  description,
  path = "/",
  keywords = [],
  noIndex = false,
}: PageMetadataOptions): Metadata {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://app.fabletogether.com"
  const url = `${siteUrl}${path}`

  return {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    openGraph: {
      title,
      description,
      url,
      siteName: "Fable Together",
      type: "website",
      images: [
        {
          url: `${siteUrl}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${siteUrl}/og-image.jpg`],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
        },
    alternates: {
      canonical: url,
    },
  }
}









