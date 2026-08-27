import { generatePageMetadata } from "@/lib/metadata"

export const metadata = generatePageMetadata({
  title: "Story Library",
  description: "Browse the Fable Together story library and listen with selectable voices and stored translations.",
  path: "/stories",
  keywords: ["stories", "story library", "story narration", "children's stories", "audio stories"],
})

export default function StoriesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}









