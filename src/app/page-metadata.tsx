export function HomePageStructuredData() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")

  if (!siteUrl) return null

  const webApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Fable Together",
    url: siteUrl,
    applicationCategory: "EntertainmentApplication",
    operatingSystem: "Web Browser",
    description:
      "An interactive reconstruction of Fable Together featuring personalized stories, selectable narration voices, and stored translations.",
    featureList: [
      "Story discovery",
      "Selectable narration voices",
      "Browser speech narration",
      "Stored story translations",
      "Local demo progress",
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationSchema) }}
    />
  )
}
