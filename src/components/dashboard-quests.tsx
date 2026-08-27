"use client"

import { SimpleQuestCard } from "@/components/simple-quest-card"
import { SIMPLE_QUESTS } from "@/lib/simple-quests"
import { DEMO_QUEST_CARDS } from "@/lib/demo-quest-cards"
import { useState, useEffect } from "react"
import { isDemoMode } from "@/lib/app-mode"
import { getDemoState, subscribeDemoState } from "@/lib/services/demo/state"

interface QuestStatus {
  id: string
  completed: boolean
}

/**
 * Interface for API quest response
 */
interface ApiQuestStatus {
  id: string
  completed: boolean
  completedAt?: string | null
  tokensAwarded?: number
}

/**
 * Dashboard quests component
 * 
 * Displays all available quests with their completion status
 */
export function DashboardQuests() {
  const [questStatuses, setQuestStatuses] = useState<QuestStatus[]>([])

  useEffect(() => {
    if (isDemoMode()) {
      const sync = () => setQuestStatuses(getDemoState().quests.map((quest) => ({ id: quest.id, completed: quest.status === "completed" })))
      sync()
      return subscribeDemoState(sync)
    }
    const loadQuestStatuses = async () => {
      try {
        const response = await fetch("/api/quests/complete")
        if (response.ok) {
          const data = await response.json()
          if (data.quests) {
            setQuestStatuses(data.quests.map((q: ApiQuestStatus) => ({
              id: q.id,
              completed: q.completed,
            })))
            return
          }
        }
      } catch {}

      // Fallback to localStorage
      if (typeof window !== "undefined") {
        const statuses: QuestStatus[] = SIMPLE_QUESTS.map(quest => ({
          id: quest.id,
          completed: localStorage.getItem(`quest-${quest.id}-completed`) === "true",
        }))
        setQuestStatuses(statuses)
      }
    }

    loadQuestStatuses()

    // Refresh periodically
    const interval = setInterval(loadQuestStatuses, 10000)
    return () => clearInterval(interval)
  }, [])

  const getQuestStatus = (questId: string): boolean => {
    return questStatuses.find(s => s.id === questId)?.completed || false
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {(isDemoMode() ? DEMO_QUEST_CARDS : SIMPLE_QUESTS).map((quest) => {
        const completed = getQuestStatus(quest.id)
        return (
          <SimpleQuestCard
            key={quest.id}
            quest={quest}
            completed={completed}
          />
        )
      })}
    </div>
  )
}
