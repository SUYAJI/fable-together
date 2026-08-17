/**
 * Stories Page Component
 * 
 * Story Library page displaying example stories with:
 * - Grid/list view toggle
 * - Category filtering
 * - Story detail view
 * - Responsive layouts (1 column mobile, 2-3 columns desktop)
 * 
 * Features:
 * - Mobile-first responsive design
 * - Story filtering and search
 * - Inline story detail view
 * - Audio playback integration
 */

"use client"

import { useState, useMemo, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { DashboardContentWrapper } from "@/components/dashboard-content-wrapper"
import { DashboardTutorial } from "@/components/dashboard-tutorial"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, Star, ShoppingCart, Grid3x3, Share2 } from "lucide-react"
import { StoryDetailView } from "@/components/story-detail-view"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { DEMO_STORIES as stories } from "@/lib/services/demo/story-repository"

type StoryFilter = "all" | "example" | "purchased" | "adventure" | "mystery" | "fantasy"

export default function StoriesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [selectedStory, setSelectedStory] = useState<(typeof stories)[0] | null>(null)
  const [activeFilter, setActiveFilter] = useState<StoryFilter>("all")

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
    
    const shareUrl = typeof window !== "undefined" 
      ? `${window.location.origin}/stories?story=${storyId}` 
      : `https://app.fabletogether.com/stories?story=${storyId}`
    
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
        } catch (clipboardError) {
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

  // Get unique categories from stories
  const categories = useMemo(() => {
    const cats = new Set(stories.map(s => s.category.toLowerCase()))
    return Array.from(cats) as string[]
  }, [])

  // Filter stories based on active filter
  const filteredStories = useMemo(() => {
    return stories.filter((story) => {
      if (activeFilter === "all") return true
      if (activeFilter === "example") return story.isExample === true
      if (activeFilter === "purchased") return story.isPurchased === true
      // Category filters
      if (activeFilter === "adventure") return story.category.toLowerCase() === "adventure"
      if (activeFilter === "mystery") return story.category.toLowerCase() === "mystery"
      if (activeFilter === "fantasy") return story.category.toLowerCase() === "fantasy"
      return true
    })
  }, [activeFilter])

  return (
    <div className="flex h-screen">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main id="main-content" className="flex-1 overflow-y-auto bg-background dark:bg-[#1a1a1a]" role="main" tabIndex={-1}>
          <DashboardContentWrapper>
            <div className="mx-auto max-w-full px-4 sm:max-w-4xl sm:px-6 lg:max-w-6xl lg:px-8 xl:max-w-7xl pt-6 sm:pt-8 md:pt-10 pb-8 sm:pb-12 md:pb-16">
              {selectedStory ? (
                <StoryDetailView story={selectedStory} onBack={handleBackToLibrary} />
              ) : (
                <>
              {/* Header Section */}
              <div className="mb-8 sm:mb-12 md:mb-16">
                <div className="text-xs sm:text-sm uppercase tracking-wide text-muted-foreground mb-3 sm:mb-4">
                  Stories
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
                  Story Library
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground max-w-3xl">
                  Discover and enjoy magical stories brought to life with AI narration
                </p>
              </div>

              {/* Story Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
                {filteredStories.map((story) => (
                  <div
                    key={story.id}
                    className="relative rounded-2xl transition-all hover:shadow-lg flex flex-col border border-border/50 p-[1px]"
                  >
                    <Card 
                      className="glass-card card-story overflow-hidden group animate-fade-in cursor-pointer border-0 h-full flex-1 flex flex-col p-0" 
                      onClick={() => handleStoryClick(story)}
                    >
                      <div className="story-thumbnail relative bg-warm-gradient overflow-hidden h-64">
                        <Image 
                          src={story.thumbnail || "/placeholder.svg"} 
                          alt={`${story.title} story cover image`} 
                          fill
                          className="object-cover"
                          loading="lazy"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </div>
                            <CardContent className="p-5 sm:p-6 md:p-8 flex flex-col flex-1">
                              <div className="mb-4 sm:mb-6 flex-1">
                                <h3 className="font-bold text-xl sm:text-2xl md:text-3xl mb-3 sm:mb-4 leading-tight">{story.title}</h3>
                          {story.summary && (
                                  <p className="text-base sm:text-lg text-muted-foreground mb-3 sm:mb-4 leading-relaxed">{story.summary}</p>
                          )}
                                <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                            by {story.creators.map(c => c.name).join(", ")}
                          </p>
                        </div>
                              <div className="flex items-center justify-between pt-4 border-t">
                          <button 
                                  className="flex items-center gap-2 text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded px-3 py-2"
                            onClick={(e) => handleShareStory(story.title, story.id, e)}
                            aria-label={`Share ${story.title}`}
                          >
                                  <Share2 className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                            <span>Share story</span>
                          </button>
                          {story.isPurchased ? (
                                  <Button size="lg" className="btn-primary gap-2 h-11 sm:h-12 px-6 sm:px-8 text-base sm:text-lg">
                                    <Play className="h-4 w-4 sm:h-5 sm:w-5" />
                              Open
                            </Button>
                          ) : (
                                  <Button size="lg" variant="outline" className="btn-ghost gap-2 h-11 sm:h-12 px-6 sm:px-8 text-base sm:text-lg">
                                    <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                              Purchase
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Bottom Tab - Larger */}
                    <div className="h-3 rounded-b-2xl -mt-[1px] bg-border/50" />
                  </div>
                ))}
              </div>

            {filteredStories.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground text-lg">
                    No stories found matching your filters.
                  </p>
                </CardContent>
              </Card>
            )}
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
