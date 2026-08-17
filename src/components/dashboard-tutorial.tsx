"use client"

import { useState, useEffect, useRef } from "react"
import { HelpCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const menuItems = [
  {
    name: "Home",
    href: "/dashboard",
    description: "Your main dashboard where you can see your stories, quests, and family activity. Start here to continue your storytelling journey."
  },
  {
    name: "Story Library",
    href: "/stories",
    description: "Browse and discover magical stories. Filter by category, view in grid or list, and listen to AI-narrated tales with synchronized word highlighting."
  },
  {
    name: "Voice Library",
    href: "/voices",
    description: "Manage your collection of voices. Browse preset voices, view your cloned voices, and preview how they sound before using them in stories."
  },
  {
    name: "Clone a Voice",
    href: "/voices/clone",
    description: "Create a digital copy of a family member's voice by recording a 60-second sample. Use cloned voices to narrate stories with familiar voices."
  },
  {
    name: "Quests",
    href: "/quests",
    description: "Complete quests to earn credits and unlock features. Track your progress and see rewards for completing onboarding tasks and challenges."
  },
  {
    name: "Insights",
    href: "/insights",
    description: "Track your family's storytelling journey with analytics. View total stories, listening time, community engagement, and active family members."
  },
  {
    name: "FAQ",
    href: "/creator",
    description: "Find answers to frequently asked questions about Fable Together. Learn about text-to-speech, voice cloning, multilingual support, and how to use our platform."
  },
  {
    name: "Settings",
    href: "/settings",
    description: "Manage your account settings, preferences, and app configuration. Customize your experience and control privacy options."
  }
]

interface TooltipPosition {
  x: number
  y: number
  width: number
  height: number
}

interface LinePath {
  startX: number
  startY: number
  endX: number
  endY: number
}

export function DashboardTutorial() {
  const [isOpen, setIsOpen] = useState(false)
  const [itemPositions, setItemPositions] = useState<TooltipPosition[]>([])
  const [linePaths, setLinePaths] = useState<LinePath[]>([])
  const [tooltipPositions, setTooltipPositions] = useState<TooltipPosition[]>([])
  const sidebarRef = useRef<HTMLElement | null>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])

  useEffect(() => {
    if (isOpen) {
      calculatePositions()
      const handleResize = () => calculatePositions()
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [isOpen])

  const calculatePositions = () => {
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      // Find sidebar element - try multiple selectors
      let sidebar: HTMLElement | null = null
      
      // Try data attribute first
      sidebar = document.querySelector('[data-slot="sidebar"]') as HTMLElement
      
      // Fallback to class-based selectors
      if (!sidebar) {
        sidebar = document.querySelector('.flex.h-screen.w-64') as HTMLElement ||
                  document.querySelector('.flex.h-screen.w-16') as HTMLElement ||
                  document.querySelector('aside') as HTMLElement
      }
      
      // Try finding by structure (sidebar is usually first child of flex container)
      if (!sidebar) {
        const flexContainer = document.querySelector('.flex.h-screen')
        if (flexContainer && flexContainer.firstElementChild) {
          sidebar = flexContainer.firstElementChild as HTMLElement
        }
      }

      if (!sidebar) {
        // Sidebar not found for tutorial
        return
      }

      sidebarRef.current = sidebar
      const sidebarRect = sidebar.getBoundingClientRect()
      const sidebarRight = sidebarRect.right
      const tooltipOffset = 24 // Increased spacing from sidebar
      const tooltipStartX = sidebarRight + tooltipOffset

      const positions: TooltipPosition[] = []
      const paths: LinePath[] = []
      const tooltips: TooltipPosition[] = []

      // Find all sidebar navigation items - be more specific
      const nav = sidebar.querySelector('nav')
      if (!nav) {
        // Navigation not found in sidebar
        return
      }

      const navItems = Array.from(nav.querySelectorAll('a[href^="/"]'))
        .filter(item => {
          const href = item.getAttribute('href')
          return menuItems.some(menuItem => menuItem.href === href)
        })
        .slice(0, menuItems.length)
      
      // Responsive grid calculation
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      // Determine columns based on viewport width
      let columnsPerRow = 4
      let responsiveTooltipWidth = 280
      let horizontalSpacing = 24
      const verticalSpacing = 20
      
      if (viewportWidth < 640) {
        // Mobile: 1 column
        columnsPerRow = 1
        responsiveTooltipWidth = Math.min(280, viewportWidth - tooltipStartX - 40)
      } else if (viewportWidth < 1024) {
        // Tablet: 2 columns
        columnsPerRow = 2
        responsiveTooltipWidth = Math.min(280, (viewportWidth - tooltipStartX - 60) / 2)
        horizontalSpacing = 20
      } else if (viewportWidth < 1536) {
        // Desktop: 3 columns
        columnsPerRow = 3
        responsiveTooltipWidth = Math.min(280, (viewportWidth - tooltipStartX - 80) / 3)
      }
      // Large desktop: 4 columns (default)
      
      const tooltipHeight = 140 // Increased height for better content display
      const tooltipPositions: TooltipPosition[] = []
      
      // Calculate grid starting position (higher on page - 15% from top instead of centered)
      const totalTooltipRows = Math.ceil(menuItems.length / columnsPerRow)
      const totalGridHeight = (totalTooltipRows * tooltipHeight) + ((totalTooltipRows - 1) * verticalSpacing)
      const gridStartY = Math.max(80, viewportHeight * 0.15) // Start at 15% from top, minimum 80px
      
      // Ensure grid doesn't overflow viewport
      const maxGridHeight = viewportHeight - gridStartY - 40 // 40px bottom padding
      const adjustedGridStartY = totalGridHeight > maxGridHeight 
        ? Math.max(80, viewportHeight - totalGridHeight - 40)
        : gridStartY
      
      navItems.forEach((item, index) => {
        if (index >= menuItems.length) return
        
        const itemRect = item.getBoundingClientRect()
        const itemCenterY = itemRect.top + itemRect.height / 2
        
        // Check if sidebar is collapsed (narrow width)
        const isCollapsed = sidebarRect.width < 100
        const itemCenterX = isCollapsed 
          ? sidebarRect.right // Use right edge if collapsed
          : itemRect.left + itemRect.width / 2

        // Calculate grid position
        const row = Math.floor(index / columnsPerRow)
        const col = index % columnsPerRow
        
        // Calculate tooltip position with proper spacing
        const tooltipX = tooltipStartX + (col * (responsiveTooltipWidth + horizontalSpacing))
        const tooltipY = adjustedGridStartY + (row * (tooltipHeight + verticalSpacing))
        
        // Ensure tooltip doesn't overflow viewport horizontally
        const maxTooltipX = viewportWidth - responsiveTooltipWidth - 20 // 20px right padding
        const finalTooltipX = Math.min(tooltipX, maxTooltipX)

        positions.push({
          x: itemRect.left,
          y: itemRect.top,
          width: itemRect.width,
          height: itemRect.height
        })

        const tooltipPos: TooltipPosition = {
          x: finalTooltipX,
          y: tooltipY,
          width: responsiveTooltipWidth,
          height: tooltipHeight
        }
        
        tooltipPositions.push(tooltipPos)
        tooltips.push(tooltipPos)

        // Calculate line path - from center/right of item to center of tooltip
        paths.push({
          startX: itemCenterX,
          startY: itemCenterY,
          endX: finalTooltipX + responsiveTooltipWidth / 2, // Center of tooltip horizontally
          endY: tooltipY + tooltipHeight / 2 // Center of tooltip vertically
        })
      })

      setItemPositions(positions)
      setTooltipPositions(tooltips)
      setLinePaths(paths)
    }, 100)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  return (
    <>
      {/* Question Mark Button - Hidden for now */}
      {false && (
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "fixed bottom-24 right-6 z-50 h-12 w-12 rounded-full",
            "bg-background border-2 shadow-lg hover:shadow-xl",
            "transition-all duration-200 hover:scale-110",
            "hover:bg-muted"
          )}
          onClick={() => setIsOpen(true)}
          aria-label="Open tutorial"
        >
          <HelpCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Tutorial Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 data-[state=open]:animate-in data-[state=open]:fade-in-0"
          onClick={handleOverlayClick}
          data-state="open"
        >
          {/* Grey Fade Overlay */}
          <div className="absolute inset-0 bg-black/50" />

          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute top-4 right-4 z-50 h-10 w-10 rounded-full",
              "bg-background/90 border shadow-lg",
              "hover:bg-background transition-all"
            )}
            onClick={handleClose}
            aria-label="Close tutorial"
          >
            <X className="h-5 w-5" />
          </Button>

          {/* SVG for Lines */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ overflow: 'visible', zIndex: 45 }}
          >
            {linePaths.map((path, index) => {
              // Calculate line length for dash array
              const lineLength = Math.sqrt(
                Math.pow(path.endX - path.startX, 2) + 
                Math.pow(path.endY - path.startY, 2)
              )
              
              return (
                <g key={index}>
                  {/* Animated line */}
                  <line
                    x1={path.startX}
                    y1={path.startY}
                    x2={path.endX}
                    y2={path.endY}
                    stroke="hsl(var(--primary))"
                    strokeWidth="1.5"
                    strokeDasharray={lineLength}
                    strokeDashoffset={lineLength}
                    className="animate-tutorial-line-draw"
                    style={{
                      animationDelay: `${index * 100 + 200}ms`,
                      strokeLinecap: 'round'
                    }}
                  />
                </g>
              )
            })}
          </svg>

          {/* Tooltips */}
          {tooltipPositions.map((tooltip, index) => {
            if (index >= menuItems.length) return null
            
            return (
              <div
                key={index}
                className={cn(
                  "absolute z-50 bg-card border-2 border-primary/20 rounded-lg shadow-xl",
                  "p-4 sm:p-5 data-[state=open]:animate-in data-[state=open]:fade-in-0",
                  "data-[state=open]:zoom-in-95"
                )}
                data-state="open"
                style={{
                  left: `${tooltip.x}px`,
                  top: `${tooltip.y}px`,
                  width: `${tooltip.width}px`,
                  maxWidth: '100%',
                  animationDelay: `${index * 50 + 300}ms`,
                  animationDuration: '200ms'
                }}
              >
                <h3 className="font-semibold text-sm sm:text-base mb-2 text-foreground">
                  {menuItems[index]?.name}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {menuItems[index]?.description}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

