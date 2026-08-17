"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggleSlide() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Get current theme index (0: light, 1: dark)
  const themes = ['light', 'dark'] as const
  // If theme is 'system', default to light for display
  const currentTheme = mounted ? (theme === 'system' ? 'light' : (theme === 'dark' ? 'dark' : 'light')) : 'light'
  const currentIndex = themes.indexOf(currentTheme as typeof themes[number])

  const handleClick = () => {
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  // Get icon for current theme
  const getThemeIcon = () => {
    if (!mounted) return <Sun className="h-4 w-4" />
    return currentTheme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />
  }

  if (!mounted) {
    return (
      <div className="relative inline-flex h-9 w-16 items-center rounded-full bg-muted p-1">
        <div className="absolute left-1 top-1 h-7 w-7 rounded-full bg-background shadow-sm transition-transform" />
      </div>
    )
  }

  // Calculate thumb position: starts at 4px (left-1)
  // Track width: 64px (w-16), padding: 8px total, thumb: 28px (h-7 w-7)
  // Available space: 64 - 8 - 28 = 28px for movement (2 positions: 0 and 1)
  // Position 0 (light): 4px, Position 1 (dark): 4 + 28 = 32px
  const thumbPosition = 4 + currentIndex * 28

  return (
    <button
      onClick={handleClick}
      className="relative inline-flex h-9 w-16 items-center rounded-full bg-muted p-1 transition-colors hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      aria-label={`Switch theme. Current: ${currentTheme}`}
      type="button"
    >
      {/* Background track with icons */}
      <div className="absolute inset-0 flex items-center justify-around px-2.5">
        <Sun className="h-3.5 w-3.5 text-muted-foreground" />
        <Moon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      {/* Sliding thumb */}
      <div
        className="absolute top-1 h-7 w-7 rounded-full bg-background shadow-sm transition-all duration-300 ease-in-out flex items-center justify-center border border-border/50"
        style={{
          left: `${thumbPosition}px`,
        }}
      >
        <div className="text-primary">
          {getThemeIcon()}
        </div>
      </div>
    </button>
  )
}
