export function isBrowserNarrationAvailable() {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window
}

const VOICE_PROFILES: Record<string, { rate: number; pitch: number; index: number }> = {
  "demo-voice-warm": { rate: 0.92, pitch: 1.08, index: 0 },
  "demo-voice-gentle": { rate: 0.86, pitch: 0.92, index: 1 },
  "demo-voice-bright": { rate: 1.08, pitch: 1.18, index: 2 },
  "demo-voice-calm": { rate: 0.82, pitch: 0.86, index: 3 },
  "demo-voice-wise": { rate: 0.88, pitch: 0.8, index: 4 },
  "demo-voice-playful": { rate: 1.12, pitch: 1.22, index: 5 },
  "demo-voice-created": { rate: 0.96, pitch: 1, index: 6 },
}

const LANGUAGE_LOCALES: Record<string, string> = { en: "en-US", es: "es-ES", fr: "fr-FR", zh: "zh-CN", hi: "hi-IN" }

const LANGUAGE_NAMES: Record<string, string> = { en: "English", es: "Spanish", fr: "French", zh: "Chinese", hi: "Hindi" }

type VoiceLoader = Pick<SpeechSynthesis, "getVoices" | "addEventListener" | "removeEventListener">

export function selectBrowserVoice(voices: SpeechSynthesisVoice[], language: string, personaIndex = 0) {
  const locale = (LANGUAGE_LOCALES[language] ?? language).toLowerCase().replace("_", "-")
  const languageCode = locale.split("-")[0]
  const matchingVoices = voices.filter((voice) => {
    const voiceLocale = voice.lang.toLowerCase().replace("_", "-")
    return voiceLocale === languageCode || voiceLocale.startsWith(`${languageCode}-`)
  })

  if (matchingVoices.length === 0) return null

  const exactLocaleVoices = matchingVoices.filter(
    (voice) => voice.lang.toLowerCase().replace("_", "-") === locale,
  )
  const candidates = exactLocaleVoices.length > 0 ? exactLocaleVoices : matchingVoices
  return candidates[personaIndex % candidates.length]
}

export async function loadBrowserVoices(
  synthesis: VoiceLoader = window.speechSynthesis,
  timeoutMs = 1500,
): Promise<SpeechSynthesisVoice[]> {
  const currentVoices = synthesis.getVoices()
  if (currentVoices.length > 0) return currentVoices

  return new Promise((resolve) => {
    let settled = false
    const finish = (voices: SpeechSynthesisVoice[]) => {
      if (settled) return
      settled = true
      synthesis.removeEventListener("voiceschanged", handleVoicesChanged)
      resolve(voices)
    }
    const handleVoicesChanged = () => {
      const voices = synthesis.getVoices()
      if (voices.length > 0) finish(voices)
    }

    synthesis.addEventListener("voiceschanged", handleVoicesChanged)
    handleVoicesChanged()
    setTimeout(() => finish(synthesis.getVoices()), timeoutMs)
  })
}

export function getBrowserNarrationUnavailableMessage(language = "en") {
  if (!isBrowserNarrationAvailable()) return "Narration is not available in this browser."
  const languageName = LANGUAGE_NAMES[language] ?? language
  return `A system voice for ${languageName} is not available in this browser.`
}

export async function createBrowserNarration(text: string, rate: number, voiceId = "demo-voice-warm", language = "en") {
  if (!isBrowserNarrationAvailable()) return null

  const profile = VOICE_PROFILES[voiceId] ?? VOICE_PROFILES["demo-voice-warm"]
  const locale = LANGUAGE_LOCALES[language] ?? language
  const voices = await loadBrowserVoices()
  const voice = selectBrowserVoice(voices, language, profile.index)
  if (!voice) return null

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.voice = voice
  utterance.lang = locale
  utterance.rate = Math.min(2, Math.max(0.25, rate * profile.rate))
  utterance.pitch = profile.pitch
  return utterance
}
