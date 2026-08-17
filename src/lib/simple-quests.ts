import { BookOpen, Mic, Sparkles, LucideIcon } from "lucide-react"

export interface SimpleQuest {
  id: string
  title: string
  description: string
  icon: LucideIcon
  route: string
  actionText: string
  reward: number
}

export const SIMPLE_QUESTS: SimpleQuest[] = [
  {
    id: "explore-stories",
    title: "Explore Stories",
    description: "Visit the Story Library to discover example stories",
    icon: BookOpen,
    route: "/stories",
    actionText: "Go to Stories",
    reward: 10,
  },
  {
    id: "create-audio",
    title: "Create Audio",
    description: "Generate and save audio for a story",
    icon: Mic,
    route: "/stories",
    actionText: "Create Audio",
    reward: 20,
  },
  {
    id: "clone-voice",
    title: "Clone a Voice",
    description: "Create your own cloned voice",
    icon: Sparkles,
    route: "/voices/clone",
    actionText: "Clone Voice",
    reward: 30,
  },
]

export function getQuestById(id: string): SimpleQuest | undefined {
  return SIMPLE_QUESTS.find(quest => quest.id === id)
}
