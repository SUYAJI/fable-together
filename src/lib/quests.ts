
export interface Quest {
  id: string
  title: string
  description: string
  credits_reward: number
  progress: number
  progress_max: number
  status: 'not_started' | 'in_progress' | 'completed'
  icon?: string
  category?: string
}

export interface QuestResult {
  success: boolean
  completed: boolean
  creditsEarned?: number
  newCreditBalance?: number
  error?: string
}

/**
 * Track quest progress for a user
 */
export async function trackQuest(
  userId: string,
  questId: string,
  increment: number = 1
): Promise<QuestResult> {
  try {
    const response = await fetch('/api/quests/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questId, increment }),
    })

    if (!response.ok) {
      const error = await response.json()
      const errorMessage = error && typeof error === 'object' && 'message' in error ? (error as { message: string }).message : 'Failed to track quest'
      return { success: false, completed: false, error: errorMessage }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error tracking quest:', error)
    return { success: false, completed: false, error: 'Failed to track quest' }
  }
}

/**
 * Get all quests for the current user
 */
export async function getUserQuests(): Promise<Quest[]> {
  try {
    const response = await fetch('/api/quests/list')
    if (!response.ok) {
      console.error('Failed to fetch quests')
      return []
    }

    const data = await response.json()
    return data.quests || []
  } catch (error) {
    console.error('Error fetching quests:', error)
    return []
  }
}

/**
 * Initialize quests for a new user
 */
export async function initializeQuests(): Promise<boolean> {
  try {
    const response = await fetch('/api/quests/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    return response.ok
  } catch (error) {
    console.error('Error initializing quests:', error)
    return false
  }
}

/**
 * Check if a quest is completed
 */
export async function checkQuestCompletion(
  userId: string,
  questId: string
): Promise<boolean> {
  const quests = await getUserQuests()
  const quest = quests.find(q => q.id === questId)
  return quest?.status === 'completed' || false
}
