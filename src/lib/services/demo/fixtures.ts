import type { AppProfile, AppUser } from "@/lib/services/contracts"

export const DEMO_USER: AppUser = {
  id: "demo-user",
  email: "demo@fabletogether.com",
  created_at: "2025-12-08T12:00:00.000Z",
  user_metadata: {
    first_name: "Fable",
    last_name: "Explorer",
  },
}

export const DEMO_PROFILE: AppProfile = {
  id: DEMO_USER.id,
  display_name: "Fable Explorer",
  bio: "Exploring family stories, voices, and narration in the Fable Together demo.",
  location: "Demo Library",
  website: "",
  phone: "",
  created_at: DEMO_USER.created_at,
  available_credits: 150,
  total_credits: 150,
}

export const DEMO_LIBRARY_COUNTS = {
  stories: 3,
  voices: 6,
} as const

export const DEMO_CREDITS = {
  total: 150,
  available: 150,
  transactions: [
    {
      amount: 150,
      source: "Demo balance",
      date: DEMO_USER.created_at,
    },
  ],
} as const

export const DEMO_QUESTS = [
  {
    id: "explore_platform",
    slug: "explore_platform",
    title: "Explore Fable Together",
    description: "Discover stories, voices, and the narration experience.",
    credits_reward: 30,
    progress_max: 3,
    status: "in_progress" as const,
    progress: 1,
    completed_at: null,
  },
]

export const DEMO_VOICES = [
  { id: "demo-voice-warm", name: "Warm Storyteller", gender: "Female", tags: ["Family", "Narrator"] },
  { id: "demo-voice-gentle", name: "Gentle Guide", gender: "Male", tags: ["Educator", "Narrator"] },
  { id: "demo-voice-bright", name: "Bright Adventurer", gender: "Female", tags: ["Narrator"] },
  { id: "demo-voice-calm", name: "Calm Companion", gender: "Male", tags: ["Family"] },
  { id: "demo-voice-wise", name: "Wise Storykeeper", gender: "Female", tags: ["Educator"] },
  { id: "demo-voice-playful", name: "Playful Narrator", gender: "Male", tags: ["Narrator"] },
].map((voice) => ({
  ...voice,
  description: `${voice.name} is a deterministic demo voice for exploring the Fable Together interface.`,
  category: "Demo",
  accent: "Neutral",
  age: "Adult",
  use_case: "Storytelling",
  languages: ["en"],
  is_preset: true,
  is_cloned: false,
  provider: "demo",
  created_at: null,
}))

export const DEMO_STORY_SEARCH = [
  { id: 1, title: "The Adventure Begins", type: "story" as const, isExample: true },
  { id: 2, title: "The Mystery Unfolds", type: "story" as const, isExample: true },
  { id: 3, title: "The Enchanted Forest", type: "story" as const, isExample: true },
]

export const DEMO_NOTIFICATIONS = [
  {
    id: "demo-welcome",
    type: "system" as const,
    title: "Demo Mode",
    message: "You are exploring a deterministic portfolio demo. No production account or data is in use.",
    read: false,
    createdAt: DEMO_USER.created_at,
    link: "/dashboard",
  },
]
