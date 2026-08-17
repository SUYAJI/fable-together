/**
 * Application Sidebar Component
 * 
 * Main navigation sidebar for the dashboard with:
 * - Collapsible navigation menu
 * - Story and voice library counts
 * - Community section
 * - Mobile-responsive sheet overlay
 * - Active route highlighting
 * 
 * Features:
 * - Desktop: Fixed sidebar with collapse/expand
 * - Mobile: Sheet overlay triggered by hamburger menu
 * - Cached library counts for performance
 * - Smooth transitions and animations
 */

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, BookOpen, Mic, Settings, Sparkles, Menu, Users, Trophy, Share2, HelpCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { useIsMobile } from "@/hooks/use-mobile"
import { ThemeToggle } from "@/components/theme-toggle"
import { InviteFriendsModal } from "@/components/invite-friends-modal"
import { useEffect, useState } from "react"

/**
 * Main navigation items for the sidebar
 */
const navigation = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Story Library", href: "/stories", icon: BookOpen },
  { name: "Voice Library", href: "/voices", icon: Mic },
  { name: "Clone a Voice", href: "/voices/clone", icon: Users },
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

    const fetchCounts = async () => {
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
        "flex items-center border-b h-20 transition-all",
        isCollapsed ? "justify-center px-2 flex-col gap-1" : "px-6"
      )}>
        <div className={cn(
          "flex items-center gap-2",
          isCollapsed && "flex-col gap-1"
        )}>
          <Link 
            href="/dashboard"
            className={cn(
              "font-semibold text-primary hover:opacity-80 transition-opacity",
              isCollapsed ? "text-xs leading-tight text-center" : "text-2xl"
            )}
            aria-label="Fable Together - Home"
          >
            {isCollapsed ? (
              <span className="block">
                <span className="block">Fable</span>
                <span className="block">Together</span>
              </span>
            ) : (
              "Fable Together"
            )}
          </Link>
          <Badge 
            variant="outline" 
            className={cn(
              "bg-orange-500/10 text-orange-600 border-orange-500/50 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/50 font-semibold",
              isCollapsed ? "text-[8px] px-1 py-0 h-4 leading-none" : ""
            )}
          >
            BETA
          </Badge>
        </div>
      </div>

      {/* Navigation */}
      <nav 
        className={cn(
          "flex-1 space-y-3 transition-all",
          isCollapsed ? "p-3" : "p-6"
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
                  isCollapsed ? "justify-center py-3 px-2" : "gap-4 text-base font-medium py-3 px-4",
                  isActive ? "sidebar-item-active" : "text-muted-foreground hover:text-foreground",
                )}
                aria-current={isActive ? "page" : undefined}
                aria-label={isCollapsed ? `${item.name}${showCount ? `, ${count} items` : ""}` : undefined}
              >
                <item.icon 
                  className={cn(
                    "icon-accent flex-shrink-0",
                    isCollapsed ? "h-5 w-5" : "h-6 w-6"
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
                    {isActive && (
                      <div 
                        className="ml-auto h-2 w-2 rounded-full bg-primary-foreground" 
                        aria-hidden="true"
                        aria-label="Current page indicator"
                      />
                    )}
                  </>
                )}
              </Link>
            )

            if (isCollapsed) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    {linkContent}
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.name}</p>
                    {showCount && <p className="text-xs opacity-75">{count} items</p>}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return linkContent
          })}
        </TooltipProvider>
      </nav>

      {/* Theme Toggle for Mobile */}
      {!isCollapsed && (
        <div className="border-t bg-muted/30 p-4 md:hidden">
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
                  <p>Invite Friends</p>
                  <p className="text-xs opacity-75">Earn 50 tokens</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ) : (
          <div className="p-4">
            <div className="card-elevated p-4">
              <div className="flex items-center gap-2 mb-3">
                <Share2 className="h-4 w-4 text-primary" aria-hidden="true" />
                <h3 className="text-sm font-semibold">Invite Friends</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                Share Fable Together with friends and family. Help them discover the magic of AI-powered storytelling.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full h-auto py-2 text-xs mb-3 bg-primary/10 hover:bg-primary/20 text-primary border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={() => setIsInviteModalOpen(true)}
                aria-label="Open invite friends modal"
              >
                <Share2 className="h-3 w-3 mr-1.5" aria-hidden="true" />
                <span>Invite Someone</span>
              </Button>
              <div className="p-2 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-xs text-muted-foreground text-center">
                  Earn <span className="font-semibold text-primary">50 tokens</span> when they sign up
                </p>
              </div>
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
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Toggle mobile sidebar">
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SidebarContent />
      </SheetContent>
    </Sheet>
  )
}

// Main Sidebar Component
export function AppSidebar() {
  const isMobile = useIsMobile()
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-collapsed')
      return saved === 'true'
    }
    return false
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', String(isCollapsed))
    }
  }, [isCollapsed])

  if (isMobile) {
    return null // Mobile sidebar is handled by MobileSidebarTrigger
  }

  return (
    <div className="relative h-screen overflow-visible">
      {/* Sidebar with slide animation */}
      <aside 
        className={cn(
          "flex h-screen flex-col border-r bg-card transition-all duration-300 ease-in-out relative z-10",
      isCollapsed ? "w-16" : "w-64"
        )}
        style={{
          transform: isCollapsed ? 'translateX(calc(-100% + 4rem))' : 'translateX(0)',
        }}
      >
      <SidebarContent isCollapsed={isCollapsed} />
      
        {/* Toggle Button - Standard Design */}
      <div className={cn(
          "absolute top-20 transition-all duration-300 ease-in-out z-20",
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

