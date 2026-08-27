/**
 * Quest List API Route
 * 
 * Returns all quests for the current user with their progress status.
 * Merges quest definitions with user progress data.
 * 
 * GET /api/quests/list
 */

import { createSupabaseServerClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { isDemoMode } from "@/lib/app-mode"
import { demoResponses } from "@/lib/services/demo/responses"

/**
 * Interface for user quest data from database
 */
interface UserQuestData {
  quest_id: string
  status: string
  progress: number
  completed_at: string | null
}

/**
 * Get all quests for the current user
 * 
 * @returns NextResponse with quests array containing merged quest definitions and user progress
 */
export async function GET() {
  if (isDemoMode()) {
    return NextResponse.json(demoResponses.quests)
  }

  try {
    const supabase = await createSupabaseServerClient()
    
    // Get current user - authentication required
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch only the explore_platform quest (single quest for now)
    const targetSlug = "explore_platform"
    const { data: questsMaster, error: masterError } = await supabase
      .from("quests_master")
      .select("*")
      .eq("is_active", true)
      .eq("slug", targetSlug)
      .limit(1)

    if (masterError) {
      console.error("Error fetching quests master:", masterError)
      // If table doesn't exist yet, return empty array
      if (masterError.code === "42P01" || masterError.message?.includes("does not exist")) {
        return NextResponse.json({ quests: [] })
      }
      return NextResponse.json({ error: "Failed to fetch quests" }, { status: 500 })
    }

    // Fetch user's quest progress
    let userQuests: UserQuestData[] = []
    const { data: userQuestsData, error: userError } = await supabase
      .from("user_quests")
      .select("*")
      .eq("user_id", user.id)

    if (userError) {
      console.error("Error fetching user quests:", userError)
      // If table doesn't exist yet, use empty array
      if (userError.code === "42P01" || userError.message?.includes("does not exist")) {
        // Continue with empty userQuests
      } else {
        // Log but don't fail - return quests anyway with default status
        console.warn("Failed to fetch user quests, returning quests with default status")
      }
    } else {
      userQuests = userQuestsData || []
    }

    // Merge quest definitions with user progress
    const quests = (questsMaster || []).map((quest) => {
      const userQuest = userQuests.find((uq) => uq.quest_id === quest.id)
      const questData = {
        id: quest.slug || quest.id, // Use slug for API responses, fallback to UUID
        slug: quest.slug,
        title: quest.title,
        description: quest.description,
        credits_reward: quest.credits_reward,
        progress_max: quest.progress_max,
        status: userQuest?.status || "not_started",
        progress: userQuest?.progress || 0,
        completed_at: userQuest?.completed_at || null,
      }
      // Quest data merged successfully
      return questData
    })

    return NextResponse.json({ quests })
  } catch (error) {
    console.error("Error in quests/list:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

