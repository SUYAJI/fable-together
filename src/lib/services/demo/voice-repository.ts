import { DEMO_VOICES } from "@/lib/services/demo/fixtures"

export const demoVoiceRepository = {
  async list() {
    return DEMO_VOICES
  },
  async getById(id: string) {
    return DEMO_VOICES.find((voice) => voice.id === id) ?? null
  },
}
