/**
 * Audio Variations API Route
 * 
 * Returns all saved audio variations for a story.
 * Includes voice names and language information.
 * 
 * GET /api/stories/audio/variations?storyId={storyId}
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getLanguageName } from "@/lib/language-codes";
import { isDemoMode } from "@/lib/app-mode";

/**
 * Interface for audio variation from database
 */
interface AudioVariation {
  id: string
  story_id: number
  voice_id: string
  language_code: string
  audio_url: string
  speed: number
  name?: string | null
  description?: string | null
  created_at: string
}

/**
 * Get all audio variations for a story
 * 
 * @param request - Request containing storyId query parameter
 * @returns NextResponse with variations array
 */
export async function GET(request: Request) {
  if (isDemoMode()) {
    return NextResponse.json({
      success: true,
      variations: [],
      persisted: false,
      mode: "demo",
    });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Authentication required
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get("storyId");

    if (!storyId) {
      return NextResponse.json({ 
        error: "storyId query parameter is required" 
      }, { status: 400 });
    }

    // Fetch saved audio variations for this story
    const { data: variations, error: fetchError } = await supabase
      .from("story_audio_variations")
      .select("*")
      .eq("story_id", parseInt(storyId))
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    // Map variations to include name and description (default if not set)
    const variationsWithDefaults = (variations || []).map((variation: AudioVariation) => ({
      ...variation,
      name: variation.name || `${variation.voice_id} - ${variation.language_code.toUpperCase()}`,
      description: variation.description || null,
    }));

    // If table doesn't exist or no variations, return empty array
    if (fetchError) {
      // Check if it's a "relation does not exist" error (table not created yet)
      if (fetchError.code === '42P01' || fetchError.message?.includes('does not exist')) {
        // Silently return empty array - table doesn't exist yet
        return NextResponse.json({
          success: true,
          variations: [],
        });
      }
      // Check for RLS policy errors (common when user is not authenticated)
      if (fetchError.code === '42501' || fetchError.message?.includes('permission denied')) {
        // Silently return empty array - RLS policy blocking access
        return NextResponse.json({
          success: true,
          variations: [],
        });
      }
      // For other errors, still return empty array but log in development
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching variations:", fetchError);
      }
      return NextResponse.json({
        success: true,
        variations: [],
      });
    }

    // Map variations with language names
    // Voice names will be fetched on the frontend from /api/voices
    const variationsWithNames = (variations || []).map((variation) => ({
      id: variation.id,
      voiceId: variation.voice_id,
      voiceName: "Loading...", // Will be populated on frontend
      languageCode: variation.language_code,
      languageName: getLanguageName(variation.language_code),
      audioUrl: variation.audio_url,
      speed: parseFloat(variation.speed) || 1.0,
      createdAt: variation.created_at,
      name: variation.name || null,
      description: variation.description || null,
    }));

    return NextResponse.json({
      success: true,
      variations: variationsWithNames,
    });

  } catch (error: unknown) {
    console.error("Fetch audio variations error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch audio variations";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

