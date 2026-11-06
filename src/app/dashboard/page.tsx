"use client"

import { useEffect, useState } from "react"
import { DashboardQuests } from "@/components/dashboard-quests"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { BookOpen, Headphones, Languages, MessageSquare, Mic } from "lucide-react"
import { StoryCard } from "@/components/story-card"
import { DEMO_STORIES as stories } from "@/lib/services/demo/story-repository"
import { getClientServices } from "@/lib/services/client"
import { DashboardContentWrapper } from "@/components/dashboard-content-wrapper"
import { DashboardNavigationProgress } from "@/components/dashboard-navigation-progress"
import { NewsTicker } from "@/components/news-ticker"
import { DashboardTutorial } from "@/components/dashboard-tutorial"
import { useToast } from "@/hooks/use-toast"
import { AnimatedCounter } from "@/components/animated-counter"
import { FeedbackModal } from "@/components/feedback-modal"
import { isDemoMode } from "@/lib/app-mode"
import { getDemoState, getDemoVoices, subscribeDemoState } from "@/lib/services/demo/state"

interface UserProfile {
  id: string
  display_name: string
  avatar_url?: string
  first_name?: string
}

// Featured on the dashboard as tonight's story
const FEATURED_STORY_ID = 3

const steps = [
  {
    title: "Pick a story",
    description: "Illustrated stories to read on the page or hear aloud.",
    href: "/stories",
    icon: BookOpen,
  },
  {
    title: "Choose a voice",
    description: "A narrator from the library, or a family voice you clone.",
    href: "/voices",
    icon: Mic,
  },
  {
    title: "Listen in five languages",
    description: "English, Spanish, French, Chinese and Hindi, at any speed.",
    href: `/stories?story=${FEATURED_STORY_ID}`,
    icon: Languages,
  },
]

export default function DashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [creditsRemaining, setCreditsRemaining] = useState<number>(150)
  const [storiesCount, setStoriesCount] = useState<number>(0)
  const [voicesCount, setVoicesCount] = useState<number>(0)
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false)
  // Share story functionality - uses Web Share API when available, falls back to clipboard
  const handleShareStory = async (storyTitle: string, storyId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    // Build share URL that links directly to the story
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
        // Fallback: Copy link to clipboard for browsers without Web Share API
        await navigator.clipboard.writeText(shareUrl)
        toast({
          title: "Link copied!",
          description: "Story link has been copied to your clipboard. Share it with friends!",
        })
      }
    } catch (error: unknown) {
      // User cancelled or error occurred - don't show error if user just cancelled
      if (error instanceof Error && error.name !== 'AbortError') {
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

  useEffect(() => {
    if (isDemoMode()) {
      const syncDemoDashboard = () => {
        const demo = getDemoState()
        const firstName = demo.profile.display_name.split(" ")[0] || "Fable"
        setUser({ id: demo.profile.id, display_name: demo.profile.display_name, avatar_url: demo.profile.avatar_url, first_name: firstName })
        setCreditsRemaining(demo.credits.available)
        setStoriesCount(3)
        setVoicesCount(getDemoVoices().length)
        setLoading(false)
      }
      syncDemoDashboard()
      return subscribeDemoState(syncDemoDashboard)
    }
    async function fetchUserData() {
      try {
        const services = getClientServices()
        const authUser = await services.auth.getCurrentUser()
        
        if (!authUser) {
          // No authenticated user
          setLoading(false)
          return
        }

        const profile = await services.profiles.getProfile(authUser.id)

        // Get display name with proper fallback: profile.display_name -> first_name -> first + last -> email username -> "User"
        const getDisplayName = () => {
          if (profile?.display_name) return profile.display_name
          if (authUser.user_metadata?.first_name) {
            return authUser.user_metadata.first_name
          }
          if (authUser.user_metadata?.first_name && authUser.user_metadata?.last_name) {
            return `${authUser.user_metadata.first_name} ${authUser.user_metadata.last_name}`
          }
          return authUser.email?.split('@')[0] || 'User'
        }

        // Get first name for welcome message
        const getFirstName = () => {
          if (authUser.user_metadata?.first_name) {
            return authUser.user_metadata.first_name
          }
          if (profile?.display_name) {
            // Extract first name from display name
            const parts = profile.display_name.trim().split(' ')
            return parts[0]
          }
          if (authUser.email) {
            return authUser.email.split('@')[0]
          }
          return 'User'
        }

        const displayName = getDisplayName()
        const firstName = getFirstName()
        
        if (!profile) {
          setUser({
            id: authUser.id,
            display_name: displayName,
            avatar_url: authUser.user_metadata?.avatar_url,
            first_name: firstName
          })
        } else {
          setUser({
            ...profile,
            display_name: displayName, // Use computed display name
            first_name: firstName
          })
          // Set available credits for stat card
          if (profile.available_credits !== null && profile.available_credits !== undefined) {
            setCreditsRemaining(profile.available_credits)
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()

    // Fetch credits periodically to keep it updated
    const fetchCredits = async () => {
      try {
        const response = await fetch("/api/user/credits")
        if (response.ok) {
          const data = await response.json()
          setCreditsRemaining(data.available || 150)
        } else {
          // Handle non-OK responses gracefully - keep existing value or use default
          // Don't update creditsRemaining on error to avoid overwriting with 0
        }
      } catch (error) {
        // Network errors - keep existing credits value
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.error("Error fetching credits:", error)
        }
      }
    }

    fetchCredits()
    const creditsInterval = setInterval(fetchCredits, 30000) // Update every 30 seconds

    // Fetch library counts (stories and voices)
    const fetchLibraryCounts = async () => {
      try {
        const response = await fetch("/api/library/counts")
        if (response.ok) {
          const data = await response.json()
          setStoriesCount(data.stories ?? 0)
          setVoicesCount(data.voices ?? 0)
        }
      } catch (error) {
        console.error("Error fetching library counts:", error)
      }
    }

    fetchLibraryCounts()

    return () => clearInterval(creditsInterval)
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto bg-background">
            <div className="mx-auto max-w-7xl p-6">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  const featuredStory = stories.find((story) => story.id === FEATURED_STORY_ID) ?? stories[0]
  const firstName = user?.first_name || user?.display_name?.split(" ")[0]

  return (
    <div className="flex h-screen">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader user={user} />
        <NewsTicker />
        <main id="main-content" className="flex-1 overflow-y-auto relative bg-background" role="main" tabIndex={-1}>
          <DashboardNavigationProgress />
          <DashboardContentWrapper>
            <div className="mx-auto max-w-full px-4 sm:max-w-4xl sm:px-6 lg:max-w-6xl lg:px-8 pt-6 sm:pt-8 md:pt-10 pb-12 sm:pb-16">
              {/* Greeting */}
              <header className="mb-6 sm:mb-8">
                <p className="eyebrow mb-3">
                  {isDemoMode() ? "Interactive demo" : firstName ? `Welcome back, ${firstName}` : "Welcome back"}
                </p>
                <h1 className="text-4xl sm:text-5xl">What shall we read tonight?</h1>
              </header>

              {/* Tonight's story */}
              <section aria-labelledby="featured-heading" className="night-band mb-10 overflow-hidden rounded-3xl sm:mb-14">
                <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr]">
                  <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[360px]">
                    <Image
                      src={featuredStory.thumbnail}
                      alt={`Illustration for ${featuredStory.title}`}
                      fill
                      priority
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 55vw"
                    />
                  </div>
                  <div className="flex flex-col justify-center gap-4 p-6 sm:p-8 lg:p-10">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/60">
                      Tonight&apos;s story · {featuredStory.category} · {featuredStory.duration}
                    </p>
                    <h2 id="featured-heading" className="text-3xl sm:text-4xl text-white">
                      {featuredStory.title}
                    </h2>
                    <p className="text-base leading-relaxed text-white/75">{featuredStory.summary}</p>
                    <p className="text-sm text-white/55">
                      by {featuredStory.creators.map((creator) => creator.name).join(", ")}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <Button
                        size="lg"
                        className="gap-2 bg-[var(--moon)] text-[var(--night)] hover:bg-white"
                        onClick={() => router.push(`/stories?story=${featuredStory.id}`)}
                      >
                        <Headphones className="h-4 w-4" aria-hidden="true" />
                        Listen now
                      </Button>
                      <Button
                        asChild
                        size="lg"
                        variant="ghost"
                        className="text-white hover:bg-white/10 hover:text-white"
                      >
                        <Link href="/stories">Browse the library</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </section>

              {/* How it works */}
              <section aria-labelledby="steps-heading" className="mb-12 sm:mb-16">
                <h2 id="steps-heading" className="sr-only">How Fable Together works</h2>
                <ol className="grid gap-3 sm:grid-cols-3 sm:gap-4">
                  {steps.map((step, index) => (
                    <li key={step.title}>
                      <Link
                        href={step.href}
                        className="card-interactive flex h-full items-start gap-4 rounded-2xl border bg-card p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="step-number mt-0.5">{index + 1}</span>
                        <span className="flex-1">
                          <span className="flex items-center gap-2 font-medium">
                            <step.icon className="h-4 w-4 text-lantern" aria-hidden="true" />
                            {step.title}
                          </span>
                          <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                            {step.description}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </section>

              {/* Library */}
              <section aria-labelledby="library-heading" className="mb-14 sm:mb-20">
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="eyebrow mb-2">Library</p>
                    <h2 id="library-heading" className="text-3xl">Stories</h2>
                  </div>
                  <Button asChild variant="outline">
                    <Link href="/stories">View all</Link>
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                  {stories.map((story) => (
                    <StoryCard
                      key={story.id}
                      story={story}
                      languageCount={Object.keys(story.translations).length}
                      onOpen={() => router.push(`/stories?story=${story.id}`)}
                      onShare={(event) => handleShareStory(story.title, story.id, event)}
                    />
                  ))}
                </div>
              </section>

              {/* Progress: stats and quests */}
              <section aria-labelledby="progress-heading">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="eyebrow mb-2">Your progress</p>
                    <h2 id="progress-heading" className="text-3xl">Quests</h2>
                    <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                      Quests complete on their own as you listen and try voices. Each one adds credits for narration.
                    </p>
                  </div>
                  <Button variant="ghost" className="w-fit gap-2 text-muted-foreground" onClick={() => setFeedbackModalOpen(true)}>
                    <MessageSquare className="h-4 w-4" aria-hidden="true" />
                    Share feedback
                  </Button>
                </div>

                <dl className="mb-6 grid grid-cols-3 divide-x rounded-2xl border bg-card">
                  {[
                    { label: "Stories", value: storiesCount },
                    { label: "Voices", value: voicesCount },
                    { label: "Credits", value: creditsRemaining },
                  ].map((stat) => (
                    <div key={stat.label} className="px-4 py-4 sm:px-6">
                      <dt className="text-xs text-muted-foreground sm:text-sm">{stat.label}</dt>
                      <dd className="mt-1 font-serif text-2xl sm:text-3xl">
                        {isDemoMode() ? stat.value : <AnimatedCounter value={stat.value} />}
                      </dd>
                    </div>
                  ))}
                </dl>

                <DashboardQuests />
              </section>
            </div>
          </DashboardContentWrapper>
        </main>
        <DashboardTutorial />
        <FeedbackModal
          open={feedbackModalOpen}
          onOpenChange={setFeedbackModalOpen}
        />
      </div>
    </div>
  )
}
