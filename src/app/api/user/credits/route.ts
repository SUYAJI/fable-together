/**
 * User Credits API Route
 * 
 * Returns the current user's credit balance and transaction history.
 * Handles unauthenticated users gracefully by returning zero balance.
 * 
 * GET /api/user/credits
 */

import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"

/**
 * Get user's credit balance and transaction history
 * 
 * @returns NextResponse with total credits, available credits, and transaction history
 */
export async function GET() {
  try {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("Missing Supabase environment variables")
      return NextResponse.json(
        { total: 0, available: 0, transactions: [] },
        { status: 500 }
      )
    }

    let supabase
    try {
      supabase = await createSupabaseServerClient()
    } catch (error) {
      console.error("Error creating Supabase client:", error)
      return NextResponse.json(
        { total: 0, available: 0, transactions: [] },
        { status: 500 }
      )
    }

    let user, authError
    try {
      const authResult = await supabase.auth.getUser()
      user = authResult.data?.user
      authError = authResult.error
    } catch (error) {
      console.error("Error getting user:", error)
      return NextResponse.json(
        { total: 0, available: 0, transactions: [] },
        { status: 500 }
      )
    }

    if (authError || !user) {
      // Return default values for unauthenticated users instead of 401
      return NextResponse.json({ total: 0, available: 0, transactions: [] })
    }
    
    // Get credit balance
    let profile, profileError
    try {
      const profileResult = await supabase
        .from("profiles")
        .select("total_credits, available_credits, created_at")
        .eq("id", user.id)
        .single()
      
      profile = profileResult.data
      profileError = profileResult.error
    } catch (error) {
      console.error("Error querying profiles table:", error)
      return NextResponse.json({
        total: 0,
        available: 0,
        transactions: [],
      })
    }
    
    // If profile doesn't exist, return default values (new user)
    if (profileError) {
      // PGRST116 means no rows returned - user profile doesn't exist yet
      if (profileError.code === 'PGRST116' || profileError.message?.includes('No rows')) {
        return NextResponse.json({
          total: 0,
          available: 0,
          transactions: [],
        })
      }
      // For other errors, log but return defaults instead of 500
      console.error("Error fetching profile:", profileError)
      return NextResponse.json({
        total: 0,
        available: 0,
        transactions: [],
      })
    }

    const totalCredits = profile?.total_credits ?? 0
    const availableCredits = profile?.available_credits ?? 0
    
    // Get recent credit transactions from completed quests
    let completedQuests, questsError
    try {
      const questsResult = await supabase
        .from("user_quests")
        .select(`
          credits_earned,
          completed_at,
          quests_master:quest_id (
            title,
            slug
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "completed")
        .not("credits_earned", "is", null)
        .gt("credits_earned", 0)
        .order("completed_at", { ascending: false })
        .limit(4)
      
      completedQuests = questsResult.data
      questsError = questsResult.error
    } catch (error) {
      // If quests query fails, just continue without quest transactions
      completedQuests = null
      questsError = error
      console.error("Error fetching quests:", error)
    }

    // Build transaction history
    const transactions: Array<{
      amount: number
      source: string
      date: string
    }> = []

    // Add initial welcome bonus if user has credits but no quest completions
    // This handles the case where users start with initial credits (e.g., 100 or 150)
    if (availableCredits > 0 && (!completedQuests || completedQuests.length === 0)) {
      // Check if profile was created recently (within last 24 hours) to show as welcome bonus
      if (profile?.created_at) {
        const createdAt = new Date(profile.created_at)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        
        if (createdAt > oneDayAgo) {
          transactions.push({
            amount: availableCredits,
            source: "Welcome Bonus",
            date: profile.created_at,
          })
        } else {
          // Older account with initial credits - show as "Initial Credits"
          transactions.push({
            amount: availableCredits,
            source: "Initial Credits",
            date: profile.created_at,
          })
        }
      } else {
        // No created_at, but has credits and no quests - likely initial credits
        transactions.push({
          amount: availableCredits,
          source: "Initial Credits",
          date: new Date().toISOString(),
        })
      }
    }

    /**
     * Interface for completed quest data
     * Note: quests_master can be an array or object due to Supabase type inference
     */
    interface CompletedQuest {
      credits_earned: number
      completed_at: string
      quests_master?: {
        title: string
      } | Array<{
        title: string
        slug: string
      }>
    }

    // Add quest completion transactions
    if (completedQuests && !questsError) {
      completedQuests.forEach((quest: CompletedQuest) => {
        if (quest.credits_earned > 0 && quest.completed_at) {
          // Handle quests_master as either object or array
          const questMaster = Array.isArray(quest.quests_master) 
            ? quest.quests_master[0] 
            : quest.quests_master
          const questTitle = questMaster?.title || "Quest Completed"
          transactions.push({
            amount: quest.credits_earned,
            source: questTitle,
            date: quest.completed_at,
          })
        }
      })
    }

    // Sort transactions by date (most recent first) and limit to 4
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const recentTransactions = transactions.slice(0, 4)

    return NextResponse.json({
      total: totalCredits,
      available: availableCredits,
      transactions: recentTransactions,
    })
  } catch (error) {
    // Catch any unexpected errors and return defaults instead of crashing
    console.error("Unexpected error in user/credits:", error)
    return NextResponse.json({
      total: 0,
      available: 0,
      transactions: [],
    })
  }
}