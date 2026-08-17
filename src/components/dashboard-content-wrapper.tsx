/**
 * Dashboard Content Wrapper Component
 * 
 * Provides smooth fade-in/fade-out transitions for dashboard route changes.
 * Optimized to only transition on pathname changes, not content updates.
 * 
 * Features:
 * - Smooth initial fade-in on mount
 * - Route change transitions (fade out → update → fade in)
 * - Prevents transitions on content-only updates
 * - Disables pointer events during transitions
 */

"use client"

import { useEffect, useState, useRef } from "react"
import { usePathname } from "next/navigation"

interface DashboardContentWrapperProps {
  children: React.ReactNode
}

/**
 * Wraps dashboard content with optimized transition animations
 * 
 * @param children - Dashboard content to wrap
 */
export function DashboardContentWrapper({ children }: DashboardContentWrapperProps) {
  const pathname = usePathname()
  const [displayChildren, setDisplayChildren] = useState(children)
  const [isVisible, setIsVisible] = useState(false) // Start hidden for initial fade-in
  const [isTransitioning, setIsTransitioning] = useState(false)
  const previousPathnameRef = useRef<string | null>(null)
  const initialMountRef = useRef(true)

  // Handle initial mount - smooth fade in
  useEffect(() => {
    if (initialMountRef.current) {
      initialMountRef.current = false
      setDisplayChildren(children)
      // Smooth initial fade-in
      const fadeInTimeout = setTimeout(() => {
        setIsVisible(true)
      }, 50) // Small delay to prevent flash
      return () => clearTimeout(fadeInTimeout)
    }
  }, [])

  // Only transition on pathname changes, not content updates
  useEffect(() => {
    const currentPath = pathname || ''
    const previousPath = previousPathnameRef.current

    // Only trigger transition if pathname actually changed
    if (previousPath !== null && previousPath !== currentPath) {
      setIsTransitioning(true)
      setIsVisible(false)
      
      let fadeInTimeout: NodeJS.Timeout | null = null
      
      // Wait for fade-out, then update content, then fade-in smoothly
      const fadeOutTimeout = setTimeout(() => {
        setDisplayChildren(children)
        
        // Wait a brief moment for loading overlay to disappear, then fade in
        fadeInTimeout = setTimeout(() => {
          setIsVisible(true)
          // Keep transitioning state a bit longer for smooth animation
          setTimeout(() => {
            setIsTransitioning(false)
          }, 300)
        }, 100) // Small delay to let loading overlay fade out first
      }, 200) // Fade out duration

      return () => {
        clearTimeout(fadeOutTimeout)
        if (fadeInTimeout) {
          clearTimeout(fadeInTimeout)
        }
      }
    } else {
      // Just update children without transition for content updates
      setDisplayChildren(children)
      // Ensure visible if not transitioning
      if (!isTransitioning) {
        setIsVisible(true)
      }
    }

    // Update ref after processing
    previousPathnameRef.current = currentPath
  }, [pathname, isTransitioning])

  // Update children when they change (without triggering transition)
  useEffect(() => {
    // Only update if not currently transitioning
    if (!isTransitioning && !initialMountRef.current) {
      setDisplayChildren(children)
    }
  }, [children, isTransitioning])

  return (
    <div
      className={`transition-opacity duration-500 ease-out ${
        isVisible ? "opacity-100" : "opacity-0"
      } ${isTransitioning ? "pointer-events-none" : ""}`}
      style={{ willChange: 'opacity' }}
    >
      {displayChildren}
    </div>
  )
}
