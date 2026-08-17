"use client"

import { useEffect, useState, useRef } from "react"
import { usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"

export function DashboardNavigationProgress() {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // When route changes, if we're loading, complete and fade out smoothly
    if (isLoading) {
      // Complete the progress bar quickly
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
      
      // Quickly complete to 100%
      setProgress(100)
      
      // Wait a moment then fade out the loading overlay
      const fadeOutTimeout = setTimeout(() => {
        setIsLoading(false)
        setProgress(0)
      }, 250) // Brief delay to show completion
      
      return () => clearTimeout(fadeOutTimeout)
    } else {
      // Reset immediately if not loading (e.g., direct navigation)
      setProgress(0)
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
    }
  }, [pathname, isLoading])

  useEffect(() => {
    // Handle link clicks within dashboard navigation
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a[href]') as HTMLAnchorElement
      
      if (!link) return
      
      const href = link.getAttribute('href')
      if (!href) return

      // Skip external links, mailto, tel, anchors, and same-page links
      if (
        href.startsWith('http') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('#') ||
        href === pathname ||
        link.target === '_blank'
      ) {
        return
      }

      // Only handle dashboard/internal routes
      const dashboardRoutes = ['/dashboard', '/stories', '/voices', '/profile', '/quests', '/insights', '/creator', '/settings']
      const isDashboardRoute = dashboardRoutes.some(route => href.startsWith(route))
      
      if (!isDashboardRoute) {
        return // Let global NavigationProgress handle non-dashboard routes
      }

      // Start loading animation
      setIsLoading(true)
      setProgress(0)

      // Simulate progress bar
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) {
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current)
            }
            return prev
          }
          return prev + Math.random() * 10 + 5
        })
      }, 100)
    }

    // Listen on the document but filter for dashboard routes
    document.addEventListener('click', handleClick, true)

    return () => {
      document.removeEventListener('click', handleClick, true)
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [pathname])

  if (!isLoading) return null

  // Position relative to main content area, not full screen
  return (
    <div className={`absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center pointer-events-none transition-opacity duration-300 ease-out ${
      isLoading && progress < 100 ? "opacity-100" : "opacity-0"
    }`}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
        <div className="w-48 h-0.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-150 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
