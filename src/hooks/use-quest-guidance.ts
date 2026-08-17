"use client"

import { useState, useEffect, useCallback } from "react"
import { usePathname } from "next/navigation"

interface QuestTask {
  id: string
  title: string
  description: string
  instructions: string
  route: string
  questId: string
  questTitle: string
  taskNumber: number
  totalTasks: number
}

interface ActiveQuest {
  id: string
  slug: string
  title: string
  status: "in_progress" | "completed"
  progress: number
  progress_max: number
  credits_reward?: number
}

// Get current task based on quest progress (only for explore_platform quest)
function getCurrentTask(quest: ActiveQuest): QuestTask | null {
  // Only handle explore_platform quest
  if (quest.slug !== "explore_platform") return null
  
  const progress = quest.progress || 0
  const currentTaskNumber = progress + 1 // Task number is 1-indexed, progress is 0-indexed

  if (currentTaskNumber === 1) {
    return {
      id: "1",
      title: "Browse Story Library",
      description: "Explore example stories to see what's possible",
      instructions: "Go to the Story Library and browse through example stories. Click on any story to view its details and see how stories are structured.",
      route: "/stories",
      questId: quest.id,
      questTitle: quest.title,
      taskNumber: 1,
      totalTasks: 3,
    }
  } else if (currentTaskNumber === 2) {
    return {
      id: "2",
      title: "Explore Voice Library",
      description: "Discover available voices for narration",
      instructions: "Go to the Voice Library and listen to different voice previews. Explore the variety of voices available for narrating your stories.",
      route: "/voices",
      questId: quest.id,
      questTitle: quest.title,
      taskNumber: 2,
      totalTasks: 3,
    }
  } else if (currentTaskNumber === 3) {
    return {
      id: "3",
      title: "Create Your First Story",
      description: "Generate a personalized story using our AI",
      instructions: "Create your first story! Go to the Story Library and use the story creation tools to generate a personalized story.",
      route: "/stories",
      questId: quest.id,
      questTitle: quest.title,
      taskNumber: 3,
      totalTasks: 3,
    }
  }

  return null
}

// Get quest from localStorage (for unauthenticated users)
function getLocalQuest(questId: string): ActiveQuest | null {
  if (typeof window === "undefined") return null
  try {
    const stored = localStorage.getItem(`quest_${questId}`)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    // Ignore errors
  }
  return null
}

// Save quest to localStorage (for unauthenticated users)
function saveLocalQuest(quest: ActiveQuest) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(`quest_${quest.id}`, JSON.stringify(quest))
  } catch (e) {
    // Ignore errors
  }
}

export function useQuestGuidance() {
  const pathname = usePathname()
  const [activeQuest, setActiveQuest] = useState<ActiveQuest | null>(null)
  const [currentTask, setCurrentTask] = useState<QuestTask | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchActiveQuest = useCallback(async () => {
    try {
      setLoading(true)
      
      // Try to fetch from API first (for authenticated users)
      const response = await fetch("/api/quests/list")
      if (response.ok) {
        const data = await response.json()
        const allQuests = data.quests || []
        const inProgressQuests = allQuests.filter(
          (q: ActiveQuest) => q.status === "in_progress"
        )

        if (inProgressQuests.length > 0) {
          const quest = inProgressQuests[0]
          if (quest.slug) {
            // Ensure credits_reward is included
            const questWithCredits: ActiveQuest = {
              ...quest,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              credits_reward: (quest as any).credits_reward || 0,
            }
            setActiveQuest(questWithCredits)
            const task = getCurrentTask(questWithCredits)
            setCurrentTask(task)
            setLoading(false)
            return
          }
        }
      }

      // If no API quests, check localStorage (for unauthenticated users)
      // Only check explore_platform quest
      try {
        const questListResponse = await fetch("/api/quests/list")
        if (questListResponse.ok) {
          const questListData = await questListResponse.json()
          const allQuests = questListData.quests || []
          
          const localQuest = getLocalQuest("explore_platform")
          if (localQuest && localQuest.status === "in_progress") {
            // Find the quest in the list to get credits_reward
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const questDef = allQuests.find((q: any) => q.id === "explore_platform" || q.slug === "explore_platform")
            const questWithCredits: ActiveQuest = {
              ...localQuest,
              credits_reward: questDef?.credits_reward || 0,
            }
            setActiveQuest(questWithCredits)
            const task = getCurrentTask(questWithCredits)
            setCurrentTask(task)
            setLoading(false)
            return
          }
        }
      } catch (e) {
        // Fallback to localStorage without credits
        const localQuest = getLocalQuest("explore_platform")
        if (localQuest && localQuest.status === "in_progress") {
          setActiveQuest(localQuest)
          const task = getCurrentTask(localQuest)
          setCurrentTask(task)
          setLoading(false)
          return
        }
      }

      // No active quests found
      setActiveQuest(null)
      setCurrentTask(null)
    } catch (error) {
      console.error("[QuestGuidance] Error fetching active quest:", error)
      // Fallback to localStorage on error
      const localQuest = getLocalQuest("explore_platform")
      if (localQuest && localQuest.status === "in_progress") {
        setActiveQuest(localQuest)
        const task = getCurrentTask(localQuest)
        setCurrentTask(task)
        setLoading(false)
        return
      }
      setActiveQuest(null)
      setCurrentTask(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-complete tasks when user visits the required route
  useEffect(() => {
    if (!activeQuest || !currentTask || activeQuest.status === "completed") return

    // Check if current pathname matches the task route
    if (pathname === currentTask.route || pathname.startsWith(currentTask.route + "/")) {
      // Auto-complete the task after a short delay (user has visited the page)
      const timeout = setTimeout(async () => {
        // Only auto-complete if progress hasn't changed (avoid double-completion)
        const currentProgress = activeQuest.progress
        if (currentProgress < currentTask.taskNumber) {
          await completeTask()
        }
      }, 2000) // 2 second delay to ensure user actually visited the page

      return () => clearTimeout(timeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, activeQuest?.id, currentTask?.id])

  // Initial fetch and on pathname change
  useEffect(() => {
    fetchActiveQuest()
  }, [pathname, fetchActiveQuest])

  // Listen for quest refresh events
  useEffect(() => {
    const handleQuestRefresh = () => {
      fetchActiveQuest()
    }
    window.addEventListener("quest-refresh", handleQuestRefresh)
    return () => window.removeEventListener("quest-refresh", handleQuestRefresh)
  }, [fetchActiveQuest])

  // Background refresh every 30 seconds (only if there's an active quest)
  useEffect(() => {
    if (!activeQuest) return
    
    const interval = setInterval(() => {
      fetchActiveQuest()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [activeQuest, fetchActiveQuest])

  const completeTask = async () => {
    if (!activeQuest || !currentTask) return { completed: false, creditsAwarded: 0, questCompleted: false }

    try {
      const newProgress = Math.min((activeQuest.progress || 0) + 1, activeQuest.progress_max)
      const isCompleted = newProgress >= activeQuest.progress_max
      
      // Try API first (for authenticated users)
      const response = await fetch("/api/quests/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questId: activeQuest.id,
          increment: 1,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Update local state immediately
        const updatedQuest: ActiveQuest = {
          ...activeQuest,
          progress: newProgress,
          status: isCompleted ? "completed" : "in_progress",
        }
        setActiveQuest(updatedQuest)
        const nextTask = isCompleted ? null : getCurrentTask(updatedQuest)
        setCurrentTask(nextTask)
        
        return {
          completed: true,
          creditsAwarded: isCompleted ? (data.creditsAwarded || 0) : 0, // Only award on quest completion
          questCompleted: isCompleted,
        }
      }

      // If API fails (unauthenticated), use localStorage
      if (response.status === 401) {
        const updatedQuest: ActiveQuest = {
          ...activeQuest,
          progress: newProgress,
          status: isCompleted ? "completed" : "in_progress",
        }
        
        if (isCompleted) {
          // Remove from localStorage when completed
          localStorage.removeItem(`quest_${activeQuest.id}`)
        } else {
          saveLocalQuest(updatedQuest)
        }
        
        setActiveQuest(updatedQuest)
        const nextTask = isCompleted ? null : getCurrentTask(updatedQuest)
        setCurrentTask(nextTask)
        
        // For unauthenticated users, use credits_reward from activeQuest if available
        const creditsAwarded = isCompleted ? (activeQuest.credits_reward || 0) : 0
        
        return {
          completed: true,
          creditsAwarded,
          questCompleted: isCompleted,
        }
      }
    } catch {
      // On error, still update localStorage
      const newProgress = Math.min((activeQuest.progress || 0) + 1, activeQuest.progress_max)
      const isCompleted = newProgress >= activeQuest.progress_max
      
      const updatedQuest: ActiveQuest = {
        ...activeQuest,
        progress: newProgress,
        status: isCompleted ? "completed" : "in_progress",
      }
      
      if (isCompleted) {
        localStorage.removeItem(`quest_${activeQuest.id}`)
      } else {
        saveLocalQuest(updatedQuest)
      }
      
      setActiveQuest(updatedQuest)
      const nextTask = isCompleted ? null : getCurrentTask(updatedQuest)
      setCurrentTask(nextTask)
      
      return {
        completed: true,
        creditsAwarded: 0,
        questCompleted: isCompleted,
      }
    }

    return { completed: false, creditsAwarded: 0, questCompleted: false }
  }

  return {
    activeQuest,
    currentTask,
    loading,
    completeTask,
    fetchActiveQuest,
  }
}
