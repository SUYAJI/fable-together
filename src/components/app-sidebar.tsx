"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, BookOpen, Mic, Settings, Menu, AudioLines, Trophy, Share2, HelpCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FableMark } from "@/components/fable-mark"
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { useIsMobile } from "@/hooks/use-mobile"
import { ThemeToggle } from "@/components/theme-toggle"
import { InviteFriendsModal } from "@/components/invite-friends-modal"
import { Fragment, useEffect, useState } from "react"
import { isDemoMode } from "@/lib/app-mode"
import { getDemoCounts, getDemoState, setDemoSidebarCollapsed, subscribeDemoState } from "@/lib/services/demo/state"

const navigation = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Story Library", href: "/stories", icon: BookOpen },
  { name: "Voice Library", href: "/voices", icon: Mic },
  { name: "Clone a Voice", href: "/voices/clone", icon: AudioLines },
  { name: "Quests", href: "/quests", icon: Trophy },
  { name: "FAQ", href: "/creator", icon: HelpCircle },
  { name: "Settings", href: "/settings", icon: Settings },
]

// Module-level cache to persist counts across component remounts
let cachedCounts: { stories: number; voices: number; timestamp: number } | null = null
const CACHE_DURATION = 60 * 1000 // 1 minute cache

// Mobile Sidebar Content Component
function SidebarContent({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const pathname = usePathname()
  
  // Initialize from cache if available, otherwise start with 0
  const getInitialCounts = () => {
    if (cachedCounts && Date.now() - cachedCounts.timestamp < CACHE_DURATION) {
      return {
        stories: cachedCounts.stories,
        voices: cachedCounts.voices
      }
    }
    return { stories: 0, voices: 0 }
  }
  
  const [storyCount, setStoryCount] = useState<number>(getInitialCounts().stories)
  const [voiceCount, setVoiceCount] = useState<number>(getInitialCounts().voices)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

  const syncDemoCounts = () => {
    const counts = getDemoCounts()
    setStoryCount(counts.stories)
    setVoiceCount(counts.voices)
  }

    const fetchCounts = async () => {
      if (isDemoMode()) {
        syncDemoCounts()
        return
      }
      try {
        const response = await fetch("/api/library/counts")
        if (response.ok) {
          const data = await response.json()
          const stories = data.stories ?? 0
          const voices = data.voices ?? 0
          
          // Update cache
          cachedCounts = {
            stories,
            voices,
            timestamp: Date.now()
          }
          
          setStoryCount(stories)
          setVoiceCount(voices)
        }
      } catch (error) {
        console.error("Error fetching library counts:", error)
        // Keep existing counts on error, don't reset
        if (cachedCounts) {
          setStoryCount(cachedCounts.stories)
          setVoiceCount(cachedCounts.voices)
        }
      }
  }

  useEffect(() => {
    if (isDemoMode()) {
      syncDemoCounts()
      return subscribeDemoState(syncDemoCounts)
    }

    // Only fetch if cache is expired or doesn't exist
    const shouldFetch = !cachedCounts || (Date.now() - cachedCounts.timestamp >= CACHE_DURATION)
    
    if (!shouldFetch && cachedCounts) {
      // Use cached values
      setStoryCount(cachedCounts.stories)
      setVoiceCount(cachedCounts.voices)
      return
    }

    fetchCounts()
  }, [])

  // Listen for voice deletion events to refresh counts
  useEffect(() => {
    const handleVoiceDeleted = () => {
      // Clear cache and refetch
      cachedCounts = null
      fetchCounts()
    }

    window.addEventListener("voice-deleted", handleVoiceDeleted)
    return () => {
      window.removeEventListener("voice-deleted", handleVoiceDeleted)
    }
  }, [])

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn(
        "flex items-center border-b h-16 transition-all",
        isCollapsed ? "justify-center px-2 flex-col gap-1" : "px-5"
      )}>
        <div className={cn(
          "flex items-center gap-2",
          isCollapsed && "flex-col gap-1"
        )}>
          <Link
            href="/dashboard"
            className="text-foreground transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
            aria-label="Fable Together - Home"
          >
            <FableMark compact={isCollapsed} />
          </Link>
        </div>
      </div>

      {/* Navigation */}
      <nav 
        className={cn(
          "flex-1 space-y-1 transition-all",
          isCollapsed ? "p-3" : "px-4 py-6"
        )}
        aria-label="Main navigation"
      >
        <TooltipProvider>
          {navigation.map((item) => {
            const isActive = pathname === item.href
            // Show count badge for Story Library and Voice Library
            const showCount = item.name === "Story Library" || item.name === "Voice Library"
            const count = item.name === "Story Library" ? storyCount : voiceCount

            const linkContent = (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "sidebar-item flex items-center rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isCollapsed ? "justify-center py-3 px-2" : "gap-3 text-[0.95rem] font-medium py-2.5 px-3",
                  isActive ? "sidebar-item-active" : "text-muted-foreground hover:text-foreground",
                )}
                aria-current={isActive ? "page" : undefined}
                aria-label={isCollapsed ? `${item.name}${showCount ? `, ${count} items` : ""}` : undefined}
              >
                <item.icon 
                  className={cn(
                    "icon-accent flex-shrink-0",
                    isCollapsed ? "h-5 w-5" : "h-[18px] w-[18px]"
                  )}
                  aria-hidden="true"
                />
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{item.name}</span>
                    {showCount && (
                      <Badge 
                        variant="secondary" 
                        className="h-5 min-w-5 px-1.5 text-xs font-medium"
                        aria-label={`${count} ${item.name === "Story Library" ? "stories" : "voices"}`}
                      >
                        {count}
                      </Badge>
                    )}
                  </>
                )}
              </Link>
            )

            // Quests, FAQ and Settings sit below a divider so the story/voice loop reads first
            const divider = item.name === "Quests" ? (
              <div className="my-3 border-t" role="separator" aria-hidden="true" />
            ) : null

            if (isCollapsed) {
              return (
                <Fragment key={item.name}>
                  {divider}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {linkContent}
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{item.name}</p>
                      {showCount && <p className="text-xs opacity-75">{count} items</p>}
                    </TooltipContent>
                  </Tooltip>
                </Fragment>
              )
            }

            return (
              <Fragment key={item.name}>
                {divider}
                {linkContent}
              </Fragment>
            )
          })}
        </TooltipProvider>
      </nav>

      {/* Theme Toggle for Mobile */}
      {!isCollapsed && (
        <div className="border-t bg-muted/30 p-4 lg:hidden">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      )}

      {/* Invite Friends Section */}
      <aside className="border-t bg-muted/30" aria-label="Invite friends section">
        {isCollapsed ? (
          <div className={cn("p-3")}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-full h-auto aspect-square bg-primary/10 hover:bg-primary/20 text-primary border-primary/30"
                    onClick={() => setIsInviteModalOpen(true)}
                    aria-label="Open invite friends modal"
                  >
                    <Share2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{isDemoMode() ? "Share Demo" : "Invite Friends"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ) : (
          <div className="p-4">
            <div className="card-elevated p-4">
              <div className="flex items-center gap-2 mb-3">
                <Share2 className="h-4 w-4 text-primary" aria-hidden="true" />
                <h3 className="text-sm font-semibold">{isDemoMode() ? "Share Demo" : "Invite Friends"}</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                {isDemoMode()
                  ? "Copy a link to this interactive reconstruction."
                  : "Share Fable Together with friends and family."}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full h-auto py-2 text-xs mb-3 bg-primary/10 hover:bg-primary/20 text-primary border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={() => setIsInviteModalOpen(true)}
                aria-label="Open invite friends modal"
              >
                <Share2 className="h-3 w-3 mr-1.5" aria-hidden="true" />
                <span>{isDemoMode() ? "Share Demo" : "Invite Someone"}</span>
              </Button>
              {isDemoMode() && (
                <p className="text-center text-xs text-muted-foreground">
                  No invitation or email is sent.
                </p>
              )}
            </div>
          </div>
        )}
      </aside>

      <InviteFriendsModal open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen} />

      {/* Copyright Footer */}
      <div className={cn(
        "border-t mt-auto",
        isCollapsed ? "p-3" : "p-4"
      )}>
        <p className={cn(
          "text-xs text-muted-foreground text-center",
          isCollapsed && "text-[10px]"
        )}>
          © 2025 Fable Together. All rights reserved.
        </p>
      </div>
    </div>
  )
}

// Mobile Sidebar Trigger Component
export function MobileSidebarTrigger() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Toggle mobile sidebar">
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetTitle className="sr-only">Fable Together navigation</SheetTitle>
        <SheetDescription className="sr-only">Open a demo page or view the local story and voice counts.</SheetDescription>
        <SidebarContent />
      </SheetContent>
    </Sheet>
  )
}

// Main Sidebar Component
export function AppSidebar() {
  const isMobile = useIsMobile()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [hasLoadedPreference, setHasLoadedPreference] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isDemoMode()) setIsCollapsed(getDemoState().preferences.sidebarCollapsed)
      else setIsCollapsed(localStorage.getItem('sidebar-collapsed') === 'true')
      setHasLoadedPreference(true)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && hasLoadedPreference) {
      if (isDemoMode()) setDemoSidebarCollapsed(isCollapsed)
      else localStorage.setItem('sidebar-collapsed', String(isCollapsed))
    }
  }, [hasLoadedPreference, isCollapsed])

  if (isMobile) {
    return null // Mobile sidebar is handled by MobileSidebarTrigger
  }

  return (
    <div className="relative h-screen overflow-visible">
      {/* Sidebar with slide animation */}
      <aside 
        className={cn(
          "flex h-screen flex-col border-r bg-sidebar transition-all duration-300 ease-in-out relative z-10",
      isCollapsed ? "w-16" : "w-64"
        )}
        style={{
          transform: isCollapsed ? 'translateX(calc(-100% + 4rem))' : 'translateX(0)',
        }}
      >
      <SidebarContent isCollapsed={isCollapsed} />
      
        {/* Toggle Button - Standard Design */}
      <div className={cn(
          "absolute top-16 transition-all duration-300 ease-in-out z-20",
          isCollapsed ? "right-0 translate-x-1/2" : "right-0 translate-x-1/2"
      )}>
        <Button
          variant="outline"
          size="icon"
            className="h-8 w-8 rounded-full border-2 bg-card shadow-lg hover:bg-muted hover:shadow-xl transition-all"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
        </Button>
      </div>
      </aside>
    </div>
  )
}

