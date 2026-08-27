"use client"

import { useEffect, useState } from "react"
import { DashboardQuests } from "@/components/dashboard-quests"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, Share2, Users, Mic, BookOpen, Star, ShoppingCart } from "lucide-react"
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

const exampleStories = [
  {
    id: 1,
    title: "The Adventure Begins",
    category: "Adventure",
    duration: "10 min",
    rating: 4.6,
    thumbnail: "/adventure-story-illustration.jpg",
    isExample: true,
    isPurchased: true,
    likes: 89,
    plays: "2.3K",
    summary: "A brave little rabbit named Luna overcomes her fears to embark on a magical adventure in the forest, discovering that the greatest journeys begin with a single step.",
    creators: [
      {
        id: "sarah-j",
        name: "Sarah Johnson",
        role: "Author" as const,
        avatar: "/emily-avatar.jpg",
        bio: "Award-winning children's author with 15+ published stories",
      },
    ],
  },
  {
    id: 2,
    title: "The Mystery Unfolds",
    category: "Mystery",
    duration: "12 min",
    rating: 4.8,
    thumbnail: "/mystery-story-illustration.jpg",
    isExample: true,
    isPurchased: true,
    likes: 67,
    plays: "1.8K",
    summary: "Detective Maya investigates strange lights at an old lighthouse, uncovering hidden secrets and learning that the greatest mysteries are about preserving history.",
    creators: [
      {
        id: "alex-c",
        name: "Alex Chen",
        role: "Author" as const,
        avatar: "/uncle-lou-avatar.jpg",
        bio: "Mystery writer with a passion for puzzles and adventure",
      },
    ],
  },
  {
    id: 3,
    title: "The Enchanted Forest",
    category: "Fantasy",
    duration: "15 min",
    rating: 4.9,
    thumbnail: "/enchanted-forest-story.jpg",
    isExample: true,
    isPurchased: true,
    likes: 124,
    plays: "3.1K",
    summary: "A young fairy named Zara embarks on a quest to save the Enchanted Forest, discovering that true magic comes from love and care for nature.",
    creators: [
      {
        id: "luna-m",
        name: "Luna Martinez",
        role: "Author" as const,
        avatar: "/dr-anna-avatar.jpg",
        bio: "Fantasy author who believes in the magic of nature",
      },
    ],
  },
]

const communityCircles = [
  {
    name: "Indigenous Stories Circle",
    members: "1.2K members",
    color: "bg-orange-500",
  },
  {
    name: "Family Traditions",
    members: "856 members",
    color: "bg-green-500",
  },
  {
    name: "Multilingual Tales",
    members: "2.1K members",
    color: "bg-blue-500",
  },
]

const familyActivity = [
  {
    name: "Emma",
    action: 'loved "Space Adventure"',
    time: "2 hours ago",
    avatar: "E",
    color: "bg-pink-500",
  },
  {
    name: "Mike",
    action: "added new voice",
    time: "5 hours ago",
    avatar: "M",
    color: "bg-blue-500",
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
          <main className="flex-1 overflow-y-auto">
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

  return (
    <div className="flex h-screen">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader user={user} />
        <NewsTicker />
        <main id="main-content" className="flex-1 overflow-y-auto relative dark:bg-[#1a1a1a]" role="main" tabIndex={-1}>
          <DashboardNavigationProgress />
          <DashboardContentWrapper>
            <div className="mx-auto max-w-full px-4 sm:max-w-4xl sm:px-6 lg:max-w-6xl lg:px-8 xl:max-w-7xl pt-6 sm:pt-8 md:pt-10 pb-8 sm:pb-12 md:pb-16">
            {/* Header Section */}
            <div className="mb-12 sm:mb-16">
              <div className="text-sm uppercase tracking-wide text-muted-foreground mb-4">
                Dashboard
              </div>
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-4xl sm:text-5xl font-bold">
                  Welcome, {user?.first_name || user?.display_name?.split(' ')[0] || 'User'}!
                </h1>
                <Badge className="bg-orange-500/90 text-white border-orange-400 font-semibold text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1" aria-label={isDemoMode() ? "Interactive demo" : "Beta version"}>
                  {isDemoMode() ? "INTERACTIVE DEMO" : "BETA"}
                </Badge>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className="text-lg text-muted-foreground max-w-3xl">
                  {isDemoMode()
                    ? "Explore stories, narration voices, translations, and the family activity that shaped the original Fable Together experience."
                    : "Fable Together is currently in beta. We&apos;re actively working on improving features and adding new functionality."}
                </p>
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="gap-2 text-sm sm:text-base w-fit"
                  onClick={() => setFeedbackModalOpen(true)}
                >
                  <Star className="h-4 w-4 sm:h-5 sm:w-5" />
                  Provide Feedback
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {/* Main Content */}
              <div className="space-y-4 sm:space-y-6">
                {/* Quests Section */}
                <div className="mb-6">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold mb-2">Quests</h2>
                    <p className="text-sm text-muted-foreground">
                      Complete quests automatically as you use the platform to earn tokens
                    </p>
                  </div>
                  <DashboardQuests />
                </div>

                {/* Stats */}
                <section aria-label="Dashboard statistics">
                  <h2 className="sr-only">Dashboard Statistics</h2>
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  <Card className="glass-card group transition-all duration-200 hover:ring-2 hover:ring-border hover:ring-offset-2">
                    <CardContent className="p-6">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                        <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-3xl font-bold">
                        {isDemoMode() ? storiesCount : <AnimatedCounter value={storiesCount} />}
                      </div>
                      <div className="text-sm text-muted-foreground">Stories in library</div>
                    </CardContent>
                  </Card>
                  <Card className="glass-card group transition-all duration-200 hover:ring-2 hover:ring-border hover:ring-offset-2">
                    <CardContent className="p-4 sm:p-5 md:p-6">
                      <div className="mb-2 sm:mb-3 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                        <Mic className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold">
                        {isDemoMode() ? voicesCount : <AnimatedCounter value={voicesCount} />}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Voices in library</div>
                    </CardContent>
                  </Card>
                  <Card className="glass-card group transition-all duration-200 hover:ring-2 hover:ring-border hover:ring-offset-2">
                    <CardContent className="p-4 sm:p-5 md:p-6">
                      <div className="mb-2 sm:mb-3 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                        <Star className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold">
                        {isDemoMode() ? creditsRemaining : <AnimatedCounter value={creditsRemaining} />}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Credits available</div>
                    </CardContent>
                  </Card>
                  </div>
                </section>

                {/* Current Stories */}
                <section aria-label="Current stories">
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Current Stories</h2>
                    <div className="flex items-center gap-2">
                      <Link href="/stories">
                        <Button variant="outline" className="btn-ghost">View All</Button>
                      </Link>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
                      {exampleStories.map((story) => (
                        <div
                          key={story.id}
                          className="relative rounded-2xl transition-all hover:shadow-lg flex flex-col border border-border/50 p-[1px]"
                        >
                          <Card 
                            className="glass-card card-story overflow-hidden group animate-fade-in cursor-pointer border-0 h-full flex-1 flex flex-col p-0" 
                            onClick={() => router.push(`/stories?story=${story.id}`)}
                          >
                            <div className="story-thumbnail relative bg-warm-gradient overflow-hidden h-64">
                              <Image 
                                src={story.thumbnail} 
                                alt={`${story.title} story cover image`} 
                                fill
                                className="object-cover"
                                priority
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
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleShareStory(story.title, story.id, e)
                                  }}
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
                </div>
                </section>
              </div>

              {/* Sidebar - Hidden for now */}
              {false && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Community Circles */}
                  <Link href="/community">
                    <Card className="glass-card group transition-all duration-200 hover:ring-2 hover:ring-border hover:ring-offset-2 cursor-pointer">
                      <CardContent className="p-6">
                        <div className="mb-4 flex items-center gap-2">
                          <Users className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold">Community Circles</h3>
                        </div>
                        <div className="space-y-3">
                          {communityCircles.map((circle, index) => (
                            <div key={index} className="flex items-center gap-3">
                              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${circle.color}`}>
                                <Users className="h-6 w-6 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-sm">{circle.name}</div>
                                <div className="text-xs text-muted-foreground">{circle.members}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  {/* Quick Start */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="mb-4 font-semibold">Quick Start</h3>
                      <div className="space-y-2">
                        <Link href="/stories">
                          <Button className="w-full justify-start gap-2 bg-gradient-to-r from-purple-600 to-pink-600">
                            <Play className="h-4 w-4" />
                            Create New Story
                          </Button>
                        </Link>
                        <Link href="/voices/clone">
                          <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                              />
                            </svg>
                            Record Voice
                          </Button>
                        </Link>
                        <Link href="/community">
                          <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                              />
                            </svg>
                            Join Discussion
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Family Activity */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="mb-4 font-semibold">Family Activity</h3>
                      <div className="space-y-4">
                        {familyActivity.map((activity, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-full ${activity.color} text-white font-semibold`}
                            >
                              {activity.avatar}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm">
                                <span className="font-medium">{activity.name}</span> {activity.action}
                              </p>
                              <p className="text-xs text-muted-foreground">{activity.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
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
