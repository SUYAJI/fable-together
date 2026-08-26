import { createSupabaseServerClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { demoModeDisabledResponse } from "@/lib/demo-api-response"

export async function POST() {
  const demoResponse = demoModeDisabledResponse("Production quest initialization")
  if (demoResponse) return demoResponse
  try {
    const supabase = await createSupabaseServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user already has quests initialized
    const { data: existingQuests } = await supabase
      .from("user_quests")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)

    if (existingQuests && existingQuests.length > 0) {
      return NextResponse.json({ message: "Quests already initialized" })
    }

    // Get all active onboarding quests
    const { data: questsMaster, error: masterError } = await supabase
      .from("quests_master")
      .select("*")
      .eq("is_active", true)
      .eq("category", "onboarding")

    if (masterError) {
      console.error("Error fetching quests master:", masterError)
      // If table doesn't exist yet, return error
      if (masterError.code === "42P01" || masterError.message?.includes("does not exist")) {
        return NextResponse.json({ error: "Quests system not initialized" }, { status: 503 })
      }
      return NextResponse.json({ error: "Failed to fetch quests" }, { status: 500 })
    }

    // Initialize user quests
    const userQuests = (questsMaster || []).map((quest) => ({
      user_id: user.id,
      quest_id: quest.id,
      status: "not_started",
      progress: 0,
      progress_max: quest.progress_max,
      credits_earned: 0,
    }))

    const { error: insertError } = await supabase
      .from("user_quests")
      .insert(userQuests)

    if (insertError) {
      console.error("Error initializing quests:", insertError)
      return NextResponse.json({ error: "Failed to initialize quests" }, { status: 500 })
    }

    return NextResponse.json({ message: "Quests initialized successfully", count: userQuests.length })
  } catch (error) {
    console.error("Error in quests/init:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

