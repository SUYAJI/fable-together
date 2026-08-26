import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { isDemoMode } from "@/lib/app-mode"

export async function GET() {
  if (isDemoMode()) return NextResponse.json({ count: 1247, demo: true })
  try {
    const supabase = await createSupabaseServerClient()
    
    // Count total users in the profiles table
    const { count: usersCount, error: usersError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })

    if (usersError) {
      console.error("Error counting users:", usersError)
      return NextResponse.json(
        { error: "Failed to count users", count: 0 },
        { status: 500 }
      )
    }

    return NextResponse.json({
      count: usersCount ?? 0,
    })
  } catch (error) {
    console.error("Error in users/count:", error)
    return NextResponse.json(
      { error: "Internal server error", count: 0 },
      { status: 500 }
    )
  }
}

