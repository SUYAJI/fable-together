import { demoStoryRepository } from "@/lib/services/demo/story-repository"
import { demoVoiceRepository } from "@/lib/services/demo/voice-repository"

export type DemoNarrationPlayback = "audio" | "browser-speech"

export interface DemoNarrationManifestEntry {
  storyId: number
  voiceId: string
  audioUrl: string
  durationSeconds?: number
}

export interface DemoNarrationRequest {
  storyId: number
  voiceId: string
  language: string
  speed: number
  text?: string
}

export interface DemoNarrationResult {
  success: true
  storyId: number
  voiceId: string
  voiceName: string
  language: string
  speed: number
  playback: DemoNarrationPlayback
  audioUrl?: string
  durationSeconds?: number
  text: string
  disclosure?: string
}

// Add owned narration assets here when available, for example:
// { storyId: 1, voiceId: "demo-voice-warm", audioUrl: "/audio/demo/adventure-begins-warm.mp3" }
export const DEMO_NARRATION_MANIFEST: DemoNarrationManifestEntry[] = []

export const demoNarrationService = {
  async requestNarration(request: DemoNarrationRequest): Promise<DemoNarrationResult | null> {
    const [story, voice] = await Promise.all([
      demoStoryRepository.getById(request.storyId),
      demoVoiceRepository.getById(request.voiceId),
    ])

    if (!story || !voice) return null

    const asset = DEMO_NARRATION_MANIFEST.find(
      (entry) => entry.storyId === request.storyId && entry.voiceId === request.voiceId,
    )
    const text = request.text || story.body

    if (asset) {
      return {
        success: true,
        storyId: request.storyId,
        voiceId: request.voiceId,
        voiceName: voice.name,
        language: request.language,
        speed: request.speed,
        playback: "audio",
        audioUrl: asset.audioUrl,
        durationSeconds: asset.durationSeconds,
        text,
      }
    }

    return {
      success: true,
      storyId: request.storyId,
      voiceId: request.voiceId,
      voiceName: voice.name,
      language: request.language,
      speed: request.speed,
      playback: "browser-speech",
      text,
      disclosure: "Browser narration preview",
    }
  },
}
