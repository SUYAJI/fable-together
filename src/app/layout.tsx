/**
 * Root Layout Component
 * 
 * Main layout wrapper for the entire application. Provides:
 * - Global metadata and SEO configuration
 * - Font loading (Geist Sans and Geist Mono)
 * - Theme provider for light/dark mode
 * - Analytics integration
 * - Error boundaries and navigation progress
 * - Accessibility features (skip links, ARIA labels)
 * 
 * This is the root component that wraps all pages in the application.
 */

import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { NavigationProgress } from "@/components/navigation-progress"
import { PageWrapper } from "@/components/page-wrapper"
import { Toaster } from "@/components/ui/toaster"
import { SuppressConsoleErrors } from "@/components/suppress-console-errors"
import "../styles/globals.css";

/**
 * Primary font - Geist Sans
 * Used for body text, headings, and UI elements
 * Loads with font-display: swap for optimal performance
 */
const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
})

/**
 * Monospace font - Geist Mono
 * Used for code blocks, technical content, and monospace text
 * Loads with font-display: swap for optimal performance
 */
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
})

/**
 * Global metadata configuration for SEO
 * 
 * Includes:
 * - Page titles and descriptions
 * - Open Graph tags for social sharing
 * - Twitter Card configuration
 * - Keywords for search optimization
 * - Robots directives for crawlers
 */
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://app.fabletogether.com'),
  title: {
    default: "Fable Together - Create Magical Stories with Your Family",
    template: "%s | Fable Together"
  },
  description: "Transform your family's voices into enchanting narrators. Create personalized stories with AI-powered voice cloning and multilingual narration. Perfect for families who want to preserve memories through storytelling.",
  keywords: [
    "family stories",
    "voice cloning",
    "AI narration",
    "personalized stories",
    "storytelling platform",
    "family memories",
    "text to speech",
    "multilingual stories",
    "children's stories",
    "audio stories"
  ],
  authors: [{ name: "Fable Together" }],
  creator: "Fable Together",
  publisher: "Fable Together",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Fable Together",
    title: "Fable Together - Create Magical Stories with Your Family",
    description: "Transform your family's voices into enchanting narrators. Create personalized stories with AI-powered voice cloning and multilingual narration.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Fable Together - AI-Powered Family Storytelling",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fable Together - Create Magical Stories with Your Family",
    description: "Transform your family's voices into enchanting narrators. Create personalized stories with AI-powered voice cloning.",
    images: ["/og-image.jpg"],
    creator: "@fabletogether",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
}

/**
 * Root layout component
 * 
 * Wraps all pages with:
 * - HTML structure and language
 * - Theme provider for dark/light mode
 * - Page transitions wrapper
 * - Analytics tracking
 * - Toast notifications
 * - Navigation progress indicator
 * 
 * @param children - Page content to render
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#f97316" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1a1a1a" media="(prefers-color-scheme: dark)" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
        {/* Structured Data (JSON-LD) for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Fable Together",
              "description": "Transform your family's voices into enchanting narrators. Create personalized stories with AI-powered voice cloning and multilingual narration.",
              "url": process.env.NEXT_PUBLIC_SITE_URL || "https://app.fabletogether.com",
              "applicationCategory": "EntertainmentApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "150"
              },
              "featureList": [
                "Voice Cloning",
                "AI-Powered Storytelling",
                "Multilingual Narration",
                "Family Story Collection",
                "Personalized Audio Stories"
              ]
            })
          }}
        />
        {/* Skip to main content link for keyboard navigation */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Skip to main content
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
          storageKey="theme"
        >
          <Suspense fallback={null}>
            <PageWrapper>
              {children}
            </PageWrapper>
          </Suspense>
          <NavigationProgress />
          <Toaster />
          <SuppressConsoleErrors />
          <Analytics mode={process.env.NODE_ENV === 'production' ? 'production' : 'development'} />
        </ThemeProvider>
      </body>
    </html>
  )
}
