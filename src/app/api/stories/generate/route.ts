/**
 * Story Generation API Route
 * 
 * Generates audio narration for example stories using ElevenLabs TTS.
 * Implements caching to avoid regenerating audio that already exists.
 * 
 * Features:
 * - Checks for cached audio before generating
 * - Supports multiple languages via ElevenLabs multilingual model
 * - Handles token deduction for authenticated users
 * - Creates story records in database
 * - Uploads audio to Supabase Storage
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { ttsToMp3, calculateTokenCost } from "@/lib/elevenlabs";
import { createClient } from "@supabase/supabase-js";
import { demoModeDisabledResponse } from "@/lib/demo-api-response";

/**
 * Hardcoded example stories data
 * These stories are available for all users to narrate
 */
const EXAMPLE_STORIES = [
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

/**
 * Generate audio for an example story
 * 
 * POST /api/stories/generate
 * 
 * Request body:
 * - exampleStoryId: number (1, 2, or 3)
 * - voiceId: string (ElevenLabs voice ID)
 * - language?: string (default: "en")
 * - backgroundMusic?: boolean
 * - soundEffects?: boolean
 * 
 * Returns:
 * - audioUrl: string (public URL to generated/cached audio)
 * - cached: boolean (whether audio was served from cache)
 * - storyId: number
 * - story?: object (if authenticated, includes token cost info)
 * 
 * @param request - Next.js request object
 * @returns NextResponse with audio URL or error
 */
export async function POST(request: Request) {
  const demoResponse = demoModeDisabledResponse("Production story generation")
  if (demoResponse) return demoResponse
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { 
      exampleStoryId, 
      voiceId, 
      language = "en", 
      backgroundMusic = false, 
      soundEffects = false 
    } = await request.json();

    if (!exampleStoryId || !voiceId) {
      return NextResponse.json({ 
        error: "Example story ID and voice ID are required" 
      }, { status: 400 });
    }

    // Check if cached audio exists first (this works without authentication)
    // Path structure: {voiceId}/stories/{storyId}/{language}.mp3
    const cachedAudioPath = `${voiceId}/stories/${exampleStoryId}/${language}.mp3`;
    const { data: existingFiles, error: listError } = await supabase.storage
      .from("audio")
      .list(`${voiceId}/stories/${exampleStoryId}`, {
        search: `${language}.mp3`,
      });

    if (!listError && existingFiles && existingFiles.length > 0) {
      // Cached audio exists! Return it immediately (no API cost, no auth needed)
      const { data: publicUrl } = supabase.storage
        .from("audio")
        .getPublicUrl(cachedAudioPath);

      return NextResponse.json({
        success: true,
        audioUrl: publicUrl.publicUrl,
        cached: true,
        storyId: exampleStoryId,
      });
    }

    // No cached audio found - need to generate
    // For example stories, allow generation without authentication (for testing users)
    // Use hardcoded example story data (matching frontend)
    const exampleStory = EXAMPLE_STORIES.find(s => s.id === Number(exampleStoryId));

    if (!exampleStory) {
      return NextResponse.json({ 
        error: "Example story not found" 
      }, { status: 404 });
    }

    // Use English text - ElevenLabs multilingual model will handle language conversion
    // The language parameter passed to TTS will make the voice speak in that language
    // even though the input text is in English
    const textToNarrate = exampleStory.body || exampleStory.title;
    
    // Using English text for all languages
    // The eleven_multilingual_v2 model handles language conversion based on the language parameter

    // Generate audio using ElevenLabs
    const audioBuffer = await ttsToMp3({
      text: textToNarrate,
      voiceId,
      language: language, // Pass the selected language to the API
    });

    // For storage uploads, use service role key if user is not authenticated
    // This allows testing users to generate and cache audio for example stories
    let storageClient = supabase;
    if (!user && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      storageClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
    }

    // Upload audio to Supabase Storage with structured path for caching
    const { data: upload, error: uploadError } = await storageClient.storage
      .from("audio")
      .upload(cachedAudioPath, audioBuffer, {
        contentType: "audio/mpeg",
        upsert: true, // Allow overwriting if file exists
      });

    if (uploadError) {
      return NextResponse.json({ 
      error: `Audio upload failed: ${uploadError.message}` 
    }, { status: 500 });
    }

    // Get public URL (use original supabase client for public URL)
    const { data: publicUrl } = supabase.storage
      .from("audio")
      .getPublicUrl(cachedAudioPath);

    // If user is authenticated, create story record and handle tokens
    if (user) {
      // Calculate token cost
      const wordCount = textToNarrate.split(" ").length || 0;
      const tokenCost = calculateTokenCost(wordCount, "eleven_multilingual_v2", {
        backgroundMusic,
        soundEffects,
      });

      // Fetch user profile for token balance
      const { data: profile } = await supabase
        .from("profiles")
        .select("token_balance")
        .eq("id", user.id)
        .single();

      const currentBalance = profile?.token_balance || 0;

      if (currentBalance < tokenCost) {
        return NextResponse.json({ 
          error: `Insufficient tokens. Required: ${tokenCost}, Available: ${currentBalance}` 
        }, { status: 400 });
      }

      // Create new story record (copy of example but owned by user)
      const { data: newStory, error: storyCreateError } = await supabase
        .from("stories")
        .insert({
          title: exampleStory.title,
          body: exampleStory.body,
          author: user.id,
          owner_id: user.id,
          status: "ready",
          audio_url: publicUrl.publicUrl,
          is_example: false,
          language,
          narrator_voice_id: voiceId,
          background_music: backgroundMusic,
          sound_effects: soundEffects,
          token_cost: tokenCost,
        })
        .select()
        .single();

      if (storyCreateError) {
        console.warn("Story creation failed:", storyCreateError);
        // Continue even if story creation fails - audio is still generated
      } else {
        // Create story_audio record
        const { error: audioRecordError } = await supabase
          .from("story_audio")
          .insert({
            story_id: newStory.id,
            voice_id: voiceId,
            audio_url: publicUrl.publicUrl,
            duration_seconds: null, // Could calculate this if needed
            status: "ready",
          });

        if (audioRecordError) {
          console.warn("Story audio record creation failed:", audioRecordError);
        }

        // Deduct tokens from user's balance
        const { error: balanceError } = await supabase
          .from("profiles")
          .update({ token_balance: currentBalance - tokenCost })
          .eq("id", user.id);

        if (balanceError) {
          console.warn("Token balance update failed:", balanceError);
        }

        return NextResponse.json({
          success: true,
          audioUrl: publicUrl.publicUrl,
          cached: false, // Indicate this was just generated
          storyId: exampleStoryId,
          story: {
            id: newStory.id,
            title: newStory.title,
            audioUrl: publicUrl.publicUrl,
            tokenCost,
            remainingBalance: currentBalance - tokenCost,
          },
        });
      }
    }

    // For unauthenticated users (testing), just return the audio URL without creating story records
    return NextResponse.json({
      success: true,
      audioUrl: publicUrl.publicUrl,
      cached: false, // Indicate this was just generated
      storyId: exampleStoryId,
    });

  } catch (error: unknown) {
    console.error("Story generation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Story generation failed";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
