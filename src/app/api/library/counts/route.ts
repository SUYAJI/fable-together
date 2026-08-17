/**
 * Library Counts API Route
 * 
 * Returns counts for stories and voices in the user's library.
 * Counts include example stories and user's own stories/voices.
 * 
 * GET /api/library/counts
 */

import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { getVoices } from "@/lib/elevenlabs"
import { filterCuratedVoices } from "@/lib/voice-filters"
import { isDemoMode } from "@/lib/app-mode"
import { demoResponses } from "@/lib/services/demo/responses"

/**
 * Interface for ElevenLabs voice data
 */
interface ElevenLabsVoice {
  voice_id: string
  name: string
  labels?: {
    gender?: string
    languages?: string[]
    [key: string]: unknown
  }
  [key: string]: unknown
}

/**
 * Get library counts for stories and voices
 * 
 * @returns NextResponse with story and voice counts
 */
export async function GET() {
  if (isDemoMode()) {
    return NextResponse.json(demoResponses.libraryCounts)
  }

  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Count only visible stories: example stories + user's own stories
    let storiesCount = 0
    
    // Count example stories (visible to all users)
    const { count: exampleStoriesCount, error: exampleStoriesError } = await supabase
      .from("stories")
      .select("*", { count: "exact", head: true })
      .eq("is_example", true)

    if (!exampleStoriesError && exampleStoriesCount !== null) {
      storiesCount += exampleStoriesCount
    } else if (exampleStoriesError) {
      console.error("Error counting example stories:", exampleStoriesError)
    }

    // Count user's own stories (if authenticated)
    if (user) {
      const { count: userStoriesCount, error: userStoriesError } = await supabase
        .from("stories")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", user.id)

      if (!userStoriesError && userStoriesCount !== null) {
        storiesCount += userStoriesCount
      } else if (userStoriesError) {
        console.error("Error counting user stories:", userStoriesError)
      }
    }

    // Count only visible voices: 6 curated preset voices + user's cloned voices
    let voicesCount = 0
    
    try {
      // Get all preset voices and filter to only the 6 curated ones
      const presetVoices = await getVoices()
      const curatedPresetVoices = filterCuratedVoices(
        presetVoices.map((voice: ElevenLabsVoice) => ({
          ...voice,
          id: voice.voice_id,
          name: voice.name || '',
          gender: voice.labels?.gender || 'Neutral',
          languages: voice.labels?.languages || ['en'],
          is_preset: true,
        }))
      )
      // Count only the 6 curated preset voices
      voicesCount = curatedPresetVoices.length
    } catch (error) {
      console.error("Error fetching preset voices for count:", error)
    }

    // Count user's cloned voices (if authenticated)
    if (user) {
      const { count: userVoicesCount, error: voicesError } = await supabase
        .from("voices")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", user.id)

      if (!voicesError && userVoicesCount !== null) {
        voicesCount += userVoicesCount
      } else if (voicesError) {
        console.error("Error counting user voices:", voicesError)
      }
    }

    return NextResponse.json({
      stories: storiesCount,
      voices: voicesCount,
    })
  } catch (error) {
    console.error("Error in library/counts:", error)
    return NextResponse.json(
      { error: "Internal server error", stories: 0, voices: 0 },
      { status: 500 }
    )
  }
}
