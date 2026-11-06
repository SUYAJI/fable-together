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
  {
    id: "demo-voice-warm",
    name: "Warm Storyteller",
    gender: "Female",
    tags: ["Family", "Narrator"],
    description: "Soft and unhurried, like a parent reading at the edge of the bed.",
  },
  {
    id: "demo-voice-gentle",
    name: "Gentle Guide",
    gender: "Male",
    tags: ["Educator", "Narrator"],
    description: "Clear and patient. Good for early readers following along on the page.",
  },
  {
    id: "demo-voice-bright",
    name: "Bright Adventurer",
    gender: "Female",
    tags: ["Narrator"],
    description: "Quick and lively, for chases, quests and stories with a lot of motion.",
  },
  {
    id: "demo-voice-calm",
    name: "Calm Companion",
    gender: "Male",
    tags: ["Family"],
    description: "Low and steady. The voice for winding down at the end of the night.",
  },
  {
    id: "demo-voice-wise",
    name: "Wise Storykeeper",
    gender: "Female",
    tags: ["Educator"],
    description: "Measured and warm, like a grandparent telling a story they know by heart.",
  },
  {
    id: "demo-voice-playful",
    name: "Playful Narrator",
    gender: "Male",
    tags: ["Narrator"],
    description: "Animated and expressive, with room for silly voices and sound effects.",
  },
].map((voice) => ({
  ...voice,
  category: "Demo",
  accent: "Neutral",
  age: "Adult",
  use_case: "Storytelling",
  languages: ["en", "es", "fr", "zh", "hi"],
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
    title: "Welcome to Fable Together",
    message: "Explore the story library, preview voices, and follow the quests to experience the demo.",
    read: false,
    createdAt: DEMO_USER.created_at,
    link: "/dashboard",
  },
]
