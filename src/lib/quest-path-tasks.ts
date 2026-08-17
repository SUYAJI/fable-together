import { BookOpen, Mic, Sparkles, CheckCircle2, LucideIcon } from "lucide-react"
import { QUEST_PATHS, QuestPath } from "./quest-paths"

export interface QuestPathTask {
  id: string
  title: string
  description: string
  route: string
  icon: LucideIcon
  actionText?: string
  checkCompletion?: () => Promise<boolean> | boolean
}

export interface QuestPathConfig {
  path: QuestPath
  tasks: QuestPathTask[]
  creditsReward: number
}

/**
 * Quest path tasks configuration
 * Defines the steps for each quest path
 */
// Get paths from shared config
const explorePath = QUEST_PATHS.find(p => p.id === "explore")!
const createPath = QUEST_PATHS.find(p => p.id === "create")!
const communityPath = QUEST_PATHS.find(p => p.id === "community")!

export const QUEST_PATH_CONFIGS: Record<string, QuestPathConfig> = {
  explore: {
    path: explorePath,
    tasks: [
      {
        id: "browse-stories",
        title: "Browse Story Library",
        description: "Explore example stories to see what's possible",
        route: "/stories",
        icon: BookOpen,
        actionText: "Go to Stories",
      },
      {
        id: "choose-story",
        title: "Choose a Story",
        description: "Select a story from the library to customize",
        route: "/stories",
        icon: BookOpen,
        actionText: "Select Story",
      },
      {
        id: "customize-voice",
        title: "Customize Voice",
        description: "Select and customize a voice for your story",
        route: "/stories",
        icon: Mic,
        actionText: "Customize Voice",
      },
      {
        id: "save-story",
        title: "Save Your Story",
        description: "Save your customized story to your library",
        route: "/stories",
        icon: CheckCircle2,
        actionText: "Save Story",
      },
    ],
    creditsReward: 30,
  },
  create: {
    path: createPath,
    tasks: [
      {
        id: "explore-voices",
        title: "Explore Voice Library",
        description: "Browse available voices in your library",
        route: "/voices",
        icon: Mic,
        actionText: "Go to Voices",
      },
      {
        id: "preview-voice",
        title: "Preview a Voice",
        description: "Try out previewing a voice in different languages",
        route: "/voices",
        icon: Mic,
        actionText: "Preview Voice",
      },
    ],
    creditsReward: 20,
  },
  community: {
    path: {
      ...communityPath,
      name: "Create Your Voice",
      description: "Clone your voice and add it to your unique voice library",
      icon: Sparkles, // Override with Sparkles for voice cloning
    },
    tasks: [
      {
        id: "clone-voice",
        title: "Clone Your Voice",
        description: "Create a cloned version of your voice",
        route: "/voices/clone",
        icon: Mic,
        actionText: "Clone Voice",
      },
      {
        id: "save-voice",
        title: "Save to Library",
        description: "Save your cloned voice to your unique voice library",
        route: "/voices/clone",
        icon: CheckCircle2,
        actionText: "Save Voice",
      },
    ],
    creditsReward: 50,
  },
}

/**
 * Get quest path config by path ID or param
 */
export function getQuestPathConfig(pathId: string): QuestPathConfig | undefined {
  return QUEST_PATH_CONFIGS[pathId]
}
