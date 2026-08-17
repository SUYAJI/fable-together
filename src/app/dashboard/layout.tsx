import { generatePageMetadata } from "@/lib/metadata"

export const metadata = generatePageMetadata({
  title: "Dashboard",
  description: "Your Fable Together dashboard. View your stories, quests, and family activity. Start your storytelling journey here.",
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









