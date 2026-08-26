"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { SimpleQuestCard } from "@/components/simple-quest-card"
import { SIMPLE_QUESTS } from "@/lib/simple-quests"
import { DEMO_QUEST_CARDS } from "@/lib/demo-quest-cards"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { isDemoMode } from "@/lib/app-mode"
import { getDemoState, subscribeDemoState } from "@/lib/services/demo/state"

interface QuestStatus {
  id: string
  completed: boolean
  completedAt: string | null
  tokensAwarded: number
}

export default function QuestsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [questStatuses, setQuestStatuses] = useState<QuestStatus[]>([])
  const [initialLoading, setInitialLoading] = useState(true)

  // Load quest statuses
  useEffect(() => {
    if (isDemoMode()) {
      const sync = () => {
        setQuestStatuses(getDemoState().quests.map((quest) => ({
          id: quest.id,
          completed: quest.status === "completed",
          completedAt: quest.completed_at,
          tokensAwarded: quest.status === "completed" ? quest.credits_reward : 0,
        })))
        setInitialLoading(false)
      }
      sync()
      return subscribeDemoState(sync)
    }

    const loadQuestStatuses = async (isInitialLoad: boolean = false) => {
      try {
        // Only show loading state on initial load
        if (isInitialLoad) {
          setInitialLoading(true)
        }
        
        // Try to fetch from API (for authenticated users)
        const response = await fetch("/api/quests/complete")
        
        if (response.ok) {
          const data = await response.json()
          if (data.quests) {
            setQuestStatuses(data.quests)
            if (isInitialLoad) {
              setInitialLoading(false)
            }
            return
          }
        }

        // Fallback to localStorage (for unauthenticated users)
        if (typeof window !== "undefined") {
          const statuses: QuestStatus[] = SIMPLE_QUESTS.map(quest => {
            const completed = localStorage.getItem(`quest-${quest.id}-completed`) === "true"
            return {
              id: quest.id,
              completed,
              completedAt: completed ? new Date().toISOString() : null,
              tokensAwarded: completed ? quest.reward : 0,
            }
          })
          setQuestStatuses(statuses)
          if (isInitialLoad) {
            setInitialLoading(false)
          }
        }
      } catch (error) {
        console.error("Error loading quest statuses:", error)
        // Fallback to localStorage
        if (typeof window !== "undefined") {
          const statuses: QuestStatus[] = SIMPLE_QUESTS.map(quest => {
            const completed = localStorage.getItem(`quest-${quest.id}-completed`) === "true"
            return {
              id: quest.id,
              completed,
              completedAt: completed ? new Date().toISOString() : null,
              tokensAwarded: completed ? quest.reward : 0,
            }
          })
          setQuestStatuses(statuses)
          if (isInitialLoad) {
            setInitialLoading(false)
          }
        }
      }
    }

    // Initial load with loading state
    loadQuestStatuses(true)

    // Refresh quest statuses periodically in the background (no loading state)
    const interval = setInterval(() => loadQuestStatuses(false), 5000)
    return () => clearInterval(interval)
  }, [])

  const getQuestStatus = (questId: string): QuestStatus | undefined => {
    return questStatuses.find(s => s.id === questId)
  }

  const totalCompleted = questStatuses.filter(s => s.completed).length
  const totalTokens = questStatuses.reduce((sum, s) => sum + s.tokensAwarded, 0)
  const visibleQuests = isDemoMode() ? DEMO_QUEST_CARDS : SIMPLE_QUESTS

  return (
    <div className="flex h-screen">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main id="main-content" className="flex-1 overflow-y-auto bg-background dark:bg-[#1a1a1a]" role="main" tabIndex={-1}>
          <div className="mx-auto max-w-full px-4 sm:max-w-4xl sm:px-6 lg:max-w-6xl lg:px-8 xl:max-w-7xl pt-6 sm:pt-8 md:pt-10 pb-8 sm:pb-12 md:pb-16">
            {/* Header Section */}
            <div className="mb-8 sm:mb-12 md:mb-16">
              <div className="text-xs sm:text-sm uppercase tracking-wide text-muted-foreground mb-3 sm:mb-4">
                Quests
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
                Complete Quests, Earn Tokens
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-3xl leading-relaxed">
                Complete these quests automatically as you use the platform. Each quest rewards tokens that you can use to create stories and audio.
              </p>
              {totalCompleted > 0 && (
                <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{totalCompleted} of {visibleQuests.length} quests completed</span>
                  {totalTokens > 0 && (
                    <span>• {totalTokens} tokens earned</span>
                  )}
                </div>
              )}
            </div>

            {/* Quest Cards */}
            {initialLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground">Loading quests...</div>
              </div>
            ) : (
              <div className="space-y-6 sm:space-y-8">
                {visibleQuests.map((quest) => {
                  const status = getQuestStatus(quest.id)
                  const completed = status?.completed || false

                  return (
                    <SimpleQuestCard
                      key={quest.id}
                      quest={quest}
                      completed={completed}
                    />
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
