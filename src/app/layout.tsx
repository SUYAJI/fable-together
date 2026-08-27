import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { NavigationProgress } from "@/components/navigation-progress"
import { PageWrapper } from "@/components/page-wrapper"
import { Toaster } from "@/components/ui/toaster"
import { isDemoMode } from "@/lib/app-mode"
import "../styles/globals.css"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
const title = "Fable Together | Interactive Storytelling Demo"
const description =
  "Explore personalized stories, narration voices, translations, and family storytelling in an interactive reconstruction of Fable Together."
const socialImage = siteUrl ? `${siteUrl.replace(/\/$/, "")}/enchanted-forest-story.jpg` : undefined

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: {
    default: title,
    template: "%s | Fable Together",
  },
  description,
  keywords: [
    "family stories",
    "personalized storytelling",
    "story narration",
    "multilingual stories",
    "interactive demo",
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
    siteName: "Fable Together",
    title,
    description,
    ...(siteUrl ? { url: siteUrl } : {}),
    ...(socialImage
      ? {
          images: [
            {
              url: socialImage,
              alt: "An illustrated scene from the Fable Together story library",
            },
          ],
        }
      : {}),
  },
  twitter: {
    card: socialImage ? "summary_large_image" : "summary",
    title,
    description,
    ...(socialImage ? { images: [socialImage] } : {}),
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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const demoMode = isDemoMode()

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#f97316" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1a1a1a" media="(prefers-color-scheme: dark)" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{
          fontFamily:
            'var(--font-geist-sans), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
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
            <PageWrapper>{children}</PageWrapper>
          </Suspense>
          <NavigationProgress />
          <Toaster />
          {!demoMode && (
            <Analytics mode={process.env.NODE_ENV === "production" ? "production" : "development"} />
          )}
        </ThemeProvider>
      </body>
    </html>
  )
}
