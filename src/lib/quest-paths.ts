import { BookOpen, Sparkles, Users, LucideIcon } from "lucide-react"

export interface QuestPath {
  id: string
  name: string
  description: string
  icon: LucideIcon
  color: {
    bg: string
    icon: string
    darkBg: string
    darkIcon: string
  }
  pathParam: string
}

/**
 * Shared quest paths configuration
 * Update this file to add, remove, or modify quest paths.
 * Changes will automatically reflect on both Dashboard and Quests pages.
 */
export const QUEST_PATHS: QuestPath[] = [
  {
    id: "explore",
    name: "Explore Platform",
    description: "Discover stories, voices, and features to get familiar with Fable Together",
    icon: BookOpen,
    color: {
      bg: "bg-blue-100",
      icon: "text-blue-600",
      darkBg: "dark:bg-blue-900/30",
      darkIcon: "dark:text-blue-400",
    },
    pathParam: "explore",
  },
  {
    id: "create",
    name: "Create Content",
    description: "Learn to create stories, clone voices, and bring your ideas to life",
    icon: Sparkles,
    color: {
      bg: "bg-purple-100",
      icon: "text-purple-600",
      darkBg: "dark:bg-purple-900/30",
      darkIcon: "dark:text-purple-400",
    },
    pathParam: "create",
  },
  {
    id: "community",
    name: "Community",
    description: "Connect with others, share stories, and participate in community activities",
    icon: Users,
    color: {
      bg: "bg-green-100",
      icon: "text-green-600",
      darkBg: "dark:bg-green-900/30",
      darkIcon: "dark:text-green-400",
    },
    pathParam: "community",
  },
]

/**
 * Get a quest path by its ID or path parameter
 */
export function getQuestPathById(id: string): QuestPath | undefined {
  return QUEST_PATHS.find((path) => path.id === id || path.pathParam === id)
}

/**
 * Get quest path by path parameter (from URL query)
 */
export function getQuestPathByParam(param: string): QuestPath | undefined {
  return QUEST_PATHS.find((path) => path.pathParam === param)
}
