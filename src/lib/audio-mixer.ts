// ElevenLabs Music and Sound Effects API integration
const ELEVEN_API = "https://api.elevenlabs.io/v1";

export async function generateBackgroundMusic({
  prompt,
  duration = 30,
  apiKey = process.env.ELEVENLABS_API_KEY!,
}: {
  prompt: string;
  duration?: number;
  apiKey?: string;
}) {
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY missing");

  const res = await fetch(`${ELEVEN_API}/music`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      duration,
    }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`ElevenLabs Music generation failed: ${res.status} ${msg}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function generateSoundEffects({
  prompt,
  apiKey = process.env.ELEVENLABS_API_KEY!,
}: {
  prompt: string;
  apiKey?: string;
}) {
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY missing");

  const res = await fetch(`${ELEVEN_API}/sound-effects`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
    }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`ElevenLabs Sound Effects generation failed: ${res.status} ${msg}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Background music prompts for different styles
export const BACKGROUND_MUSIC_PROMPTS = {
  none: null,
  ambient: "Soft ambient background music, gentle and atmospheric",
  classical: "Classical orchestral background music, gentle and soothing",
  nature: "Nature sounds with soft background music, forest ambience",
  lullaby: "Gentle lullaby music, soft and calming for bedtime stories"
};

// Sound effects prompts for different levels
export const SOUND_EFFECTS_PROMPTS = {
  none: null,
  minimal: "Soft page turning sound, gentle chime",
  enhanced: "Page turning, soft chime, magical sparkle, gentle wind",
  full: "Page turning, soft chime, magical sparkle, gentle wind, forest ambience, mystical echo"
};

// Mix audio with generated background music and sound effects
export async function mixAudioWithEffects(
  baseAudioBuffer: Buffer,
  options: {
    backgroundMusic?: string;
    soundEffects?: string;
  }
): Promise<Buffer> {
  try {
    const mixedAudio = baseAudioBuffer;
    
    // Generate background music if selected
    if (options.backgroundMusic && options.backgroundMusic !== "none") {
      const musicPrompt = BACKGROUND_MUSIC_PROMPTS[options.backgroundMusic as keyof typeof BACKGROUND_MUSIC_PROMPTS];
      if (musicPrompt) {
        await generateBackgroundMusic({
          prompt: musicPrompt,
          duration: 30, // Match story duration
        });
        
        // TODO: Implement actual audio mixing
        // For now, we'll return the original audio
        // In production, you'd mix the music with the narration
        console.log('Generated background music:', options.backgroundMusic);
      }
    }
    
    // Generate sound effects if selected
    if (options.soundEffects && options.soundEffects !== "none") {
      const effectsPrompt = SOUND_EFFECTS_PROMPTS[options.soundEffects as keyof typeof SOUND_EFFECTS_PROMPTS];
      if (effectsPrompt) {
        await generateSoundEffects({
          prompt: effectsPrompt,
        });
        
        // TODO: Implement actual audio mixing
        // For now, we'll return the original audio
        // In production, you'd mix the sound effects with the narration
        console.log('Generated sound effects:', options.soundEffects);
      }
    }
    
    return mixedAudio;
  } catch (error) {
    console.error('Error mixing audio:', error);
    // Return original audio if mixing fails
    return baseAudioBuffer;
  }
}