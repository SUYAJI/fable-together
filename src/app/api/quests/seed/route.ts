import { createSupabaseServerClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

// Single quest with 3 tasks
const starterQuests = [
  {
    slug: "explore_platform",
    title: "Explore the Platform",
    description: "Discover Fable Together. Complete 3 simple tasks to earn tokens and learn about the platform.",
    credits_reward: 30,
    progress_max: 3, // 3 tasks
    icon: "user",
    display_order: 1,
    category: "onboarding",
    is_active: true,
  },
]

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient()
    
    // No authentication required for seeding master quests (RLS is disabled on quests_master)
    // This allows testing users to seed quests
    
    // Upsert starter quests (will update existing quests with same slug, or insert new ones)
    // This ensures quests are always up-to-date with the latest definitions
    const { error: insertError } = await supabase
      .from("quests_master")
      .upsert(starterQuests, { onConflict: "slug" })

    if (insertError) {
      console.error("Error seeding quests:", insertError)
      // If table doesn't exist, return error with instructions
      if (insertError.code === "42P01" || insertError.message?.includes("does not exist")) {
        return NextResponse.json(
          { 
            error: "Quests table does not exist. Please create the quests_master table first.",
            details: insertError.message 
          },
          { status: 503 }
        )
      }
      return NextResponse.json({ error: "Failed to seed quests", details: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      message: "Quests seeded successfully", 
      count: starterQuests.length,
      quests: starterQuests 
    })
  } catch (error) {
    console.error("Error in quests/seed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

