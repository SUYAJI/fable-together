/**
 * Quest Tracking API Route
 * 
 * Tracks quest progress and handles quest completion.
 * Awards credits when quests are completed for the first time.
 * 
 * POST /api/quests/track
 */

import { createSupabaseServerClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { isDemoMode } from "@/lib/app-mode"

/**
 * Interface for quest update data
 */
interface QuestUpdateData {
  progress: number
  status: "not_started" | "in_progress" | "completed"
  completed_at?: string
  credits_earned?: number
}

/**
 * Track quest progress for the current user
 * 
 * @param request - Request containing questId and optional increment
 * @returns NextResponse with quest status and credits awarded
 */
export async function POST(request: Request) {
  if (isDemoMode()) {
    return NextResponse.json({
      success: true,
      quest: { status: "in_progress", progress: 1 },
      creditsAwarded: 0,
      persisted: false,
      mode: "demo",
    })
  }

  try {
    const supabase = await createSupabaseServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { questId, increment = 1 } = await request.json()

    if (!questId) {
      return NextResponse.json({ error: "questId is required" }, { status: 400 })
    }

    // Get quest definition - try slug first (for human-readable IDs), then UUID
    // Check if questId looks like a UUID (contains hyphens and is 36 chars)
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
      // If table doesn't exist yet, return error
      if (questError?.code === "42P01" || questError?.message?.includes("does not exist")) {
        return NextResponse.json({ error: "Quests system not initialized" }, { status: 503 })
      }
      return NextResponse.json({ error: "Quest not found" }, { status: 404 })
    }

    // Get or create user quest (use quest.id which is UUID, not questId which might be slug)
    let { data: userQuest, error: fetchError } = await supabase
      .from("user_quests")
      .select("*")
      .eq("user_id", user.id)
      .eq("quest_id", quest.id)
      .single()

    if (fetchError && fetchError.code === "PGRST116") {
      // Quest doesn't exist, create it
      // Creating new user quest
      const { data: newQuest, error: createError } = await supabase
        .from("user_quests")
        .insert({
          user_id: user.id,
          quest_id: quest.id, // Use UUID from quest object
          status: "in_progress",
          progress: increment,
          progress_max: quest.progress_max,
          credits_earned: 0,
        })
        .select()
        .single()

      if (createError) {
        console.error("[QuestTrack] Error creating quest:", createError)
        return NextResponse.json({ error: "Failed to create quest progress" }, { status: 500 })
      }

      // Quest created successfully
      userQuest = newQuest
    } else if (fetchError) {
      console.error("[QuestTrack] Error fetching quest:", fetchError)
      return NextResponse.json({ error: "Failed to fetch quest progress" }, { status: 500 })
    } else {
      // Found existing quest
    }

    // Don't update if already completed
    if (userQuest.status === "completed") {
      return NextResponse.json({
        quest: {
          ...quest,
          status: userQuest.status,
          progress: userQuest.progress,
        },
        creditsAwarded: 0,
      })
    }

    // Update progress
    const newProgress = Math.min((userQuest.progress || 0) + increment, quest.progress_max)
    const isCompleted = newProgress >= quest.progress_max

    const updateData: QuestUpdateData = {
      progress: newProgress,
      status: isCompleted ? "completed" : "in_progress",
    }

    if (isCompleted) {
      updateData.completed_at = new Date().toISOString()
      
      // Only award credits if they haven't been earned before (first completion only)
      const creditsAlreadyEarned = (userQuest.credits_earned || 0) > 0
      
      if (!creditsAlreadyEarned) {
        updateData.credits_earned = quest.credits_reward
        
        // Award credits to user profile (only on first completion)
        try {
          // Try using RPC function first
          const { error: rpcError } = await supabase.rpc("increment_user_credits", {
            user_id_param: user.id,
            credits_to_add: quest.credits_reward,
          })

          if (rpcError) {
            // Fallback to direct update if RPC doesn't exist
            const { data: profile } = await supabase
              .from("profiles")
              .select("available_credits, total_credits")
              .eq("id", user.id)
              .single()

            if (profile) {
              await supabase
                .from("profiles")
                .update({
                  available_credits: (profile.available_credits || 0) + quest.credits_reward,
                  total_credits: (profile.total_credits || 0) + quest.credits_reward,
                })
                .eq("id", user.id)
            }
          }
        } catch (error) {
          console.error("Error awarding credits:", error)
          // Continue even if credit update fails
        }
      } else {
        // Keep existing credits_earned value if already earned
        updateData.credits_earned = userQuest.credits_earned
      }
    }

    // Updating quest progress
    const { data: updatedQuest, error: updateError } = await supabase
      .from("user_quests")
      .update(updateData)
      .eq("user_id", user.id)
      .eq("quest_id", quest.id) // Use UUID from quest object
      .select()
      .single()

    if (updateError) {
      console.error("[QuestTrack] Error updating quest:", updateError)
      return NextResponse.json({ error: "Failed to update quest progress" }, { status: 500 })
    }

    // Quest updated successfully
    const responseData = {
      quest: {
        ...quest,
        status: updatedQuest.status,
        progress: updatedQuest.progress,
      },
      creditsAwarded: isCompleted && (userQuest.credits_earned || 0) === 0 ? quest.credits_reward : 0,
      completed: isCompleted,
    }
    // Returning quest tracking response
    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error in quests/track:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

