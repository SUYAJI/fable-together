import type { AppProfile } from "@/lib/services/contracts"
import { DEMO_CREDITS, DEMO_NOTIFICATIONS, DEMO_PROFILE, DEMO_VOICES } from "@/lib/services/demo/fixtures"

export const DEMO_STATE_KEY = "fable-together:demo-state:v1"
export const DEMO_STATE_VERSION = 1 as const

export type DemoAction = "story_opened" | "voice_previewed" | "narration_created" | "voice_library_explored" | "demo_voice_created"

export interface DemoQuest {
  id: DemoAction
  title: string
  description: string
  credits_reward: number
  progress: number
  progress_max: number
  status: "not_started" | "in_progress" | "completed"
  completed_at: string | null
}

export interface DemoVoiceMetadata {
  id: "demo-voice-created"
  name: string
  description: string
  category: "Demo"
  accent: "Neutral"
  age: "Adult"
  gender: "Unspecified"
  use_case: "Storytelling"
  is_preset: false
  is_cloned: true
  provider: "browser-speech"
  created_at: string
  tags: string[]
}

export interface DemoState {
  version: typeof DEMO_STATE_VERSION
  profile: AppProfile
  preferredVoiceId: string
  credits: { available: number; total: number }
  quests: DemoQuest[]
  createdVoice: DemoVoiceMetadata | null
  notificationReadIds: string[]
  preferences: { sidebarCollapsed: boolean; storyLanguage: string }
}

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">
let memoryState: DemoState | null = null

const questDefinitions: Omit<DemoQuest, "progress" | "status" | "completed_at">[] = [
  { id: "story_opened", title: "Open sample story", description: "Explore a story from the demo library.", credits_reward: 10, progress_max: 1 },
  { id: "voice_previewed", title: "Preview a voice", description: "Listen to a browser speech preview.", credits_reward: 10, progress_max: 1 },
  { id: "narration_created", title: "Create narration", description: "Listen to a story with your selected voice.", credits_reward: 20, progress_max: 1 },
  { id: "demo_voice_created", title: "Create Demo Voice", description: "Create a simulated voice for the story library.", credits_reward: 20, progress_max: 1 },
]

function defaults(): DemoState {
  return {
    version: DEMO_STATE_VERSION,
    profile: { ...DEMO_PROFILE },
    preferredVoiceId: "demo-voice-warm",
    credits: { available: DEMO_CREDITS.available, total: DEMO_CREDITS.total },
    quests: questDefinitions.map((quest) => ({ ...quest, progress: 0, status: "not_started", completed_at: null })),
    createdVoice: null,
    notificationReadIds: [],
    preferences: { sidebarCollapsed: false, storyLanguage: "en" },
  }
}

function browserStorage(): StorageLike | null {
  try { return typeof window === "undefined" ? null : window.localStorage } catch { return null }
}

function valid(value: unknown): value is DemoState {
  return Boolean(value && typeof value === "object" && (value as DemoState).version === DEMO_STATE_VERSION)
}

function notify() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("fable-demo-state-change"))
}

export function getDemoState(storage: StorageLike | null = browserStorage()): DemoState {
  if (!storage) return memoryState ?? (memoryState = defaults())
  try {
    const saved = storage.getItem(DEMO_STATE_KEY)
    if (saved) {
      const parsed: unknown = JSON.parse(saved)
      if (valid(parsed)) {
        const baseline = defaults()
        return {
          ...baseline,
          ...parsed,
          profile: { ...baseline.profile, ...parsed.profile },
          preferences: { ...baseline.preferences, ...parsed.preferences },
        }
      }
    }
  } catch { /* use the default demo state if stored data cannot be read */ }
  const state = defaults()
  try { storage.setItem(DEMO_STATE_KEY, JSON.stringify(state)) } catch { memoryState = state }
  return state
}

export function saveDemoState(state: DemoState, storage: StorageLike | null = browserStorage()) {
  if (!storage) memoryState = state
  else { try { storage.setItem(DEMO_STATE_KEY, JSON.stringify(state)) } catch { memoryState = state } }
  notify()
  return state
}

export function resetDemoState(storage: StorageLike | null = browserStorage()) {
  const state = defaults()
  if (storage) { try { storage.removeItem(DEMO_STATE_KEY); storage.setItem(DEMO_STATE_KEY, JSON.stringify(state)) } catch { memoryState = state } }
  else memoryState = state
  notify()
  return state
}

export function updateDemoProfile(update: Partial<AppProfile>) {
  const state = getDemoState()
  return saveDemoState({ ...state, profile: { ...state.profile, ...update } })
}

export function setDemoPreferredVoice(voiceId: string) {
  const state = getDemoState()
  return saveDemoState({ ...state, preferredVoiceId: voiceId })
}

export function recordDemoAction(action: DemoAction) {
  const state = getDemoState()
  const quest = state.quests.find((item) => item.id === action)
  if (!quest || quest.status === "completed") return state
  const completed = quest.progress + 1 >= quest.progress_max
  const quests: DemoQuest[] = state.quests.map((item) => item.id === action ? { ...item, progress: Math.min(item.progress + 1, item.progress_max), status: completed ? "completed" : "in_progress", completed_at: completed ? new Date().toISOString() : null } : item)
  const credits = completed ? { available: state.credits.available + quest.credits_reward, total: state.credits.total + quest.credits_reward } : state.credits
  return saveDemoState({ ...state, quests, credits })
}

export function createDemoVoice(customization?: { name?: string; description?: string; tags?: string[] }) {
  const state = getDemoState()
  const createdVoice: DemoVoiceMetadata = {
    id: "demo-voice-created",
    name: customization?.name?.trim() || state.createdVoice?.name || "Demo Voice",
    description: customization?.description?.trim() || state.createdVoice?.description || "Simulated voice profile. Narration uses your browser's speech engine; no recorded audio is retained.",
    category: "Demo",
    accent: "Neutral",
    age: "Adult",
    gender: "Unspecified",
    use_case: "Storytelling",
    is_preset: false,
    is_cloned: true,
    provider: "browser-speech",
    created_at: state.createdVoice?.created_at || new Date().toISOString(),
    tags: customization?.tags?.length ? customization.tags : state.createdVoice?.tags || ["Demo", "Browser speech"],
  }
  saveDemoState({ ...state, createdVoice, preferredVoiceId: createdVoice.id })
  return recordDemoAction("demo_voice_created").createdVoice!
}

export function deleteDemoVoice() {
  const state = getDemoState()
  return saveDemoState({
    ...state,
    createdVoice: null,
    preferredVoiceId: state.preferredVoiceId === "demo-voice-created" ? "demo-voice-warm" : state.preferredVoiceId,
  })
}

export function getDemoVoices() {
  const state = getDemoState()
  return state.createdVoice ? [...DEMO_VOICES, state.createdVoice] : DEMO_VOICES
}

export function markDemoNotificationsRead(ids: string[]) {
  const state = getDemoState()
  return saveDemoState({ ...state, notificationReadIds: Array.from(new Set([...state.notificationReadIds, ...ids])) })
}

export function getDemoNotifications() {
  const state = getDemoState()
  return DEMO_NOTIFICATIONS.map((item) => ({ ...item, read: state.notificationReadIds.includes(item.id) }))
}

export function setDemoSidebarCollapsed(sidebarCollapsed: boolean) {
  const state = getDemoState()
  return saveDemoState({ ...state, preferences: { ...state.preferences, sidebarCollapsed } })
}

export function setDemoStoryLanguage(storyLanguage: string) {
  const state = getDemoState()
  return saveDemoState({ ...state, preferences: { ...state.preferences, storyLanguage } })
}

export function getDemoCounts() {
  return { stories: 3, voices: getDemoVoices().length }
}

export function subscribeDemoState(listener: () => void) {
  if (typeof window === "undefined") return () => undefined
  window.addEventListener("fable-demo-state-change", listener)
  return () => window.removeEventListener("fable-demo-state-change", listener)
}
