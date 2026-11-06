"use client"

import Image from "next/image"
import { Headphones, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface StoryCardData {
  id: number
  title: string
  category: string
  duration: string
  thumbnail: string
  summary?: string
  creators: { name: string }[]
}

interface StoryCardProps {
  story: StoryCardData
  onOpen: () => void
  onShare: (event: React.MouseEvent) => void
  /** Number of narration languages, shown in the meta line. */
  languageCount?: number
  priority?: boolean
  className?: string
}

/**
 * Story card shared by the dashboard and the Story Library.
 * The whole card opens the story; Listen and Share are separate focusable controls.
 */
export function StoryCard({ story, onOpen, onShare, languageCount = 5, priority = false, className }: StoryCardProps) {
  return (
    <article
      className={cn(
        "card-story group flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-card",
        className,
      )}
      onClick={onOpen}
    >
      <div className="story-thumbnail relative aspect-[4/3] overflow-hidden">
        <Image
          src={story.thumbnail || "/placeholder.svg"}
          alt={`Illustration for ${story.title}`}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="eyebrow mb-2">
          {story.category} · {story.duration} · {languageCount} languages
        </p>
        <h3 className="font-serif text-2xl font-medium leading-tight">{story.title}</h3>
        {story.summary && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{story.summary}</p>
        )}
        <p className="mt-3 text-sm text-muted-foreground">
          by {story.creators.map((creator) => creator.name).join(", ")}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <Button
            onClick={(event) => {
              event.stopPropagation()
              onOpen()
            }}
            className="gap-2 px-5"
            aria-label={`Listen to ${story.title}`}
          >
            <Headphones className="h-4 w-4" aria-hidden="true" />
            Listen
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(event) => {
              event.stopPropagation()
              onShare(event)
            }}
            aria-label={`Share ${story.title}`}
            className="text-muted-foreground hover:text-foreground"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </article>
  )
}
