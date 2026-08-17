/**
 * Application Header Component
 * 
 * Main navigation header for the dashboard with:
 * - Mobile sidebar trigger
 * - Global search functionality
 * - User profile avatar
 * - Credits display
 * - Notifications dropdown
 * - Theme toggle
 * - Sign out button
 * 
 * Fully responsive with mobile-first design.
 */

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SignOutButton } from "@/components/auth/sign-out-button"
import { MobileSidebarTrigger } from "@/components/app-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { SearchAutocomplete } from "@/components/search-autocomplete"
import { CreditsDisplay } from "@/components/credits-display"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { createSupabaseBrowserClient } from "@/lib/supabase-browser"

interface UserProfile {
  id: string
  display_name: string
  avatar_url?: string
}

interface AppHeaderProps {
  user?: UserProfile | null
}

/**
 * Extracts initials from a user's name for avatar display
 * 
 * @param name - User's display name
 * @returns Initials string (2 characters) or empty string if invalid
 */
const getInitials = (name: string | null | undefined) => {
  // Don't show default 'U' - only show initials when we have a valid name
  if (!name || name === 'User') {
    return ''
  }
  
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

/**
 * Main application header component
 * 
 * Displays navigation, search, user profile, and action buttons.
 * Automatically fetches user data if not provided as prop.
 * 
 * @param propUser - Optional user profile data (if not provided, fetches from Supabase)
 */
export function AppHeader({ user: propUser }: AppHeaderProps) {
  const [user, setUser] = useState<UserProfile | null>(propUser || null)

  // Fetch user data if not provided as prop
  useEffect(() => {
    if (propUser) {
      setUser(propUser)
      return
    }

    const fetchUser = async () => {
      try {
        const supabase = createSupabaseBrowserClient()
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        if (authUser) {
          // Fetch user profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, display_name, avatar_url")
            .eq("id", authUser.id)
            .single()

          if (profile) {
            setUser({
              id: profile.id,
              display_name: profile.display_name || authUser.email?.split('@')[0] || 'User',
              avatar_url: profile.avatar_url || undefined,
            })
          } else {
            // Fallback to auth user data
            setUser({
              id: authUser.id,
              display_name: authUser.email?.split('@')[0] || 'User',
              avatar_url: undefined,
            })
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error)
      }
    }

    fetchUser()
  }, [propUser])
  return (
    <header 
      className="app-header sticky top-0 z-10 flex h-16 sm:h-20 items-center gap-1.5 sm:gap-2 md:gap-4 lg:gap-6 px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40"
      role="banner"
      aria-label="Main navigation"
    >
      {/* Mobile Menu Trigger */}
      <MobileSidebarTrigger />
      
      {/* Search - Always visible, compact on mobile */}
      <div className="flex-1 min-w-0 max-w-full flex items-center gap-2" role="search" aria-label="Search stories, voices, and projects">
        <SearchAutocomplete />
      </div>

      {/* Actions */}
      <nav className="flex items-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-3 xl:gap-4 ml-auto flex-shrink-0" aria-label="User actions">
        {/* Credits Display - Always visible, icon-only on very small screens */}
        <div className="flex items-center">
          <CreditsDisplay />
        </div>
        
        {/* Notifications Dropdown */}
        <NotificationsDropdown />
        <ThemeToggle />
        {user?.display_name && (
          <Link 
            href="/profile" 
            aria-label={`View profile for ${user.display_name}`}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full"
          >
            <Avatar className="avatar-ring h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 cursor-pointer bg-primary hover:ring-2 hover:ring-primary transition-all">
              <AvatarImage src={user.avatar_url} alt={`${user.display_name} profile picture`} />
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm sm:text-base md:text-lg" aria-hidden="true">
                {getInitials(user.display_name)}
              </AvatarFallback>
            </Avatar>
          </Link>
        )}
        <div className="hidden sm:block">
          <SignOutButton />
        </div>
      </nav>
    </header>
  )
}
