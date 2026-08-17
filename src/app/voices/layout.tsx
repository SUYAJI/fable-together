import { generatePageMetadata } from "@/lib/metadata"

export const metadata = generatePageMetadata({
  title: "Voice Library",
  description: "Discover and manage voices for your stories. Browse preset voices and your cloned voices. Preview how they sound before using them.",
  path: "/voices",
  keywords: ["voices", "voice library", "voice cloning", "text to speech", "AI voices"],
})

export default function VoicesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}









