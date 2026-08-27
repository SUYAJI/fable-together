"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
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
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Back Button */}
      <Button
        onClick={onBack}
        variant="outline"
        className="flex items-center gap-2 text-sm sm:text-base"
        aria-label="Back to Story Library"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        <span>Back to Story Library</span>
      </Button>

      {/* Header with Typography Hierarchy */}
      <div className="mb-6 sm:mb-8">
        <div className="text-xs sm:text-sm uppercase tracking-wide text-muted-foreground mb-3 sm:mb-4">
          Story
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
          {displayedTitle}
        </h1>
      </div>

      {/* Two Column Layout: Image and Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Story Image */}
        <div className="story-thumbnail relative overflow-hidden rounded-lg h-48 sm:h-64 md:h-full md:min-h-[400px]">
          <Image
            src={story.thumbnail || "/placeholder.svg"}
            alt={`${displayedTitle} story cover image`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>

        {/* Story Details and Creators */}
        <div className="flex items-center justify-center">
          <Card className="w-full border rounded-lg h-full md:min-h-[400px] flex flex-col">
            <CardContent className="p-4 sm:p-6 flex-1 flex flex-col">
              {/* Creators */}
              <div className="space-y-2 sm:space-y-3">
                <h3 className="text-base sm:text-lg font-semibold">Story Creators</h3>
                {story.creators.map((creator) => (
                  <div
                    key={creator.id}
                    className="card-elevated flex items-start gap-3 sm:gap-4 p-3 sm:p-4"
                  >
                    <Avatar className="avatar-ring h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0">
                      {creator.avatar && (
                        <AvatarImage src={creator.avatar} alt={`${creator.name} profile picture`} />
                      )}
                      <AvatarFallback className="bg-muted text-muted-foreground text-sm sm:text-lg" aria-label={`${creator.name} avatar`}>
                        {creator.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                        <h4 className="font-semibold text-base sm:text-lg">
                          {creator.name}
                        </h4>
                        <Badge variant="secondary" className="text-xs font-normal w-fit">
                          {creator.role}
                        </Badge>
                      </div>
                      {creator.bio && <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{creator.bio}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Story Narration Controls */}
      {story.body && (
        <div className="mt-4 sm:mt-6">
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
