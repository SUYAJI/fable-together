/**
 * Script to reset all quest states for all users
 * 
 * Usage:
 *   tsx scripts/reset-all-quests.ts
 * 
 * Or call the API endpoint directly:
 *   POST /api/quests/reset-all
 */

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables:")
  console.error("  - NEXT_PUBLIC_SUPABASE_URL")
  console.error("  - SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function resetAllQuests() {
  console.log("Resetting all quest states...")

  try {
    const { data, error } = await supabase
      .from("user_quests")
      .update({
        status: "not_started",
        progress: 0,
        completed_at: null,
        credits_earned: 0,
        updated_at: new Date().toISOString(),
      })
      .select("id")

    if (error) {
      console.error("Error resetting quests:", error)
      process.exit(1)
    }

    console.log(`✅ Successfully reset ${data?.length || 0} quest records`)
    console.log("All quests have been reset to 'not_started' status")
  } catch (error) {
    console.error("Unexpected error:", error)
    process.exit(1)
  }
}

resetAllQuests()

