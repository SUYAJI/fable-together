// src/lib/elevenlabs.ts
// ElevenLabs API integration for voice cloning and text-to-speech
// Updated: Instant Voice Cloning API implementation
const ELEVEN_API = "https://api.elevenlabs.io/v1";

/**
 * Sanitizes error messages to remove sensitive information and provide user-friendly messages
 */
function sanitizeErrorMessage(errorMessage: string): string {
  if (!errorMessage) return "An error occurred. Please try again.";
  
  let sanitized = errorMessage;
  
  // Remove sensitive information patterns
  sanitized = sanitized.replace(/api[_-]?key/gi, '[API_KEY]');
  sanitized = sanitized.replace(/xi-api-key/gi, '[API_KEY]');
  sanitized = sanitized.replace(/token[:\s]+[\w-]+/gi, '[TOKEN]');
  sanitized = sanitized.replace(/subscription[:\s]+[\w\s]+/gi, 'subscription');
  
  // Handle voice limit errors with user-friendly messages
  if (sanitized.toLowerCase().includes('maximum') && sanitized.toLowerCase().includes('custom voice')) {
    return "You've reached the maximum number of custom voices. Custom voices include all voices you've created (both Instant Voice Clones and Professional Voice Clones). To create more voices, you can delete unused voices from your Voice Library or upgrade your ElevenLabs subscription.";
  }
  
  if (sanitized.toLowerCase().includes('limit') && sanitized.toLowerCase().includes('voice')) {
    return "You've reached your voice limit. Please delete unused voices from your Voice Library or upgrade your subscription to create more voices.";
  }
  
  // Handle quota/rate limit errors
  if (sanitized.toLowerCase().includes('quota') || sanitized.toLowerCase().includes('rate limit')) {
    return "Rate limit exceeded. Please wait a moment and try again.";
  }
  
  // Handle authentication errors
  if (sanitized.toLowerCase().includes('unauthorized') || sanitized.toLowerCase().includes('authentication')) {
    return "Authentication failed. Please try again or contact support if the issue persists.";
  }
  
  // Truncate very long error messages
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 197) + '...';
  }
  
  return sanitized;
}

// Helper to create a File object from Buffer in Node.js
// ElevenLabs Instant Voice Clone API expects files as File objects in FormData
// COMMENTED OUT: TypeScript build error with Buffer/Blob conversion
// function createFileFromBuffer(buffer: Buffer, fileName: string, mimeType: string): File {
//   // In Node.js 18+, File constructor is available globally
//   // Create a Blob first, then a File from it
//   const blob = new Blob([buffer], { type: mimeType });
//   
//   // File constructor is available in Node.js 18+
//   // This creates a proper File object that FormData can handle correctly
//   return new File([blob], fileName, { 
//     type: mimeType,
//     lastModified: Date.now()
//   });
// }

export async function ttsToMp3({
  text,
  voiceId,
  modelId = "eleven_multilingual_v2", // safe default
  language = "en",
  speed = 1.0, // Speed parameter (0.25 to 4.0)
  apiKey = process.env.ELEVENLABS_API_KEY!,
}: {
  text: string;
  voiceId: string;
  modelId?: string;
  language?: string;
  speed?: number; // Speed multiplier (0.25 to 4.0)
  apiKey?: string;
}) {
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY missing");

  // Clamp speed to valid range
  const clampedSpeed = Math.max(0.25, Math.min(4.0, speed));

  const res = await fetch(`${ELEVEN_API}/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      // You can tune these later:
      voice_settings: { 
        stability: 0.5, 
        similarity_boost: 0.8,
        // Speed parameter (ElevenLabs API supports this in voice_settings)
        speed: clampedSpeed,
      },
      // Language code (ISO 639-1) to enforce language for model and text normalization
      language_code: language,
      // If you want paragraph/ssml later, we can change input_format
    }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`ElevenLabs TTS failed: ${res.status} ${msg}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  // Node runtime: convert to Buffer for upload
  return Buffer.from(arrayBuffer);
}

// Get all available voices from ElevenLabs
export async function getVoices(apiKey = process.env.ELEVENLABS_API_KEY!) {
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY missing");

  const res = await fetch(`${ELEVEN_API}/voices`, {
    headers: {
      "xi-api-key": apiKey,
      "Accept": "application/json",
    },
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`ElevenLabs voices fetch failed: ${res.status} ${msg}`);
  }

  const data = await res.json();
  return data.voices;
}

// Clone a voice from audio sample using ElevenLabs Instant Voice Cloning API
// Documentation: https://elevenlabs.io/docs/api-reference/voices/ivc/create
//
// Note: "Custom voices" in ElevenLabs include:
// - Instant Voice Clones (created via this API)
// - Professional Voice Clones (created via Professional Voice Cloning API)
// Both types count toward your subscription's custom voice limit (typically 30 for free/basic plans)
export async function cloneVoice({
  name,
  audioFiles,
  removeBackgroundNoise = false,
  description,
  labels = {},
  apiKey = process.env.ELEVENLABS_API_KEY!,
}: {
  name: string;
  audioFiles: File | File[]; // Single file or array of files (more files = better quality)
  removeBackgroundNoise?: boolean;
  description?: string | null;
  labels?: Record<string, string>;
  apiKey?: string;
}) {
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY missing");

  // Convert single file to array for consistent handling
  const filesArray = Array.isArray(audioFiles) ? audioFiles : [audioFiles];

  // Validate that we have at least one file
  if (filesArray.length === 0) {
    throw new Error("At least one audio file is required");
  }

  // Validate all files are File objects
  for (const file of filesArray) {
    if (!(file instanceof File)) {
      throw new Error("All audio files must be File objects");
    }
  }

  // Create FormData for multipart/form-data request
  const formData = new FormData();
  
  // Required: name (string)
  formData.append("name", name);
  
  // Required: files (array of File objects)
  // The API accepts multiple files - more files generally result in better quality clones
  for (const file of filesArray) {
    formData.append("files", file, file.name);
  }
  
  // Optional: remove_background_noise (boolean)
  if (removeBackgroundNoise) {
    formData.append("remove_background_noise", "true");
  }
  
  // Optional: description (string | null)
  if (description) {
    formData.append("description", description);
  }
  
  // Optional: labels (JSON string)
  // Labels are stored as a JSON string in the form data
  if (Object.keys(labels).length > 0) {
    formData.append("labels", JSON.stringify(labels));
  }

  // Make API request to ElevenLabs Instant Voice Cloning endpoint
  const res = await fetch(`${ELEVEN_API}/voices/add`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
    },
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => res.statusText);
    let errorMessage = `Voice cloning failed. Please try again.`;
    
    // Try to parse error response if it's JSON
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.detail?.message) {
        errorMessage = sanitizeErrorMessage(errorJson.detail.message);
      } else if (errorJson.message) {
        errorMessage = sanitizeErrorMessage(errorJson.message);
      }
    } catch {
      // If parsing fails, use a generic message to avoid exposing sensitive info
      // Only use the error text if it's a simple, safe message
      if (errorText && errorText.length < 100 && !errorText.includes('api') && !errorText.includes('key')) {
        errorMessage = sanitizeErrorMessage(errorText);
      }
    }
    
    throw new Error(errorMessage);
  }

  // Response format: { voice_id: string, requires_verification: boolean }
  const data = await res.json();
  return data;
}

// Get voice details
export async function getVoiceDetails(voiceId: string, apiKey = process.env.ELEVENLABS_API_KEY!) {
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY missing");

  const res = await fetch(`${ELEVEN_API}/voices/${voiceId}`, {
    headers: {
      "xi-api-key": apiKey,
    },
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`ElevenLabs voice details fetch failed: ${res.status} ${msg}`);
  }

  return await res.json();
}

// Delete a voice from ElevenLabs
export async function deleteVoice(
  voiceId: string,
  apiKey = process.env.ELEVENLABS_API_KEY!
): Promise<void> {
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY missing");

  const res = await fetch(`${ELEVEN_API}/voices/${voiceId}`, {
    method: "DELETE",
    headers: {
      "xi-api-key": apiKey,
    },
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`ElevenLabs voice deletion failed: ${res.status} ${msg}`);
  }
}

// Generate TTS with advanced settings
export async function generateWithSettings({
  text,
  voiceId,
  language = "en",
  stability = 0.5,
  similarityBoost = 0.8,
  modelId = "eleven_multilingual_v2",
  apiKey = process.env.ELEVENLABS_API_KEY!,
}: {
  text: string;
  voiceId: string;
  language?: string;
  stability?: number;
  similarityBoost?: number;
  modelId?: string;
  apiKey?: string;
}) {
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY missing");

  const res = await fetch(`${ELEVEN_API}/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: {
        stability,
        similarity_boost: similarityBoost,
      },
    }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`ElevenLabs TTS failed: ${res.status} ${msg}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Generate voice preview audio URL
export async function previewVoice({
  voiceId,
  sampleText = "Hello, this is a preview of my voice",
  apiKey = process.env.ELEVENLABS_API_KEY!,
}: {
  voiceId: string;
  sampleText?: string;
  apiKey?: string;
}) {
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY missing");

  const res = await fetch(`${ELEVEN_API}/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg",
    },
    body: JSON.stringify({
      text: sampleText,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8,
      },
    }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`ElevenLabs preview failed: ${res.status} ${msg}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
  return URL.createObjectURL(blob);
}

// Calculate token cost based on text and settings
export function calculateTokenCost(
  wordCount: number,
  voiceModel: string = "eleven_multilingual_v2",
  features: {
    backgroundMusic?: boolean;
    soundEffects?: boolean;
  } = {}
): number {
  // Base cost: approximately 1 token per 4 characters
  // Average word length is ~5 characters, so ~1.25 tokens per word
  let baseCost = Math.ceil(wordCount * 1.25);
  
  // Model multipliers
  const modelMultipliers: Record<string, number> = {
    "eleven_multilingual_v2": 1.0,
    "eleven_turbo_v2": 0.5,
    "eleven_monolingual_v1": 0.8,
  };
  
  baseCost = Math.ceil(baseCost * (modelMultipliers[voiceModel] || 1.0));
  
  // Feature multipliers
  if (features.backgroundMusic) {
    baseCost = Math.ceil(baseCost * 1.2); // 20% increase
  }
  
  if (features.soundEffects) {
    baseCost = Math.ceil(baseCost * 1.3); // 30% increase
  }
  
  return baseCost;
}