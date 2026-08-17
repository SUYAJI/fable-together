"use client"

import { useEffect, useState, useRef } from "react"
import { usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"

export function NavigationProgress() {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Reset when route changes complete
    setIsLoading(false)
    setProgress(0)
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }
  }, [pathname])

  useEffect(() => {
    // Handle link clicks
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

      // Skip dashboard routes - they have their own navigation progress
      const dashboardRoutes = ['/dashboard', '/stories', '/voices', '/profile', '/quests', '/insights', '/creator', '/settings']
      const isDashboardRoute = dashboardRoutes.some(route => href.startsWith(route))
      const isCurrentlyOnDashboard = dashboardRoutes.some(route => pathname?.startsWith(route))
      
      // If navigating between dashboard routes or already on dashboard, skip global progress
      if (isDashboardRoute && isCurrentlyOnDashboard) {
        return
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

    document.addEventListener('click', handleClick, true)

    return () => {
      document.removeEventListener('click', handleClick, true)
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [pathname])

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-background/90 backdrop-blur-md flex items-center justify-center pointer-events-none transition-opacity duration-300">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        <div className="w-64 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-150 ease-out"
            style={{ width: `${Math.min(progress, 95)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

