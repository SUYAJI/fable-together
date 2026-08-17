import {
  DEMO_CREDITS,
  DEMO_LIBRARY_COUNTS,
  DEMO_NOTIFICATIONS,
  DEMO_QUESTS,
  DEMO_STORY_SEARCH,
  DEMO_VOICES,
} from "@/lib/services/demo/fixtures"

export function getDemoSearchResults(query: string) {
  const normalized = query.trim().toLowerCase()
  return {
    stories: DEMO_STORY_SEARCH.filter((story) => story.title.toLowerCase().includes(normalized)),
    voices: DEMO_VOICES
      .filter((voice) => voice.name.toLowerCase().includes(normalized))
      .map((voice) => ({ id: voice.id, name: voice.name, type: "voice" as const })),
  }
}

export const demoResponses = {
  libraryCounts: DEMO_LIBRARY_COUNTS,
  credits: DEMO_CREDITS,
  quests: { quests: DEMO_QUESTS },
  notifications: { notifications: DEMO_NOTIFICATIONS, unreadCount: DEMO_NOTIFICATIONS.length },
  voices: { voices: DEMO_VOICES },
}
