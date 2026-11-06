"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { DashboardContentWrapper } from "@/components/dashboard-content-wrapper"
import { DashboardTutorial } from "@/components/dashboard-tutorial"
import { StoryCard } from "@/components/story-card"
import { StoryDetailView } from "@/components/story-detail-view"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { DEMO_STORIES as stories } from "@/lib/services/demo/story-repository"

export default function StoriesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [selectedStory, setSelectedStory] = useState<(typeof stories)[0] | null>(null)

  // Handle story query parameter from shared links
  useEffect(() => {
    const storyIdParam = searchParams.get("story")
    if (storyIdParam) {
      const storyId = parseInt(storyIdParam, 10)
      if (!isNaN(storyId)) {
        const story = stories.find((s) => s.id === storyId)
        if (story) {
          setSelectedStory(story)
          // Clean up URL by removing query parameter
          router.replace("/stories", { scroll: false })
        }
      }
    }
  }, [searchParams, router])

  const handleShareStory = async (storyTitle: string, storyId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    const shareUrl = `${window.location.origin}/stories?story=${storyId}`
    
    const shareData = {
      title: `Check out "${storyTitle}" on Fable Together`,
      text: `I found this great story: "${storyTitle}". Check it out on Fable Together!`,
      url: shareUrl,
    }

    try {
      // Try Web Share API first (works on mobile and some desktop browsers)
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData)
        toast({
          title: "Story shared!",
          description: "Thanks for sharing this story.",
        })
      } else {
        // Fallback: Copy link to clipboard
        await navigator.clipboard.writeText(shareUrl)
        toast({
          title: "Link copied!",
          description: "Story link has been copied to your clipboard. Share it with friends!",
        })
      }
    } catch (error: unknown) {
      // User cancelled or error occurred
      if (error instanceof Error && error.name !== 'AbortError') {
        // Only show error if it wasn't a user cancellation
        try {
          // Fallback to clipboard if share failed
          await navigator.clipboard.writeText(shareUrl)
          toast({
            title: "Link copied!",
            description: "Story link has been copied to your clipboard.",
          })
        } catch {
          toast({
            title: "Share failed",
            description: "Unable to share. Please try again.",
            variant: "destructive",
          })
        }
      }
    }
  }

  const handleStoryClick = (story: typeof stories[0]) => {
    setSelectedStory(story)
  }

  const handleBackToLibrary = () => {
    setSelectedStory(null)
  }

  return (
    <div className="flex h-screen">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main id="main-content" className="flex-1 overflow-y-auto bg-background" role="main" tabIndex={-1}>
          <DashboardContentWrapper>
            <div className="mx-auto max-w-full px-4 sm:max-w-4xl sm:px-6 lg:max-w-6xl lg:px-8 xl:max-w-7xl pt-6 sm:pt-8 md:pt-10 pb-8 sm:pb-12 md:pb-16">
              {selectedStory ? (
                <StoryDetailView story={selectedStory} onBack={handleBackToLibrary} />
              ) : (
                <>
              {/* Header Section */}
              <div className="mb-8 sm:mb-10">
                <p className="eyebrow mb-3">Story Library</p>
                <h1 className="text-4xl sm:text-5xl">Choose tonight&apos;s story</h1>
                <p className="mt-3 max-w-2xl text-base sm:text-lg text-muted-foreground">
                  Every story can be read on the page or narrated in a voice you pick, in English, Spanish, French,
                  Chinese or Hindi.
                </p>
              </div>

              {/* Story Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mb-8 sm:mb-12">
                {stories.map((story, index) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    languageCount={Object.keys(story.translations).length}
                    priority={index < 3}
                    onOpen={() => handleStoryClick(story)}
                    onShare={(event) => handleShareStory(story.title, story.id, event)}
                    className="animate-fade-in"
                  />
                ))}
              </div>
                </>
              )}
            </div>
          </DashboardContentWrapper>
        </main>
        <DashboardTutorial />
      </div>
    </div>
  )
}
