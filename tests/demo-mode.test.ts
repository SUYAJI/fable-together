import assert from "node:assert/strict"
import test from "node:test"

import { getAppMode, resolveAppMode } from "../src/lib/app-mode"
import { demoClientServices } from "../src/lib/services/demo/client-services"
import { DEMO_PROFILE, DEMO_USER } from "../src/lib/services/demo/fixtures"
import { demoStoryRepository } from "../src/lib/services/demo/story-repository"

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
