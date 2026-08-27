import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { isDemoMode } from "@/lib/app-mode"

export async function POST(request: Request) {
  if (isDemoMode()) {
    return NextResponse.json({
      success: true,
      message: "Demo feedback was acknowledged but not transmitted or stored.",
      creditsAwarded: 0,
      persisted: false,
      mode: "demo",
    })
  }

  try {
    const body = await request.json()
    const { feedback } = body

    if (!feedback || !feedback.trim()) {
      return NextResponse.json(
        { error: "Feedback is required" },
        { status: 400 }
      )
    }

    // Get user info if authenticated
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Check if user has submitted feedback before
    let isFirstFeedback = false
    let creditsAwarded = 0

    if (user) {
      // Check user metadata to see if they've submitted feedback before
      const hasSubmittedFeedback = user.user_metadata?.has_submitted_feedback === true

      if (!hasSubmittedFeedback) {
        isFirstFeedback = true
        
        // Award 30 credits for first feedback submission
        try {
          // Get current profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("available_credits, total_credits")
            .eq("id", user.id)
            .single()

          if (profile) {
            // Update credits
            const { error: creditsError } = await supabase
              .from("profiles")
              .update({
                available_credits: (profile.available_credits || 0) + 30,
                total_credits: (profile.total_credits || 0) + 30,
              })
              .eq("id", user.id)

            if (!creditsError) {
              creditsAwarded = 30
              
              // Mark that user has submitted feedback in user metadata
              await supabase.auth.updateUser({
                data: {
                  ...user.user_metadata,
                  has_submitted_feedback: true,
                  feedback_submitted_at: new Date().toISOString(),
                },
              })
            } else {
              console.error("Error awarding credits:", creditsError)
            }
          } else {
            // Profile doesn't exist, create it with initial credits
            const { error: createError } = await supabase
              .from("profiles")
              .insert({
                id: user.id,
                available_credits: 30,
                total_credits: 30,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })

            if (!createError) {
              creditsAwarded = 30
              
              // Mark that user has submitted feedback in user metadata
              await supabase.auth.updateUser({
                data: {
                  ...user.user_metadata,
                  has_submitted_feedback: true,
                  feedback_submitted_at: new Date().toISOString(),
                },
              })
            } else {
              console.error("Error creating profile with credits:", createError)
            }
          }
        } catch (error) {
          console.error("Error processing feedback reward:", error)
          // Continue even if credit update fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Feedback submitted successfully",
      creditsAwarded: creditsAwarded,
      isFirstFeedback: isFirstFeedback,
    })
  } catch (error) {
    console.error("Error processing feedback:", error)
    return NextResponse.json(
      { error: "Failed to process feedback" },
      { status: 500 }
    )
  }
}

