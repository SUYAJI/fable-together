#!/usr/bin/env tsx
/**
 * Pre-generation script for story audio files
 * Generates 54 combinations: 3 stories × 3 languages (en, es, zh) × 6 voices
 * 
 * Usage:
 *   npm run pre-generate-audio
 *   or
 *   npx tsx scripts/pre-generate-story-audio.ts
 * 
 * Requirements:
 *   - ELEVENLABS_API_KEY in environment or .env.local
 *   - Supabase credentials in .env.local
 *   - Stories must exist in database
 *   - Note: Translations are not required for English (uses original story text)
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Try multiple possible paths for .env.local
const envPaths = [
  resolve(process.cwd(), '.env.local'),
  resolve(__dirname, '../.env.local'),
  resolve(__dirname, '../../.env.local'),
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    console.log(`Loading environment from: ${envPath}`);
    config({ path: envPath });
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.warn('Warning: .env.local file not found. Using environment variables from system.');
}

import { createClient } from '@supabase/supabase-js';
import { ttsToMp3 } from '../src/lib/elevenlabs';
import { filterCuratedVoices } from '../src/lib/voice-filters';

// Configuration - Story data (matching frontend stories)
const STORIES = [
  {
    id: 1,
    title: "The Adventure Begins",
    body: "Once upon a time, in a magical forest far away, there lived a brave little rabbit named Luna. Luna had always dreamed of going on grand adventures, but she was too small and too scared to leave her cozy burrow. One sunny morning, Luna heard a mysterious sound coming from deep in the forest. It was the most beautiful melody she had ever heard. Her curiosity overcame her fear, and she decided to follow the sound. As she hopped through the tall grass and under the ancient oak trees, Luna discovered a magical clearing where a wise old owl was playing a golden flute. The owl smiled at Luna and said, 'Welcome, little one. I've been waiting for someone brave enough to find me.' From that day forward, Luna learned that the greatest adventures begin with a single step into the unknown.",
  },
  {
    id: 2,
    title: "The Mystery Unfolds",
    body: "Detective Maya had always been curious about the old lighthouse on the cliff. When strange lights started appearing there at night, she knew she had to investigate. Armed with her magnifying glass and notebook, Maya discovered a secret passage behind the lighthouse keeper's quarters. Inside, she found a hidden room filled with ancient maps and a mysterious journal. The journal spoke of a lost treasure and a secret that had been kept for generations. As Maya followed the clues, she realized that the greatest mystery wasn't about finding treasure, but about understanding the importance of preserving history and the stories of those who came before us.",
  },
  {
    id: 3,
    title: "The Enchanted Forest",
    body: "Deep in the heart of the Enchanted Forest, where the trees whispered secrets and the flowers sang lullabies, lived a young fairy named Zara. Zara had the special gift of being able to understand the language of all forest creatures. When the forest began to lose its magic, Zara embarked on a quest to find the Crystal of Harmony, the source of all forest magic. Along her journey, she met talking animals, dancing flowers, and wise old trees who taught her that the real magic wasn't in crystals or spells, but in the love and care we show to nature and each other.",
  },
];

// Only generate for English, Spanish, and Chinese for now (cost optimization)
const LANGUAGES = ['en', 'es', 'zh'];
const BATCH_SIZE = 5; // Number of concurrent generations
const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds between batches (rate limiting)

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\n❌ Error: Environment variables not found!');
  console.error('\nRequired variables:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  console.error('  - ELEVENLABS_API_KEY\n');
  console.error('Make sure .env.local exists in the project root with these variables set.');
  console.error('\nAlternatively, set them in PowerShell:');
  console.error('  $env:NEXT_PUBLIC_SUPABASE_URL="your_url"');
  console.error('  $env:SUPABASE_SERVICE_ROLE_KEY="your_key"');
  console.error('  $env:ELEVENLABS_API_KEY="your_key"\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface GenerationTask {
  storyId: number;
  language: string;
  voiceId: string;
  voiceName: string;
}

// Note: Now we only use one default voice for all languages

async function getDefaultVoice() {
  // Fetch all voices from ElevenLabs
  const response = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY!,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch voices: ${response.statusText}`);
  }

  const data = await response.json();
  const voices = data.voices || [];

  // Filter to curated voices (6 total: 3 male, 3 female, 3 multilingual)
  const curated = filterCuratedVoices(
    voices.map((voice: any) => ({
      id: voice.voice_id,
      name: voice.name,
      gender: voice.labels?.gender || 'Neutral',
      languages: voice.labels?.languages || ['en'],
      is_preset: true,
      ...voice,
    }))
  );

  // Use the first curated voice as default for all languages
  if (curated.length === 0) {
    throw new Error('No curated voices found');
  }

  return {
    id: curated[0].id || curated[0].voice_id,
    name: curated[0].name,
  };
}

async function getStoryText(storyId: number, language: string): Promise<string | null> {
  // Find story from hardcoded data
  const story = STORIES.find(s => s.id === storyId);
  
  if (!story) {
    console.error(`Story ${storyId} not found in hardcoded stories`);
    return null;
  }

  const originalText = story.body || story.title || null;
  if (!originalText) {
    return null;
  }

  // IMPORTANT: ElevenLabs multilingual model can take English text and output in any language
  // We just pass the language parameter - no translation needed!
  // The model handles the language conversion automatically
  return originalText;
}

async function checkIfAudioExists(storyId: number, voiceId: string, language: string): Promise<boolean> {
  // Structure: {voiceId}/stories/{storyId}/{language}.mp3
  const path = `${voiceId}/stories/${storyId}/${language}.mp3`;
  
  const { data, error } = await supabase.storage
    .from('audio')
    .list(`${voiceId}/stories/${storyId}`, {
      search: `${language}.mp3`,
    });

  return !error && data && data.length > 0;
}

async function generateAndUploadAudio(
  storyId: number,
  voiceId: string,
  language: string,
  text: string
): Promise<string> {
  console.log(`  Generating: Story ${storyId}, Voice ${voiceId}, Language ${language}...`);
  console.log(`  Using English text with language parameter: ${language} (eleven_multilingual_v2 will convert)`);

  // Generate audio using English text + language parameter
  // The eleven_multilingual_v2 model converts English text to the target language
  const audioBuffer = await ttsToMp3({
    text, // English text - model will convert to target language
    voiceId,
    language, // Target language (e.g., 'es', 'zh') - model handles conversion
    modelId: 'eleven_multilingual_v2', // Explicitly use multilingual model
  });

  // Upload to Supabase Storage
  // Structure: {voiceId}/stories/{storyId}/{language}.mp3
  const path = `${voiceId}/stories/${storyId}/${language}.mp3`;
  const { data: upload, error: uploadError } = await supabase.storage
    .from('audio')
    .upload(path, audioBuffer, {
      contentType: 'audio/mpeg',
      upsert: true, // Allow overwriting
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data: publicUrl } = supabase.storage
    .from('audio')
    .getPublicUrl(path);

  return publicUrl.publicUrl;
}

async function generateAudioForTask(task: GenerationTask): Promise<void> {
  const { storyId, language, voiceId, voiceName } = task;

  try {
    // Check if already exists
    const exists = await checkIfAudioExists(storyId, voiceId, language);
    if (exists) {
      console.log(`  ✓ Already exists: Story ${storyId} | ${voiceName} | ${language}`);
      return;
    }

    // Get story text (translated if needed)
    const text = await getStoryText(storyId, language);
    if (!text) {
      console.error(`  ✗ No text found for Story ${storyId} in ${language}`);
      return;
    }

    // Generate and upload
    await generateAndUploadAudio(storyId, voiceId, language, text);
    console.log(`  ✓ Generated: Story ${storyId} | ${voiceName} | ${language}`);
  } catch (error: any) {
    console.error(`  ✗ Failed: Story ${storyId} | ${voiceName} | ${language}: ${error.message}`);
  }
}

async function generateAllAudio() {
  console.log('🎵 Starting audio pre-generation...\n');

  // Get default voice (first curated voice)
  console.log('Fetching default voice...');
  const defaultVoice = await getDefaultVoice();
  console.log(`Using default voice: ${defaultVoice.name} (ID: ${defaultVoice.id})\n`);

  // Build task list - only one voice now, so just stories × languages
  const tasks: GenerationTask[] = [];
  for (const story of STORIES) {
    for (const language of LANGUAGES) {
      tasks.push({
        storyId: story.id,
        language,
        voiceId: defaultVoice.id,
        voiceName: defaultVoice.name,
      });
    }
  }

  console.log(`Total tasks: ${tasks.length} (${STORIES.length} stories × ${LANGUAGES.length} languages × 1 default voice)`);
  console.log(`Estimated cost: ~$${(tasks.length * 750 / 1000 * 0.30).toFixed(2)} (${tasks.length} files × ~750 chars × $0.30/1K chars)\n`);

  // Process in batches to avoid rate limiting
  let completed = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
    const batch = tasks.slice(i, i + BATCH_SIZE);
    console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(tasks.length / BATCH_SIZE)} (${batch.length} tasks)...`);

    await Promise.all(
      batch.map(async (task) => {
        const existed = await checkIfAudioExists(task.storyId, task.voiceId, task.language);
        if (existed) {
          skipped++;
          return;
        }

        try {
          await generateAudioForTask(task);
          completed++;
        } catch {
          failed++;
        }
      })
    );

    // Delay between batches
    if (i + BATCH_SIZE < tasks.length) {
      console.log(`Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...\n`);
      await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }

  console.log('\n✨ Generation complete!');
  console.log(`  ✓ Generated: ${completed}`);
  console.log(`  ⊘ Skipped (already exists): ${skipped}`);
  console.log(`  ✗ Failed: ${failed}`);
  console.log(`  Total: ${tasks.length}`);
}

// Run the script
generateAllAudio().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

