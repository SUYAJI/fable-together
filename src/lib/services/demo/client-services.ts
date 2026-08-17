import type { AppProfile, AppServices, ProfileUpdate } from "@/lib/services/contracts"
import { DEMO_PROFILE, DEMO_USER } from "@/lib/services/demo/fixtures"

const PROFILE_STORAGE_KEY = "fable-demo-profile"

function readStoredProfile(): AppProfile {
  if (typeof window === "undefined") return DEMO_PROFILE

  try {
    const stored = window.localStorage.getItem(PROFILE_STORAGE_KEY)
    return stored ? { ...DEMO_PROFILE, ...JSON.parse(stored) } : DEMO_PROFILE
  } catch {
    return DEMO_PROFILE
  }
}

export const demoClientServices: AppServices = {
  auth: {
    async getCurrentUser() {
      return DEMO_USER
    },
    async signOut() {
      return
    },
  },
  profiles: {
    async getProfile(userId) {
      return userId === DEMO_USER.id ? readStoredProfile() : null
    },
    async updateProfile(userId: string, update: ProfileUpdate) {
      if (userId !== DEMO_USER.id) throw new Error("Unknown demo profile")
      const profile = { ...readStoredProfile(), ...update } as AppProfile
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
      return profile
    },
  },
}
