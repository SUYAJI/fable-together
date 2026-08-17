import { createSupabaseServerClient } from "@/lib/supabase-server"
import { SIMPLE_QUESTS, getQuestById } from "@/lib/simple-quests"

/**
 * Server-side function to complete a quest
 * Can be called from other API routes
 */
export async function completeQuestServerSide(questId: string, userId: string) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Validate quest exists
    const quest = getQuestById(questId)
    if (!quest) {
      return { success: false, error: "Invalid quest ID" }
    }

    // Check if quest is already completed
    const { data: existingQuest } = await supabase
      .from("user_quests")
      .select("*")
      .eq("user_id", userId)
      .eq("quest_id", questId)
      .single()

    // If already completed, return success without awarding again
    if (existingQuest && existingQuest.status === "completed") {
      return {
        success: true,
        alreadyCompleted: true,
        tokensAwarded: 0,
      }
    }

    // Get or create quest master entry
    let { data: questMaster } = await supabase
      .from("quests_master")
      .select("*")
      .eq("slug", questId)
      .single()

    if (!questMaster) {
      // Create quest master entry
      const { data: newQuest } = await supabase
        .from("quests_master")
        .insert({
          slug: questId,
          title: quest.title,
          description: quest.description,
          credits_reward: quest.reward,
          progress_max: 1,
          is_active: true,
          category: "simple",
          display_order: SIMPLE_QUESTS.findIndex(q => q.id === questId) + 1,
        })
        .select()
        .single()

      questMaster = newQuest
    }

    // Create or update user quest
    const questMasterId = questMaster?.id || questId
    const { data: userQuest, error: upsertError } = await supabase
      .from("user_quests")
      .upsert({
        user_id: userId,
        quest_id: questMasterId,
        status: "completed",
        progress: 1,
        progress_max: 1,
        completed_at: new Date().toISOString(),
        credits_earned: quest.reward,
      }, {
        onConflict: "user_id,quest_id",
      })
      .select()
      .single()

    if (upsertError) {
      console.error("Error upserting user quest:", upsertError)
      return { success: false, error: "Failed to complete quest" }
    }

    // Award tokens to user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("available_credits, token_balance")
      .eq("id", userId)
      .single()

    if (profile) {
      const currentCredits = profile?.available_credits || profile?.token_balance || 0
      const newCredits = currentCredits + quest.reward

      const updateData: { available_credits?: number; token_balance?: number } = {}
      if (profile?.available_credits !== undefined) {
        updateData.available_credits = newCredits
      } else {
        updateData.token_balance = newCredits
      }

      await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", userId)
    }

    return {
      success: true,
      tokensAwarded: quest.reward,
      totalTokens: userQuest?.credits_earned || quest.reward,
    }
  } catch (error: unknown) {
    console.error("Complete quest error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to complete quest",
    }
  }
}
