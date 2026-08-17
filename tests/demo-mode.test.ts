import assert from "node:assert/strict"
import test from "node:test"

import { getAppMode, resolveAppMode } from "../src/lib/app-mode"
import { demoClientServices } from "../src/lib/services/demo/client-services"
import { DEMO_PROFILE, DEMO_USER } from "../src/lib/services/demo/fixtures"
import { demoStoryRepository } from "../src/lib/services/demo/story-repository"
import { DEMO_NARRATION_MANIFEST, demoNarrationService } from "../src/lib/services/demo/narration"
import { demoVoiceRepository } from "../src/lib/services/demo/voice-repository"

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
