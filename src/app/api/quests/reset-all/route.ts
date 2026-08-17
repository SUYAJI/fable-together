import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Get current user (for logging, but we'll reset for all users)
    const { data: { user } } = await supabase.auth.getUser()
    
    // Reset all user quests - set status to 'not_started', progress to 0, clear completed_at and credits_earned
    const { error: resetError } = await supabase
      .from("user_quests")
      .update({
        status: "not_started",
        progress: 0,
        completed_at: null,
        credits_earned: 0,
        updated_at: new Date().toISOString(),
      })

    if (resetError) {
      console.error("Error resetting quests:", resetError)
      return NextResponse.json(
        { error: "Failed to reset quests", details: resetError.message },
        { status: 500 }
      )
    }

    // Quests reset successfully

    return NextResponse.json({
      success: true,
      message: "All quest states have been reset successfully",
    })
  } catch (error) {
    console.error("Error in quests/reset-all:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

