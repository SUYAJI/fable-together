/**
 * Generate consistent gradient colors for voice visualizations
 * Based on voice name to ensure consistent colors per voice
 */

export function getVoiceGradientColors(voiceName: string): {
  from: string
  via: string
  to: string
} {
  // Create a simple hash from the voice name
  let hash = 0
  for (let i = 0; i < voiceName.length; i++) {
    hash = voiceName.charCodeAt(i) + ((hash << 5) - hash)
  }

  // Generate color palettes based on hash
  const palettes = [
    { from: "from-blue-400", via: "via-cyan-400", to: "to-teal-400" },
    { from: "from-pink-400", via: "via-purple-400", to: "to-indigo-400" },
    { from: "from-orange-400", via: "via-red-400", to: "to-pink-400" },
    { from: "from-green-400", via: "via-emerald-400", to: "to-teal-400" },
    { from: "from-purple-400", via: "via-pink-400", to: "to-rose-400" },
    { from: "from-cyan-400", via: "via-blue-400", to: "to-indigo-400" },
    { from: "from-amber-400", via: "via-orange-400", to: "to-red-400" },
    { from: "from-violet-400", via: "via-purple-400", to: "to-fuchsia-400" },
  ]

  const index = Math.abs(hash) % palettes.length
  return palettes[index]
}

/**
 * Generate subtle border gradient colors for voice cards
 * Lighter, more subtle colors for borders
 */
export function getVoiceBorderGradient(voiceName: string): string {
  // Create a simple hash from the voice name
  let hash = 0
  for (let i = 0; i < voiceName.length; i++) {
    hash = voiceName.charCodeAt(i) + ((hash << 5) - hash)
  }

  // Generate subtle black/white/grey border gradient palettes
  const borderPalettes = [
    "from-gray-300/50 via-gray-400/50 to-gray-500/50",
    "from-gray-200/50 via-gray-300/50 to-gray-400/50",
    "from-gray-400/50 via-gray-500/50 to-gray-600/50",
    "from-gray-300/50 via-gray-500/50 to-gray-400/50",
    "from-gray-200/50 via-gray-400/50 to-gray-300/50",
    "from-gray-400/50 via-gray-300/50 to-gray-500/50",
    "from-gray-500/50 via-gray-400/50 to-gray-300/50",
    "from-gray-300/50 via-gray-400/50 to-gray-600/50",
  ]

  const index = Math.abs(hash) % borderPalettes.length
  return borderPalettes[index]
}

export function getVoiceInitial(voiceName: string): string {
  return voiceName.charAt(0).toUpperCase()
}

