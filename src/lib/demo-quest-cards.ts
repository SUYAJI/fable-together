import { BookOpen, Headphones, Mic, Sparkles } from "lucide-react"
import type { SimpleQuest } from "@/lib/simple-quests"

export const DEMO_QUEST_CARDS: SimpleQuest[] = [
  {
    id: "story_opened",
    title: "Open sample story",
    description: "Explore a story from the demo library.",
    icon: BookOpen,
    route: "/stories",
    actionText: "Open Stories",
    reward: 10,
  },
  {
    id: "voice_previewed",
    title: "Preview a voice",
    description: "Listen to a browser speech preview.",
    icon: Headphones,
    route: "/voices",
    actionText: "Preview Voices",
    reward: 10,
  },
  {
    id: "narration_created",
    title: "Create narration",
    description: "Start a deterministic browser narration.",
    icon: Mic,
    route: "/stories?story=1",
    actionText: "Create Narration",
    reward: 20,
  },
  {
    id: "demo_voice_created",
    title: "Create Demo Voice",
    description: "Complete the local voice-clone simulation.",
    icon: Sparkles,
    route: "/voices/clone",
    actionText: "Create Demo Voice",
    reward: 20,
  },
]
