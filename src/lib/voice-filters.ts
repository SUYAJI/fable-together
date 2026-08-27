export interface CuratedVoice {
  id: string
  name: string
  gender: string
  languages?: string[]
  is_preset?: boolean
}

export function filterCuratedVoices<T extends CuratedVoice>(voices: T[]): T[] {
  const presetVoices = voices.filter((voice) => voice.is_preset === true)
  const maleVoices = presetVoices.filter((voice) => voice.gender?.toLowerCase() === "male")
  const femaleVoices = presetVoices.filter((voice) => voice.gender?.toLowerCase() === "female")
  const isMultilingual = (voice: T) => (voice.languages?.length ?? 0) > 1
  const multilingualMales = maleVoices.filter(isMultilingual)
  const multilingualFemales = femaleVoices.filter(isMultilingual)
  const nonMultilingualMales = maleVoices.filter((voice) => !isMultilingual(voice))
  const nonMultilingualFemales = femaleVoices.filter((voice) => !isMultilingual(voice))
  const selectedVoices: T[] = []

  if (multilingualMales.length > 0) selectedVoices.push(multilingualMales[0])
  if (multilingualFemales.length > 0) selectedVoices.push(multilingualFemales[0])

  if (selectedVoices.length < 3) {
    const maleCount = selectedVoices.filter((voice) => voice.gender?.toLowerCase() === "male").length
    if (maleCount < 2 && multilingualMales.length > 1) {
      selectedVoices.push(multilingualMales[1])
    } else if (multilingualFemales.length > 1) {
      selectedVoices.push(multilingualFemales[1])
    } else if (multilingualMales.length > 1) {
      selectedVoices.push(multilingualMales[1])
    }
  }

  const addAvailable = (candidates: T[], fallbacks: T[], desiredGender: string) => {
    while (
      selectedVoices.filter((voice) => voice.gender?.toLowerCase() === desiredGender).length < 3
    ) {
      const next = [...candidates, ...fallbacks].find(
        (voice) => !selectedVoices.some((selected) => selected.id === voice.id),
      )
      if (!next) break
      selectedVoices.push(next)
    }
  }

  addAvailable(nonMultilingualMales, multilingualMales, "male")
  addAvailable(nonMultilingualFemales, multilingualFemales, "female")

  if (selectedVoices.length < 6) {
    const remaining = presetVoices.filter(
      (voice) => !selectedVoices.some((selected) => selected.id === voice.id),
    )
    selectedVoices.push(...remaining.slice(0, 6 - selectedVoices.length))
  }

  return selectedVoices.slice(0, 6)
}
