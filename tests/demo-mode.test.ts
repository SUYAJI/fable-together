import assert from "node:assert/strict"
import test from "node:test"

import { getAppMode, resolveAppMode } from "../src/lib/app-mode"
import { demoClientServices } from "../src/lib/services/demo/client-services"
import { DEMO_PROFILE, DEMO_USER } from "../src/lib/services/demo/fixtures"
import { demoStoryRepository } from "../src/lib/services/demo/story-repository"
import { DEMO_NARRATION_MANIFEST, demoNarrationService } from "../src/lib/services/demo/narration"
import { demoVoiceRepository } from "../src/lib/services/demo/voice-repository"
import { DEMO_STATE_KEY, createDemoVoice, getDemoState, recordDemoAction, resetDemoState } from "../src/lib/services/demo/state"

function memoryStorage() {
  const values = new Map<string, string>()
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value) }, removeItem: (key: string) => { values.delete(key) } }
}

test("application mode defaults to demo when the mode flag and credentials are absent", () => {
  assert.equal(resolveAppMode({}), "demo")
})

test("demo services return the deterministic user and profile without credentials", async () => {
  assert.deepEqual(await demoClientServices.auth.getCurrentUser(), DEMO_USER)
  assert.deepEqual(await demoClientServices.profiles.getProfile(DEMO_USER.id), DEMO_PROFILE)
})

test("demo story repository returns the canonical sample stories", async () => {
  const stories = await demoStoryRepository.list()

  assert.deepEqual(
    stories.map(({ id, title }) => ({ id, title })),
    [
      { id: 1, title: "The Adventure Begins" },
      { id: 2, title: "The Mystery Unfolds" },
      { id: 3, title: "The Enchanted Forest" },
    ],
  )
  assert.equal((await demoStoryRepository.getById(1))?.title, "The Adventure Begins")
})

test("Demo Mode requires no production-service environment variables", async () => {
  const names = [
    "NEXT_PUBLIC_DEMO_MODE",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "ELEVENLABS_API_KEY",
    "GOOGLE_TRANSLATE_API_KEY",
    "GOOGLE_CLOUD_API_KEY",
  ] as const
  const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]))

  try {
    names.forEach((name) => delete process.env[name])
    assert.equal(getAppMode(), "demo")
    assert.deepEqual(await demoClientServices.auth.getCurrentUser(), DEMO_USER)
    assert.equal((await demoStoryRepository.list()).length, 3)
  } finally {
    names.forEach((name) => {
      const value = previous[name]
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
    })
  }
})

test("demo voice repository returns deterministic fictional voices", async () => {
  const voices = await demoVoiceRepository.list()

  assert.equal(voices.length, 6)
  assert.deepEqual(
    voices.map((voice) => voice.id),
    ["demo-voice-warm", "demo-voice-gentle", "demo-voice-bright", "demo-voice-calm", "demo-voice-wise", "demo-voice-playful"],
  )
})

test("missing bundled narration resolves to the browser narration fallback", async () => {
  assert.deepEqual(DEMO_NARRATION_MANIFEST, [])

  const narration = await demoNarrationService.requestNarration({
    storyId: 1,
    voiceId: "demo-voice-warm",
    language: "en",
    speed: 1,
  })

  assert.equal(narration?.playback, "browser-speech")
  assert.equal(narration?.audioUrl, undefined)
  assert.equal(narration?.voiceName, "Warm Storyteller")
})

test("demo narration needs no ElevenLabs environment variable", async () => {
  const previous = process.env.ELEVENLABS_API_KEY
  delete process.env.ELEVENLABS_API_KEY

  try {
    const narration = await demoNarrationService.requestNarration({
      storyId: 2,
      voiceId: "demo-voice-gentle",
      language: "en",
      speed: 1,
    })
    assert.equal(narration?.success, true)
    assert.equal(narration?.playback, "browser-speech")
  } finally {
    if (previous === undefined) delete process.env.ELEVENLABS_API_KEY
    else process.env.ELEVENLABS_API_KEY = previous
  }
})

test("demo state starts deterministic and awards a quest only once", () => {
  const initial = resetDemoState()
  assert.equal(initial.credits.available, 150)
  assert.equal(initial.quests.find((quest) => quest.id === "story_opened")?.status, "not_started")
  recordDemoAction("story_opened")
  const completed = getDemoState()
  assert.equal(completed.credits.available, 160)
  assert.equal(completed.quests.find((quest) => quest.id === "story_opened")?.status, "completed")
  recordDemoAction("story_opened")
  assert.equal(getDemoState().credits.available, 160)
})

test("preferred voice and Demo Voice metadata persist across repository reads and reset safely", () => {
  const storage = memoryStorage()
  resetDemoState(storage)
  const state = getDemoState(storage)
  storage.setItem(DEMO_STATE_KEY, JSON.stringify({ ...state, preferredVoiceId: "demo-voice-gentle" }))
  assert.equal(getDemoState(storage).preferredVoiceId, "demo-voice-gentle")
  // The schema deliberately retains no recording or upload values.
  assert.equal("recordedAudio" in getDemoState(storage), false)
  assert.equal("selectedFileUrl" in getDemoState(storage), false)
  resetDemoState(storage)
  assert.equal(getDemoState(storage).preferredVoiceId, "demo-voice-warm")
  assert.equal(getDemoState(storage).createdVoice, null)

  resetDemoState()
  const created = createDemoVoice()
  assert.equal(created.name, "Demo Voice")
  assert.equal(getDemoState().createdVoice?.provider, "browser-speech")
  assert.equal("recordedAudio" in created, false)
  resetDemoState()
  assert.equal(getDemoState().createdVoice, null)
})
