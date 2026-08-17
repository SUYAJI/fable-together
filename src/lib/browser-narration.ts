export function isBrowserNarrationAvailable() {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window
}

export function createBrowserNarration(text: string, rate: number) {
  if (!isBrowserNarrationAvailable()) return null

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = Math.min(2, Math.max(0.25, rate))
  return utterance
}
