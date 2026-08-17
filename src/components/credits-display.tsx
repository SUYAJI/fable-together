"use client"

import { useEffect, useState, useCallback, memo } from "react"
import { Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface CreditsBalance {
  total: number
  available: number
  transactions?: Array<{
    amount: number
    source: string
    date: string
  }>
}

export const CreditsDisplay = memo(function CreditsDisplay() {
  const [credits, setCredits] = useState<CreditsBalance | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        // Add timeout to prevent hanging requests
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

        const response = await fetch("/api/user/credits", {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()
          setCredits({
            total: data.total || 0,
            available: data.available || 0,
            transactions: data.transactions || [],
          })
        } else {
          // Handle non-OK responses (401, 500, etc.) gracefully
          setCredits({
            total: 0,
            available: 0,
            transactions: [],
          })
        }
      } catch (error: unknown) {
        // Network errors, timeouts, or other fetch failures - set defaults
        setCredits({
          total: 0,
          available: 0,
          transactions: [],
        })
        // Only log in development and only if it's not an abort
        if (process.env.NODE_ENV === 'development' && error instanceof Error && error.name !== 'AbortError') {
          console.error("Error fetching credits:", error)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchCredits()
    
    // Refresh credits periodically (every 30 seconds) to catch quest completion updates
    const interval = setInterval(fetchCredits, 30000)
    return () => clearInterval(interval)
  }, [])

  // Refresh function that can be called externally
  const refreshCredits = useCallback(async () => {
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch("/api/user/credits", {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        setCredits({
          total: data.total || 0,
          available: data.available || 0,
          transactions: data.transactions || [],
        })
      } else {
        // Handle non-OK responses gracefully
        setCredits(prev => prev || {
          total: 0,
          available: 0,
          transactions: [],
        })
      }
    } catch (error: unknown) {
      // Network errors, timeouts - keep existing credits or set defaults
      setCredits(prev => prev || {
        total: 0,
        available: 0,
        transactions: [],
      })
      // Only log in development and only if it's not an abort
      if (process.env.NODE_ENV === 'development' && error instanceof Error && error.name !== 'AbortError') {
        console.error("Error fetching credits:", error)
      }
    }
  }, [])

  // Expose refresh function via custom event
  useEffect(() => {
    const handleCreditsRefresh = () => {
      refreshCredits()
    }
    
    window.addEventListener("credits-refresh", handleCreditsRefresh)
    return () => window.removeEventListener("credits-refresh", handleCreditsRefresh)
  }, [])

  if (loading) {
    return (
      <Button variant="ghost" size="sm" className="gap-1 sm:gap-2 h-8 sm:h-9 px-1.5 sm:px-2 md:px-3" disabled>
        <Coins className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400" />
        <span className="hidden md:inline text-xs sm:text-sm">Loading...</span>
      </Button>
    )
  }

  const available = credits?.available || 0

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 sm:gap-2 h-8 sm:h-9 px-1.5 sm:px-2 md:px-3 min-w-[32px] sm:min-w-[auto]">
          <Coins className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="font-medium text-xs sm:text-sm whitespace-nowrap">{available}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-semibold mb-1">Credits</h4>
            <p className="text-xs text-muted-foreground">
              Credits are used to generate stories and clone voices
            </p>
          </div>
          
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Available</span>
              <span className="text-sm font-semibold">{available}</span>
            </div>
            {credits && credits.total !== credits.available && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Earned</span>
                <span className="text-sm font-semibold">{credits.total}</span>
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          {credits?.transactions && credits.transactions.length > 0 && (
            <div className="pt-2 border-t">
              <h5 className="text-xs font-semibold mb-2 text-muted-foreground">Recent Activity</h5>
              <div className="space-y-2">
                {credits.transactions.map((transaction, index) => {
                  const date = new Date(transaction.date)
                  const timeAgo = getTimeAgo(date)
                  
                  return (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{transaction.source}</p>
                        <p className="text-muted-foreground">{timeAgo}</p>
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          +{transaction.amount}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Complete quests to earn more credits!
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
})

// Helper function to format time ago
function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return "Just now"
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}m ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}h ago`
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}d ago`
  } else {
    return date.toLocaleDateString()
  }
}

// Helper function to trigger credits refresh from other components
export function refreshCreditsDisplay() {
  window.dispatchEvent(new CustomEvent("credits-refresh"))
}
