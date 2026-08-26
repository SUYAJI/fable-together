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

export function createBrowserNarration(text: string, rate: number, voiceId = "demo-voice-warm", language = "en") {
  if (!isBrowserNarrationAvailable()) return null

  const utterance = new SpeechSynthesisUtterance(text)
  const profile = VOICE_PROFILES[voiceId] ?? VOICE_PROFILES["demo-voice-warm"]
  const locale = LANGUAGE_LOCALES[language] ?? language
  const voices = window.speechSynthesis.getVoices()
  const languageVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith(locale.slice(0, 2).toLowerCase()))
  const candidates = languageVoices.length > 0 ? languageVoices : voices
  utterance.voice = candidates[profile.index % Math.max(candidates.length, 1)] ?? null
  utterance.lang = locale
  utterance.rate = Math.min(2, Math.max(0.25, rate * profile.rate))
  utterance.pitch = profile.pitch
  return utterance
}
