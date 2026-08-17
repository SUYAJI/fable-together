import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { SIMPLE_QUESTS, getQuestById } from "@/lib/simple-quests"
import { completeQuestServerSide } from "@/lib/quest-completion"
import { isDemoMode } from "@/lib/app-mode"

export async function POST(request: Request) {
  if (isDemoMode()) {
    return NextResponse.json({
      success: true,
      creditsAwarded: 0,
      persisted: false,
      mode: "demo",
    })
  }

  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      // For unauthenticated users, store in localStorage (handled on client)
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized",
        useLocalStorage: true 
      }, { status: 401 })
    }

    const { questId } = await request.json()

    if (!questId) {
      return NextResponse.json(
        { error: "questId is required" },
        { status: 400 }
      )
    }

    // Use shared server-side function
    const result = await completeQuestServerSide(questId, user.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to complete quest" },
        { status: 500 }
      )
    }

    const quest = getQuestById(questId)
    return NextResponse.json({
      success: true,
      tokensAwarded: result.tokensAwarded || 0,
      totalTokens: result.totalTokens || 0,
      alreadyCompleted: result.alreadyCompleted || false,
      quest: quest ? {
        id: questId,
        title: quest.title,
        completed: true,
      } : null,
    })

  } catch (error: unknown) {
    const { handleApiError } = await import("@/lib/api-error-handler");
    return handleApiError(error, "Failed to complete quest", 500);
  }
}

// GET endpoint to check quest completion status
export async function GET(request: Request) {
  if (isDemoMode()) {
    return NextResponse.json({ quests: [], persisted: false, mode: "demo" })
  }

  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      // For unauthenticated, check localStorage (handled on client)
      return NextResponse.json({ 
        quests: [],
        useLocalStorage: true 
      })
    }

    const { searchParams } = new URL(request.url)
    const questId = searchParams.get("questId")

    if (questId) {
      // Get single quest status
      const { data: userQuest } = await supabase
        .from("user_quests")
        .select("*, quests_master(*)")
        .eq("user_id", user.id)
        .eq("quests_master.slug", questId)
        .single()

      return NextResponse.json({
        quest: userQuest ? {
          id: questId,
          completed: userQuest.status === "completed",
          completedAt: userQuest.completed_at,
          tokensAwarded: userQuest.credits_earned,
        } : null,
      })
    }

    // Get all simple quests status
    // First get quest master entries
    const { data: questMasters } = await supabase
      .from("quests_master")
      .select("*")
      .in("slug", SIMPLE_QUESTS.map(q => q.id))

    // Then get user quests for those quest masters
    const questMasterIds = questMasters?.map(qm => qm.id) || []
    const { data: userQuests } = questMasterIds.length > 0
      ? await supabase
          .from("user_quests")
          .select("*")
          .eq("user_id", user.id)
          .in("quest_id", questMasterIds)
      : { data: [] }

    /**
     * Interface for user quest data from database
     */
    interface UserQuest {
      quest_id: string
      status: string
      completed_at: string | null
      credits_earned: number
    }

    const questStatuses = SIMPLE_QUESTS.map(quest => {
      const questMaster = questMasters?.find(qm => qm.slug === quest.id)
      const userQuest = userQuests?.find(
        (uq: UserQuest) => uq.quest_id === questMaster?.id
      )
      return {
        id: quest.id,
        completed: userQuest?.status === "completed" || false,
        completedAt: userQuest?.completed_at || null,
        tokensAwarded: userQuest?.credits_earned || 0,
      }
    })

    return NextResponse.json({
      quests: questStatuses,
    })

  } catch (error: unknown) {
    const { handleApiError } = await import("@/lib/api-error-handler");
    return handleApiError(error, "Failed to get quest status", 500);
  }
}
