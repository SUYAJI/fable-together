/**
 * Credit management utilities
 */

export interface CreditBalance {
  total: number
  available: number
}

/**
 * Get user's credit balance
 */
export async function getCreditBalance(): Promise<CreditBalance> {
  try {
    const response = await fetch('/api/user/credits')
    if (!response.ok) {
      return { total: 0, available: 0 }
    }

    const data = await response.json()
    return {
      total: data.total || 0,
      available: data.available || 0,
    }
  } catch (error) {
    console.error('Error fetching credit balance:', error)
    return { total: 0, available: 0 }
  }
}
