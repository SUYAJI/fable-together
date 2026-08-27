import type { Metadata } from "next"

interface PageMetadataOptions {
  title: string
  description: string
  path?: string
  keywords?: string[]
  noIndex?: boolean
}

export function generatePageMetadata({
  title,
  description,
  path = "/",
  keywords = [],
  noIndex = false,
}: PageMetadataOptions): Metadata {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")
  const url = siteUrl ? `${siteUrl}${path}` : undefined
  const socialImage = siteUrl ? `${siteUrl}/enchanted-forest-story.jpg` : undefined

  return {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    openGraph: {
      title,
      description,
      siteName: "Fable Together",
      type: "website",
      ...(url ? { url } : {}),
      ...(socialImage
        ? {
            images: [
              {
                url: socialImage,
                alt: title,
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
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
        },
    ...(url ? { alternates: { canonical: url } } : {}),
  }
}
