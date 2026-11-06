"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft } from "lucide-react"
import { StoryNarrationControls } from "@/components/story-narration-controls"
import Image from "next/image"
import { useEffect } from "react"
import { isDemoMode } from "@/lib/app-mode"
import { recordDemoAction } from "@/lib/services/demo/state"

interface Creator {
  id: string
  name: string
  role: "Author" | "Illustrator" | "Musician"
  avatar?: string
  bio?: string
}

interface Story {
  id: number
  title: string
  category: string
  duration: string
  rating: number
  thumbnail: string
  creators: Creator[]
  tokens: number
  body?: string
  summary?: string
  isExample?: boolean
}

interface StoryDetailViewProps {
  story: Story
  onBack: () => void
}

export function StoryDetailView({ story, onBack }: StoryDetailViewProps) {
  useEffect(() => {
    if (isDemoMode() && story.isExample) recordDemoAction("story_opened")
  }, [story.id, story.isExample])
  // Use original English text for display
  const displayedTitle = story.title

  return (
    <div className="space-y-10 animate-fade-in">
      <Button
        onClick={onBack}
        variant="ghost"
        className="-ml-3 gap-2 text-muted-foreground hover:text-foreground"
        aria-label="Back to Story Library"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Story Library
      </Button>

      {/* Story header */}
      <header className="grid grid-cols-1 items-center gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:gap-10">
        <div className="story-thumbnail relative aspect-[4/3] overflow-hidden rounded-3xl">
          <Image
            src={story.thumbnail || "/placeholder.svg"}
            alt={`Illustration for ${displayedTitle}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 45vw"
            priority
          />
        </div>

        <div>
          <p className="eyebrow mb-3">
            {story.category} · {story.duration}
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl">{displayedTitle}</h1>
          {story.summary && (
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">{story.summary}</p>
          )}

          <ul className="mt-6 space-y-3" aria-label="Story creators">
            {story.creators.map((creator) => (
              <li key={creator.id} className="flex items-center gap-3">
                <Avatar className="avatar-ring h-10 w-10 flex-shrink-0">
                  {creator.avatar && <AvatarImage src={creator.avatar} alt="" />}
                  <AvatarFallback className="bg-muted text-sm text-muted-foreground">
                    {creator.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {creator.name}
                    <span className="font-normal text-muted-foreground"> · {creator.role}</span>
                  </p>
                  {creator.bio && <p className="truncate text-sm text-muted-foreground">{creator.bio}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </header>

      {/* Story Narration Controls */}
      {story.body && (
        <div>
          <StoryNarrationControls
            storyId={story.id}
            storyText={story.body}
            storyTitle={story.title}
            story={story}
          />
        </div>
      )}
    </div>
  )
}
