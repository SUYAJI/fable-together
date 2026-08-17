import { createSupabaseBrowserClient } from "@/lib/supabase-browser"
import type { AppProfile, AppServices, AppUser, ProfileUpdate } from "@/lib/services/contracts"

export const productionClientServices: AppServices = {
  auth: {
    async getCurrentUser() {
      const supabase = createSupabaseBrowserClient()
      const { data, error } = await supabase.auth.getUser()
      if (error) throw error
      if (!data.user) return null
      return {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at,
        user_metadata: data.user.user_metadata,
      } as AppUser
    },
    async signOut() {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
  },
  profiles: {
    async getProfile(userId) {
      const supabase = createSupabaseBrowserClient()
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, bio, location, website, phone, created_at, available_credits, total_credits")
        .eq("id", userId)
        .single()

      if (error && error.code !== "PGRST116") throw error
      return data as AppProfile | null
    },
    async updateProfile(userId: string, update: ProfileUpdate) {
      const supabase = createSupabaseBrowserClient()
      const { data, error } = await supabase
        .from("profiles")
        .update({ ...update, updated_at: new Date().toISOString() })
        .eq("id", userId)
        .select("id, display_name, avatar_url, bio, location, website, phone, created_at, available_credits, total_credits")
        .single()

      if (error) throw error
      return data as AppProfile
    },
  },
}
