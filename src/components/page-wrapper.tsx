/**
 * Page Wrapper Component
 * 
 * Provides smooth page transitions for non-dashboard routes.
 * Dashboard routes handle their own transitions internally.
 * 
 * Features:
 * - Fade-in/fade-out animations on route changes
 * - Error boundary wrapping for error handling
 * - Skips transitions for dashboard routes (performance optimization)
 */

"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { ErrorBoundary } from "./error-boundary"

interface PageWrapperProps {
  children: React.ReactNode
}

/**
 * Wraps page content with transition animations and error handling
 * 
 * @param children - Page content to wrap
 */
export function PageWrapper({ children }: PageWrapperProps) {
  const pathname = usePathname()
  const [displayChildren, setDisplayChildren] = useState(children)
  const [isVisible, setIsVisible] = useState(true)

  // Check if we're on a dashboard route
  const dashboardRoutes = ['/dashboard', '/stories', '/voices', '/profile', '/quests', '/insights', '/creator', '/settings']
  const isDashboardRoute = dashboardRoutes.some(route => pathname?.startsWith(route))

  useEffect(() => {
    // Skip transitions for dashboard routes - they handle their own
    if (isDashboardRoute) {
      setDisplayChildren(children)
      setIsVisible(true)
      return
    }

    // Fade out when pathname changes (non-dashboard routes)
    setIsVisible(false)
    
    const timeout = setTimeout(() => {
      setDisplayChildren(children)
      setIsVisible(true)
    }, 200) // Duration of fade-out animation

    return () => clearTimeout(timeout)
  }, [pathname, children, isDashboardRoute])

  // For dashboard routes, don't apply transitions (they handle it internally)
  if (isDashboardRoute) {
    return <ErrorBoundary>{children}</ErrorBoundary>
  }

  return (
    <ErrorBoundary>
      <div
        className={`transition-opacity duration-300 ease-in-out ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        style={{ willChange: 'opacity' }}
      >
        {displayChildren}
      </div>
    </ErrorBoundary>
  )
}

