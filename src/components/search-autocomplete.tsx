"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, BookOpen, Mic } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { isDemoMode } from "@/lib/app-mode"
import { DEMO_STORIES } from "@/lib/services/demo/story-repository"
import { getDemoVoices } from "@/lib/services/demo/state"

interface SearchResult {
  id: string
  title?: string
  name?: string
  type: "story" | "voice"
  isExample?: boolean
}

export function SearchAutocomplete() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (query.length < 1) {
      setResults([])
      setIsOpen(false)
      return
    }

    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        if (isDemoMode()) {
          const normalized = query.trim().toLowerCase()
          const localResults: SearchResult[] = [
            ...DEMO_STORIES.filter((story) => `${story.title} ${story.summary}`.toLowerCase().includes(normalized)).map((story) => ({ id: String(story.id), title: story.title, type: "story" as const, isExample: true })),
            ...getDemoVoices().filter((voice) => `${voice.name} ${voice.description} ${voice.tags?.join(" ")}`.toLowerCase().includes(normalized)).map((voice) => ({ id: voice.id, name: voice.name, type: "voice" as const })),
          ]
          setResults(localResults.slice(0, 10))
          setIsOpen(localResults.length > 0)
          return
        }
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await response.json()
        
        const allResults: SearchResult[] = [
          ...(data.stories || []),
          ...(data.voices || [])
        ]
        
        setResults(allResults.slice(0, 10))
        setIsOpen(allResults.length > 0)
      } catch (error) {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.error("Search error:", error)
        }
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 200) // Reduced debounce for faster response on single character

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query])

  const handleSelect = (result: SearchResult) => {
    if (result.type === "story") {
      router.push(`/stories?story=${result.id}`)
    } else if (result.type === "voice") {
      router.push(`/voices#voice-${result.id}`)
    }
    setQuery("")
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative flex-1 max-w-full sm:max-w-lg min-w-0">
      <Search className="absolute left-2.5 sm:left-3 md:left-4 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 -translate-y-1/2 text-muted-foreground icon-accent flex-shrink-0 pointer-events-none" />
      <Input
        type="search"
        placeholder="Search stories and voices..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (results.length > 0) setIsOpen(true)
        }}
        className="input-field pl-8 sm:pl-10 md:pl-12 h-9 sm:h-10 md:h-12 text-xs sm:text-sm md:text-base hidden md:block"
        aria-label="Search stories and voices"
      />
      <Input
        type="search"
        placeholder="Search stories and voices..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (results.length > 0) setIsOpen(true)
        }}
        className="input-field pl-8 sm:pl-10 md:pl-12 h-9 sm:h-10 md:h-12 text-xs sm:text-sm md:text-base block md:hidden"
      />

      {isOpen && (results.length > 0 || loading) && (
        <Card 
          className="absolute top-full mt-1 sm:mt-2 w-full max-w-[calc(100vw-2rem)] sm:max-w-full z-50 shadow-lg border"
          role="listbox"
          aria-label="Search results"
        >
          <CardContent className="p-1.5 sm:p-2">
            {loading ? (
              <div className="p-3 sm:p-4 text-center text-xs sm:text-sm text-muted-foreground">
                Searching...
              </div>
            ) : results.length > 0 ? (
              <>
                {results.some(r => r.type === "story") && (
                  <div>
                    <div className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-muted-foreground uppercase">
                      Stories
                    </div>
                    {results
                      .filter(r => r.type === "story")
                      .map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleSelect(result)}
                          className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg hover:bg-muted transition-colors text-left min-h-[44px] touch-manipulation"
                          aria-label={`Open story: ${result.title}`}
                        >
                          <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate text-sm sm:text-base">{result.title}</div>
                          </div>
                        </button>
                      ))}
                  </div>
                )}
                {results.some(r => r.type === "voice") && (
                  <div>
                    <div className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-muted-foreground uppercase">
                      Voices
                    </div>
                    {results
                      .filter(r => r.type === "voice")
                      .map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleSelect(result)}
                          className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg hover:bg-muted transition-colors text-left min-h-[44px] touch-manipulation"
                          aria-label={`View voice: ${result.name}`}
                        >
                          <Mic className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                          <div className="font-medium truncate text-sm sm:text-base">{result.name}</div>
                        </button>
                      ))}
                  </div>
                )}
              </>
            ) : (
              <div className="p-3 sm:p-4 text-center text-xs sm:text-sm text-muted-foreground">
                No results found
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

