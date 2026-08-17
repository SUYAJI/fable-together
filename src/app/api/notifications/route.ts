import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { isDemoMode } from "@/lib/app-mode"
import { demoResponses } from "@/lib/services/demo/responses"

export async function GET() {
  if (isDemoMode()) {
    return NextResponse.json(demoResponses.notifications)
  }

  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ notifications: [], unreadCount: 0 })
    }

    // For now, we'll create notifications based on user activity
    // In the future, this can be replaced with a notifications table
    
    const notifications: Array<{
      id: string
      type: 'quest_completed' | 'story_generated' | 'voice_cloned' | 'credits_earned' | 'system'
      title: string
      message: string
      read: boolean
      createdAt: string
      link?: string
    }> = []

    // Check for completed quests that might have notifications
    const { data: completedQuests, error: questsError } = await supabase
      .from("user_quests")
      .select(`
        id,
        completed_at,
        quest_id,
        quests_master:quest_id (
          title,
          slug,
          credits_reward
        )
      `)
      .eq("user_id", user.id)
      .eq("status", "completed")
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(5)

    if (!questsError && completedQuests) {
      for (const quest of completedQuests) {
        if (quest.completed_at) {
          // Handle quests_master as either object or array (Supabase type inference issue)
          const questMaster = Array.isArray(quest.quests_master) 
            ? quest.quests_master[0] 
            : quest.quests_master as { title: string; slug: string; credits_reward: number } | null
          
          if (questMaster && questMaster.title) {
            const creditsEarned = questMaster.credits_reward || 0
            
            notifications.push({
              id: `quest-${quest.id}`,
              type: 'quest_completed',
              title: 'Quest Completed!',
              message: `You completed "${questMaster.title}" and earned ${creditsEarned} credits!`,
              read: false,
              createdAt: quest.completed_at,
              link: '/quests'
            })
          }
        }
      }
    }

    // Check for recent story generation (if we have a way to track this)
    // This would require a stories table with created_at tracking

    // Check for recent voice cloning (if we have a way to track this)
    // This would require a voices table with created_at tracking

    // Sort by creation date (newest first)
    notifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    const unreadCount = notifications.filter(n => !n.read).length

    return NextResponse.json({
      notifications: notifications.slice(0, 10), // Return latest 10
      unreadCount
    })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json(
      { notifications: [], unreadCount: 0 },
      { status: 500 }
    )
  }
}

