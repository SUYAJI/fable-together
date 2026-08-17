import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { ttsToMp3, calculateTokenCost } from "@/lib/elevenlabs";
import { getElevenLabsLanguageCode } from "@/lib/language-codes";
import { TranslationService } from "@/lib/translation";

// Hardcoded example stories (matching the frontend)
const exampleStories = [
  {
    id: 1,
    title: "The Adventure Begins",
    body: "Once upon a time, in a magical forest far away, there lived a brave little rabbit named Luna. Luna had always dreamed of going on grand adventures, but she was too small and too scared to leave her cozy burrow. One sunny morning, Luna heard a mysterious sound coming from deep in the forest. It was the most beautiful melody she had ever heard. Her curiosity overcame her fear, and she decided to follow the sound. As she hopped through the tall grass and under the ancient oak trees, Luna discovered a magical clearing where a wise old owl was playing a golden flute. The owl smiled at Luna and said, 'Welcome, little one. I've been waiting for someone brave enough to find me.' From that day forward, Luna learned that the greatest adventures begin with a single step into the unknown.",
    duration: "3 min",
    tokens: 137,
  },
  {
    id: 2,
    title: "The Mystery Unfolds",
    body: "Detective Maya had always been curious about the old lighthouse on the cliff. When strange lights started appearing there at night, she knew she had to investigate. Armed with her magnifying glass and notebook, Maya discovered a secret passage behind the lighthouse keeper's quarters. Inside, she found a hidden room filled with ancient maps and a mysterious journal. The journal spoke of a lost treasure and a secret that had been kept for generations. As Maya followed the clues, she realized that the greatest mystery wasn't about finding treasure, but about understanding the importance of preserving history and the stories of those who came before us.",
    duration: "4 min",
    tokens: 156,
  },
  {
    id: 3,
    title: "The Enchanted Forest",
    body: "Deep in the heart of the Enchanted Forest, where the trees whispered secrets and the flowers sang lullabies, lived a young fairy named Zara. Zara had the special gift of being able to understand the language of all forest creatures. When the forest began to lose its magic, Zara embarked on a quest to find the Crystal of Harmony, the source of all forest magic. Along her journey, she met talking animals, dancing flowers, and wise old trees who taught her that the real magic wasn't in crystals or spells, but in the love and care we show to nature and each other.",
    duration: "5 min",
    tokens: 189,
  }
];

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // User authentication check (currently allowing unauthenticated access for testing)

    const { 
      exampleStoryId, 
      voiceId, 
      language = "en",
      speed = 1.0, // Speed parameter (0.25 to 4.0)
      translatedText, // Translated text from frontend
      backgroundMusic = false, 
      soundEffects = false,
      tags = []
    } = await request.json();

    if (!exampleStoryId || !voiceId) {
      return NextResponse.json({ 
        error: "Example story ID and voice ID are required" 
      }, { status: 400 });
    }

    // Get the example story from our hardcoded data
    const exampleStory = exampleStories.find(story => story.id === exampleStoryId);
    if (!exampleStory) {
      return NextResponse.json({ 
        error: "Example story not found" 
      }, { status: 404 });
    }

    // Calculate token cost (token balance check disabled for testing)
    const currentBalance = 1000; // Mock balance for testing
    const wordCount = exampleStory.body.split(" ").length;
    const tokenCost = calculateTokenCost(wordCount, "eleven_multilingual_v2", {
      backgroundMusic,
      soundEffects,
    });

    // Use translated text from frontend if provided, otherwise use original
    // The frontend handles translation, so we use the translated text directly
    let textToNarrate = translatedText || exampleStory.body;
    
    // If no translated text provided and language is not English, try to translate
    // (fallback for cases where frontend translation might have failed)
    if (!translatedText && language !== "en") {
      try {
        const translationService = new TranslationService();
        const translationResult = await translationService.translate(
          exampleStory.body,
          language, // Target language
          "en" // Source language (English)
        );
        textToNarrate = translationResult.translatedText;
        // Backend translation fallback
      } catch (translationError) {
        console.error("Translation failed, using English text:", translationError);
        textToNarrate = exampleStory.body; // Fallback to English
      }
    }

    // Generate audio using ElevenLabs
    // Map language code to ElevenLabs format (ISO 639-1)
    const elevenLabsLanguage = getElevenLabsLanguageCode(language);
    
    const audioBuffer = await ttsToMp3({
      text: textToNarrate, // Use translated text
      voiceId,
      language: elevenLabsLanguage,
      speed: speed,
    });

    // Return audio as base64 data URL (storage upload disabled for testing)
    // Note: Audio mixing and database operations will be re-enabled when user system is fully implemented
    const base64 = audioBuffer.toString('base64');
    const audioUrl = `data:audio/mpeg;base64,${base64}`;

    return NextResponse.json({
      success: true,
      audioUrl: audioUrl,
      story: {
        id: exampleStory.id,
        title: exampleStory.title,
        tokenCost,
        remainingBalance: currentBalance - tokenCost,
      },
    });

  } catch (error: unknown) {
    console.error("Story narration error:", error);
    const errorMessage = error instanceof Error ? error.message : "Story narration failed";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
