"use client"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface DiscoverStoriesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const sampleStories = [
  {
    id: 1,
    title: "Luna's Moonbeam Journey",
    author: "DreamWeaver Tales",
    rating: 4.9,
    duration: "6 min",
    priceTokens: 12,
    tags: ["Bedtime", "Dreams"],
    thumbnail: "/moonbeam.jpg",
  },
  {
    id: 2,
    title: "The Enchanted Forest Adventure",
    author: "StoryTeller Studios",
    rating: 4.8,
    duration: "8 min",
    priceTokens: 15,
    tags: ["Adventure", "Magic"],
    thumbnail: "/enchanted-forest.png",
  },
  {
    id: 3,
    title: "Captain Whiskers' Pirate Quest",
    author: "Ocean Stories Co.",
    rating: 4.7,
    duration: "10 min",
    priceTokens: 18,
    tags: ["Adventure", "Animals"],
    thumbnail: "/pirate-ship.jpg",
  },
]

const allThemes = ["all", "Adventure", "Bedtime", "Fantasy", "Educational"]
const allLangs = ["all", "English", "Spanish", "French", "German"]

export function DiscoverStoriesModal({ open, onOpenChange }: DiscoverStoriesModalProps) {
  const [q, setQ] = useState("")
  const [theme, setTheme] = useState("all")
  const [lang, setLang] = useState("all")
  const [sortBy, setSortBy] = useState<"relevance" | "rating" | "price" | "duration" | "newest">("relevance")
  const [minRating, setMinRating] = useState(0)
  const [maxDuration, setMaxDuration] = useState(60)
  const [maxPrice, setMaxPrice] = useState(100)

  const onPlayPreview = (id: number) => {
    // Play preview functionality placeholder
  }

  const onAddToLibrary = (id: number) => {
    // Add to library functionality placeholder
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-8 gap-0">
        <div className="flex flex-col h-full">
          <h2 className="text-4xl font-bold mb-6">Discover More Stories</h2>

          <div className="grid gap-4 md:grid-cols-12 mb-6">
            <input
              className="rounded-xl border border-border bg-background px-4 py-2.5 text-base text-foreground md:col-span-4"
              placeholder="Search title, author, theme, language…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search stories"
            />
            <select
              className="rounded-xl border border-border bg-background px-4 py-2.5 text-base text-foreground md:col-span-3"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              aria-label="Filter by theme"
            >
              {allThemes.map((t) => (
                <option key={t} value={t}>
                  {t === "all" ? "All themes" : t}
                </option>
              ))}
            </select>
            <select
              className="rounded-xl border border-border bg-background px-4 py-2.5 text-base text-foreground md:col-span-3"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              aria-label="Filter by language"
            >
              {allLangs.map((l) => (
                <option key={l} value={l}>
                  {l === "all" ? "All languages" : l}
                </option>
              ))}
            </select>
            <select
              className="rounded-xl border border-border bg-background px-4 py-2.5 text-base text-foreground md:col-span-2"
              value={sortBy}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onChange={(e) => setSortBy(e.target.value as any)}
              aria-label="Sort"
            >
              <option value="relevance">Sort: Relevance</option>
              <option value="rating">Sort: Rating</option>
              <option value="price">Sort: Price</option>
              <option value="duration">Sort: Duration</option>
              <option value="newest">Sort: Newest</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="space-y-2">
              <label className="whitespace-nowrap text-sm font-medium text-muted-foreground">
                Min rating: {minRating.toFixed(1)}
              </label>
              <input
                type="range"
                min={0}
                max={5}
                step={0.1}
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="w-full accent-neutral-900"
              />
            </div>
            <div className="space-y-2">
              <label className="whitespace-nowrap text-sm font-medium text-muted-foreground">
                Max duration: {maxDuration} min
              </label>
              <input
                type="range"
                min={1}
                max={60}
                step={1}
                value={maxDuration}
                onChange={(e) => setMaxDuration(Number(e.target.value))}
                className="w-full accent-neutral-900"
              />
            </div>
            <div className="space-y-2">
              <label className="whitespace-nowrap text-sm font-medium text-muted-foreground">
                Max price: {maxPrice} tokens
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-neutral-900"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto -mx-2 px-2">
            <div className="space-y-6">
              {sampleStories.map((st) => (
                <div
                  key={st.id}
                  className="flex items-start gap-6 rounded-2xl border border-border bg-card p-6 text-card-foreground transition-colors hover:border-primary/30"
                >
                  <div className="relative w-36 h-36 rounded-xl overflow-hidden flex-shrink-0">
                    <Image
                      src={st.thumbnail || "/placeholder.svg"}
                      alt={`${st.title} story cover image`}
                      fill
                      className="object-cover"
                      sizes="144px"
                    />
                  </div>
                  <div className="flex-1 min-w-0 pt-2">
                    <h3 className="font-bold text-2xl mb-2">{st.title}</h3>
                    <p className="mb-3 text-base text-muted-foreground">by {st.author}</p>
                    <div className="mb-4 flex items-center gap-3 text-base text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="text-yellow-500">⭐</span>
                        <span className="font-medium">{st.rating}</span>
                      </span>
                      <span>•</span>
                      <span>{st.duration}</span>
                    </div>
                    <div className="flex gap-2">
                      {st.tags.map((t) => (
                        <span key={t} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 pt-2">
                    <div className="min-w-[80px] text-right text-base font-medium text-card-foreground">
                      {st.priceTokens} tokens
                    </div>
                    <button
                      onClick={() => onPlayPreview(st.id)}
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                      aria-label={`Preview ${st.title}`}
                    >
                      ▶
                    </button>
                    <button
                      onClick={() => onAddToLibrary(st.id)}
                      className="rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
