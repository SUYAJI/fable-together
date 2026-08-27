#!/usr/bin/env tsx
/**
 * Seed script for story translations
 * Translates the 3 example stories into 7 languages (excluding English)
 * 
 * Usage:
 *   npm run seed-translations
 *   or
 *   npx tsx scripts/seed-story-translations.ts
 * 
 * Requirements:
 *   - GOOGLE_TRANSLATE_API_KEY in .env.local (or fallback will be used)
 *   - Supabase credentials in .env.local
 *   - Stories must exist in database with id=1,2,3
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { TranslationService } from '../src/lib/translation';

// Configuration
const STORY_IDS = [1, 2, 3];
const TARGET_LANGUAGES = ['es', 'fr', 'de', 'it', 'zh', 'ja', 'ar']; // Exclude 'en' (original)

// Initialize services
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const translationService = new TranslationService();

async function getStory(storyId: number) {
  const { data, error } = await supabase
    .from('stories')
    .select('id, title, body')
    .eq('id', storyId)
    .eq('is_example', true)
    .single();

  if (error || !data) {
    throw new Error(`Story ${storyId} not found: ${error?.message}`);
  }

  return data;
}

async function translateStory(storyId: number, language: string) {
  const story = await getStory(storyId);

  // Check if translation already exists
  const { data: existing } = await supabase
    .from('story_translations')
    .select('id')
    .eq('story_id', storyId)
    .eq('language_code', language)
    .single();

  if (existing) {
    console.log(`  ⊘ Translation already exists for Story ${storyId} → ${language}`);
    return;
  }

  try {
    console.log(`  Translating Story ${storyId} → ${language}...`);

    // Translate title and body
    const [titleResult, bodyResult] = await Promise.all([
      translationService.translate(story.title, language, 'en'),
      translationService.translate(story.body || story.title, language, 'en'),
    ]);

    // Save translation to database
    const { error: upsertError } = await supabase
      .from('story_translations')
      .upsert(
        {
          story_id: storyId,
          language_code: language,
          title: titleResult.translatedText,
          body: bodyResult.translatedText,
          is_auto_translated: true,
          translation_provider: titleResult.provider,
        },
        {
          onConflict: 'story_id,language_code',
        }
      );

    if (upsertError) {
      throw new Error(`Failed to save translation: ${upsertError.message}`);
    }

    console.log(`  ✓ Translated Story ${storyId} → ${language} (${titleResult.provider})`);

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`  ✗ Failed to translate Story ${storyId} → ${language}: ${message}`);
  }
}

async function seedAllTranslations() {
  console.log('🌍 Starting translation seeding...\n');

  const total = STORY_IDS.length * TARGET_LANGUAGES.length;
  console.log(`Total translations needed: ${total} (${STORY_IDS.length} stories × ${TARGET_LANGUAGES.length} languages)\n`);

  let completed = 0;
  let skipped = 0;
  let failed = 0;

  for (const storyId of STORY_IDS) {
    console.log(`Processing Story ${storyId}...`);
    
    for (const language of TARGET_LANGUAGES) {
      try {
        const { data: existing } = await supabase
          .from('story_translations')
          .select('id')
          .eq('story_id', storyId)
          .eq('language_code', language)
          .single();

        if (existing) {
          skipped++;
          continue;
        }

        await translateStory(storyId, language);
        completed++;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`  ✗ Error: ${message}`);
        failed++;
      }
    }

    console.log(''); // Blank line between stories
  }

  console.log('✨ Translation seeding complete!');
  console.log(`  ✓ Created: ${completed}`);
  console.log(`  ⊘ Skipped (already exists): ${skipped}`);
  console.log(`  ✗ Failed: ${failed}`);
  console.log(`  Total: ${total}`);
}

// Run the script
seedAllTranslations().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

