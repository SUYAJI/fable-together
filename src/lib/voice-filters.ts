/**
 * Filters voices to get 6 curated voices:
 * - 3 male voices (with at least 1 multilingual)
 * - 3 female voices (with at least 1 multilingual)
 * - Total of 3 multilingual voices across both genders
 */

interface Voice {
  id: string
  name: string
  gender: string
  languages?: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function filterCuratedVoices(voices: any[]): any[] {
  // Filter to only preset voices
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const presetVoices = voices.filter((voice: any) => voice.is_preset === true)

  // Separate by gender
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const maleVoices = presetVoices.filter((voice: any) => 
    voice.gender?.toLowerCase() === 'male'
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const femaleVoices = presetVoices.filter((voice: any) => 
    voice.gender?.toLowerCase() === 'female'
  )

  // Helper to check if voice is multilingual (supports more than 1 language)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isMultilingual = (voice: any): boolean => {
    const languages = voice.languages || []
    return Array.isArray(languages) && languages.length > 1
  }

  // Get multilingual voices from each gender
  const multilingualMales = maleVoices.filter(isMultilingual)
  const multilingualFemales = femaleVoices.filter(isMultilingual)

  // Get non-multilingual voices
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nonMultilingualMales = maleVoices.filter((v: any) => !isMultilingual(v))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nonMultilingualFemales = femaleVoices.filter((v: any) => !isMultilingual(v))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectedVoices: any[] = []

  // Select voices ensuring we have at least 1 multilingual from each gender
  // Target: 3 male (at least 1 multilingual) + 3 female (at least 1 multilingual) = 6 total
  // With 3 total multilingual across both

  // Add multilingual voices first (at least 1 from each gender, up to 3 total)
  if (multilingualMales.length > 0) {
    selectedVoices.push(multilingualMales[0])
  }
  if (multilingualFemales.length > 0) {
    selectedVoices.push(multilingualFemales[0])
  }
  
  // Add one more multilingual (prefer whichever gender we have less of so far)
  const multilingualCount = selectedVoices.length
  if (multilingualCount < 3) {
    if (selectedVoices.filter(v => v.gender?.toLowerCase() === 'male').length < 2 && multilingualMales.length > 1) {
      selectedVoices.push(multilingualMales[1])
    } else if (multilingualFemales.length > 1) {
      selectedVoices.push(multilingualFemales[1])
    } else if (multilingualMales.length > 1) {
      selectedVoices.push(multilingualMales[1])
    }
  }

  // Fill remaining spots (3 male total, 3 female total)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentMales = selectedVoices.filter((v: any) => v.gender?.toLowerCase() === 'male').length
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentFemales = selectedVoices.filter((v: any) => v.gender?.toLowerCase() === 'female').length

  // Add more males to reach 3
  for (let i = currentMales; i < 3 && i < maleVoices.length; i++) {
    // Try to add from non-multilingual first, then multilingual if needed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const available = nonMultilingualMales.filter((v: any) => !selectedVoices.some((sv: any) => sv.id === v.id))
    if (available.length > 0) {
      selectedVoices.push(available[0])
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const multilingualAvail = multilingualMales.filter((v: any) => !selectedVoices.some((sv: any) => sv.id === v.id))
      if (multilingualAvail.length > 0) {
        selectedVoices.push(multilingualAvail[0])
      }
    }
  }

  // Add more females to reach 3
  for (let i = currentFemales; i < 3 && i < femaleVoices.length; i++) {
    // Try to add from non-multilingual first, then multilingual if needed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const available = nonMultilingualFemales.filter((v: any) => !selectedVoices.some((sv: any) => sv.id === v.id))
    if (available.length > 0) {
      selectedVoices.push(available[0])
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const multilingualAvail = multilingualFemales.filter((v: any) => !selectedVoices.some((sv: any) => sv.id === v.id))
      if (multilingualAvail.length > 0) {
        selectedVoices.push(multilingualAvail[0])
      }
    }
  }

  // If we don't have enough voices, fill with any available preset voices
  if (selectedVoices.length < 6) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const remaining = presetVoices.filter((v: any) => !selectedVoices.some((sv: any) => sv.id === v.id))
    selectedVoices.push(...remaining.slice(0, 6 - selectedVoices.length))
  }

  // Return only the first 6 voices
  return selectedVoices.slice(0, 6)
}

