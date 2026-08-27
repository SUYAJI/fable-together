import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")
  if (!baseUrl) return []

  const routes = [
    "",
    "/dashboard",
    "/stories",
    "/voices",
    "/voices/clone",
    "/quests",
    "/settings",
    "/profile",
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.8,
  }))
}
