import { generatePageMetadata } from "@/lib/metadata"

export const metadata = generatePageMetadata({
  title: "Dashboard",
  description: "Explore sample stories, quests, narration voices, and family activity in Fable Together.",
  path: "/dashboard",
  keywords: ["dashboard", "stories", "quests", "family stories"],
})

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}









