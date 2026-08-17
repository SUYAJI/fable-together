import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { isDemoMode } from "@/lib/app-mode"

export async function POST(request: Request) {
  if (isDemoMode()) {
    return NextResponse.json({ success: true, persisted: false, mode: "demo" })
  }

  try {
    const supabase = await createSupabaseServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { questId } = await request.json()

    if (!questId) {
      return NextResponse.json({ error: "questId is required" }, { status: 400 })
    }

    // Get quest definition - try slug first (for human-readable IDs), then UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(questId)
    
    let questQuery = supabase
      .from("quests_master")
      .select("*")
      .eq("is_active", true)
    
    if (isUUID) {
      questQuery = questQuery.eq("id", questId)
    } else {
      questQuery = questQuery.eq("slug", questId)
    }
    
    const { data: quest, error: questError } = await questQuery.single()

    if (questError || !quest) {
      return NextResponse.json({ error: "Quest not found" }, { status: 404 })
    }

    // Get current user quest to preserve credits_earned
    const { data: userQuest } = await supabase
      .from("user_quests")
      .select("credits_earned")
      .eq("user_id", user.id)
      .eq("quest_id", quest.id)
      .single()

    // Reset quest progress but preserve credits_earned (so user doesn't earn credits again)
    const { error: resetError } = await supabase
      .from("user_quests")
      .update({
        status: "not_started",
        progress: 0,
        completed_at: null,
        // Keep credits_earned value if it exists (don't reset to 0)
        credits_earned: userQuest?.credits_earned || 0,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("quest_id", quest.id)

    if (resetError) {
      console.error("Error resetting quest:", resetError)
      return NextResponse.json(
        { error: "Failed to reset quest", details: resetError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Quest has been reset successfully",
    })
  } catch (error) {
    console.error("Error in quests/reset:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

