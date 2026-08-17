import { generatePageMetadata } from "@/lib/metadata"

export const metadata = generatePageMetadata({
  title: "Story Library",
  description: "Browse and discover magical stories brought to life with AI narration. Filter by category and listen to stories in multiple languages.",
  path: "/stories",
  keywords: ["stories", "story library", "AI narration", "children's stories", "audio stories"],
})

export default function StoriesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}









