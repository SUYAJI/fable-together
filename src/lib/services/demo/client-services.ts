import type { AppProfile, AppServices, ProfileUpdate } from "@/lib/services/contracts"
import { DEMO_USER } from "@/lib/services/demo/fixtures"
import { getDemoState, updateDemoProfile } from "@/lib/services/demo/state"

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
      return userId === DEMO_USER.id ? getDemoState().profile : null
    },
    async updateProfile(userId: string, update: ProfileUpdate) {
      if (userId !== DEMO_USER.id) throw new Error("Unknown demo profile")
      const normalized = Object.fromEntries(Object.entries(update).filter(([, value]) => value !== null)) as Partial<AppProfile>
      return updateDemoProfile(normalized).profile as AppProfile
    },
  },
}
