import { generatePageMetadata } from "@/lib/metadata"

export const metadata = generatePageMetadata({
  title: "Voice Library",
  description: "Preview and choose narration voices for stories in Fable Together.",
  path: "/voices",
  keywords: ["voices", "voice library", "story narration", "browser speech"],
})

export default function VoicesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}









