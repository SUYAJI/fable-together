/**
 * Voices API Route
 * 
 * Returns all available voices (preset and cloned) for the current user.
 * Combines ElevenLabs preset voices with user's cloned voices.
 * 
 * Features:
 * - Caching for improved performance (5-minute cache)
 * - Voice tagging and categorization
 * - Expanded descriptions generation
 * - Filtering of curated voices
 * 
 * GET /api/voices
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getVoices } from "@/lib/elevenlabs";
import { isDemoMode } from "@/lib/app-mode";
import { demoResponses } from "@/lib/services/demo/responses";

/**
 * Cache for voices to improve performance
 * Reduces API calls to ElevenLabs by caching preset voices
 */
export const voicesCache = new Map<string, { voices: unknown[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Clear the voices cache
 * Useful after voice deletions or updates
 */
export function clearVoicesCache() {
  voicesCache.clear();
}

/**
 * Get all available voices for the current user
 * 
 * @returns NextResponse with voices array containing preset and cloned voices
 */
export async function GET() {
  if (isDemoMode()) {
    return NextResponse.json(demoResponses.voices);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Authentication required
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check cache first for better performance
    const cacheKey = 'preset-voices';
    const cachedData = voicesCache.get(cacheKey);
    const now = Date.now();
    
    let presetVoices = [];
    if (cachedData && (now - cachedData.timestamp) < CACHE_DURATION) {
      // Using cached preset voices
      presetVoices = cachedData.voices;
    } else {
      try {
        presetVoices = await getVoices();
        // Successfully fetched preset voices
        // Cache the result
        voicesCache.set(cacheKey, {
          voices: presetVoices,
          timestamp: now
        });
      } catch (elevenLabsError) {
        console.error("ElevenLabs API error:", elevenLabsError);
        return NextResponse.json(
          { 
            error: "Failed to fetch voices from ElevenLabs", 
            details: elevenLabsError instanceof Error ? elevenLabsError.message : "Unknown error",
            voices: [] // Still return empty voices array for graceful degradation
          },
          { status: 500 }
        );
      }
    }
    
    // Fetch user's cloned voices from database (only if user is authenticated)
    let userVoices = [];
    if (user) {
      const { data, error: voicesError } = await supabase
        .from("voices")
        .select("*")
        .eq("owner_id", user.id);

      if (voicesError) {
        console.error("Error fetching user voices:", voicesError);
      } else {
        userVoices = data || [];
      }
    }

    /**
     * Interface for ElevenLabs voice data
     */
    interface ElevenLabsVoice {
      voice_id: string
      name?: string
      description?: string
      labels?: {
        accent?: string
        age?: string
        gender?: string
        use_case?: string
        [key: string]: unknown
      }
      category?: string
      [key: string]: unknown
    }

    /**
     * Interface for user voice from database
     */
    interface UserVoice {
      voice_id: string
      label: string
      description?: string
      category?: string
      provider?: string
      created_at?: string
    }

    /**
     * Helper function to determine tags based on voice characteristics
     * For the 6 curated voices, we'll assign tags manually after filtering
     * This function is used for non-curated voices
     */
    const determineTags = (voice: ElevenLabsVoice): string[] => {
      // Default tags will be assigned manually for curated voices
      // This function is used for non-curated voices
      const tags: string[] = [];
      const nameLower = (voice.name || '').toLowerCase();
      const descLower = (voice.description || '').toLowerCase();
      const useCase = (voice.labels?.use_case || '').toLowerCase();
      const category = (voice.category || '').toLowerCase();

      // Check for family-related voices
      if (
        nameLower.includes('mom') || nameLower.includes('dad') || 
        nameLower.includes('grandma') || nameLower.includes('grandpa') ||
        nameLower.includes('mother') || nameLower.includes('father') ||
        nameLower.includes('parent') || descLower.includes('family') ||
        useCase.includes('family') || category.includes('family')
      ) {
        tags.push('Family');
      }

      // Check for educator-related voices
      if (
        descLower.includes('teacher') || descLower.includes('educator') ||
        descLower.includes('professor') || descLower.includes('instructor') ||
        useCase.includes('education') || useCase.includes('teaching') ||
        category.includes('education')
      ) {
        tags.push('Educator');
      }

      // Check for narrator-related voices
      if (
        descLower.includes('narrator') || descLower.includes('storyteller') ||
        descLower.includes('storytelling') || useCase.includes('narration') ||
        useCase.includes('narrator') || category.includes('narrator')
      ) {
        tags.push('Narrator');
      }

      // Default to Narrator if no tags found (most voices are narrators)
      if (tags.length === 0) {
        tags.push('Narrator');
      }

      return tags;
    };

    /**
     * Helper function to generate expanded descriptions
     * Creates a comprehensive description from voice metadata
     */
    const generateExpandedDescription = (voice: ElevenLabsVoice): string => {
      const accent = voice.labels?.accent || 'American';
      const age = voice.labels?.age || 'Adult';
      const gender = voice.labels?.gender || 'Neutral';
      const useCase = voice.labels?.use_case || 'General';
      const baseDescription = voice.description || '';
      
      // Create one smooth, readable sentence
      let desc = '';
      
      // Start with gender and age if available
      if (gender && gender !== 'Neutral') {
        const ageDesc = age && age !== 'Adult' ? ` ${age.toLowerCase()}` : '';
        desc = `A ${gender.toLowerCase()}${ageDesc} voice`;
      } else {
        desc = 'A professional voice';
      }
      
      // Add accent if not American
      if (accent && accent !== 'American') {
        desc += ` with a ${accent.toLowerCase()} accent`;
      }
      
      // Add main characteristic from base description or use case
      if (baseDescription) {
        // Extract key phrase from base description (first 50 chars or first sentence)
        const firstSentence = baseDescription.split('.')[0].trim();
        if (firstSentence.length < 100) {
          desc += ` that ${firstSentence.toLowerCase()}`;
        } else {
          // Use a generic description based on use case
          if (useCase.toLowerCase().includes('narration') || useCase.toLowerCase().includes('storytelling')) {
            desc += ' perfect for bringing stories to life with engaging narration';
          } else if (useCase.toLowerCase().includes('education')) {
            desc += ' ideal for educational content and clear explanations';
          } else {
            desc += ' versatile for various storytelling needs';
          }
        }
      } else {
        // Generate based on use case
        if (useCase.toLowerCase().includes('narration') || useCase.toLowerCase().includes('storytelling')) {
          desc += ' perfect for bringing stories to life with engaging narration';
        } else if (useCase.toLowerCase().includes('education')) {
          desc += ' ideal for educational content and clear explanations';
        } else {
          desc += ' versatile for various storytelling needs';
        }
      }
      
      return desc + '.';
    };

    // Combine and format voices
    const allVoices = [
      // Preset voices (from ElevenLabs)
      ...presetVoices.map((voice: ElevenLabsVoice) => ({
        id: voice.voice_id,
        name: voice.name,
        description: generateExpandedDescription(voice),
        category: voice.category || 'General',
        accent: voice.labels?.accent || 'American',
        age: voice.labels?.age || 'Adult',
        gender: voice.labels?.gender || 'Neutral',
        use_case: voice.labels?.use_case || 'General',
        languages: voice.labels?.languages || ['en'], // Default to English
        tags: determineTags(voice),
        is_preset: true,
        is_cloned: false,
        provider: 'elevenlabs',
        created_at: null,
      })),
      // User's cloned voices (default to Family tag)
      ...userVoices.map((voice: UserVoice) => ({
        id: voice.voice_id,
        name: voice.label,
        description: `Your cloned voice: ${voice.label}. This personalized voice brings a special connection to your stories, making them feel more intimate and meaningful. Perfect for creating stories that feature family members as narrators, adding a personal touch that makes each story unique and memorable.`,
        category: 'Cloned',
        accent: 'Custom',
        age: 'Custom',
        gender: 'Custom',
        use_case: 'Personal',
        tags: ['Family'], // Cloned voices are typically family members
        is_preset: false,
        is_cloned: true,
        provider: voice.provider,
        created_at: voice.created_at,
      }))
    ];

    const response = NextResponse.json({ voices: allVoices });
    
    // Add caching headers for better performance
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    response.headers.set('CDN-Cache-Control', 'public, s-maxage=300');
    
    return response;
  } catch (error) {
    console.error("Error fetching voices:", error);
    return NextResponse.json(
      { error: "Failed to fetch voices" },
      { status: 500 }
    );
  }
}
