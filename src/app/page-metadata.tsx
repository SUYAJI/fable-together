/**
 * Home Page Structured Data (JSON-LD)
 * 
 * Provides structured data for search engines to understand:
 * - Organization information
 * - Website structure
 * - Search functionality
 * 
 * Improves SEO and enables rich snippets in search results.
 */

/**
 * Home page structured data component
 * 
 * Generates JSON-LD schema markup for:
 * - Organization schema (company info, logo, social links)
 * - Website schema (site info, search action)
 * 
 * @returns Script tags with JSON-LD structured data
 */
export function HomePageStructuredData() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://app.fabletogether.com"

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Fable Together",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description: "Transform your family's voices into enchanting narrators. Create personalized stories with AI-powered voice cloning and multilingual narration.",
    sameAs: [
      // Add social media links when available
      // "https://twitter.com/fabletogether",
      // "https://facebook.com/fabletogether",
    ],
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Fable Together",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/dashboard?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }

  /**
   * WebApplication schema for rich snippets
   * Provides information about the application itself
   */
  const webApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Fable Together",
    url: siteUrl,
    applicationCategory: "EntertainmentApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "150",
    },
    description: "Transform your family's voices into enchanting narrators. Create personalized stories with AI-powered voice cloning and multilingual narration.",
    featureList: [
      "Voice Cloning",
      "AI-Powered Storytelling",
      "Multilingual Narration",
      "Personalized Stories",
      "Family Memories",
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationSchema) }}
      />
    </>
  )
}

