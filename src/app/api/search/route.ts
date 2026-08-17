/**
 * Search API Route
 * 
 * Searches for stories and voices matching the query.
 * Returns results from example stories and user's voice library.
 * 
 * GET /api/search?q=query
 */

import { createSupabaseServerClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { getVoices } from "@/lib/elevenlabs"
import { filterCuratedVoices } from "@/lib/voice-filters"

/**
 * Interface for voice search result
 */
interface VoiceSearchResult {
  id: string
  name: string
  type: "voice"
}

/**
 * Interface for story search result
 */
interface StorySearchResult {
  id: number
  title: string
  type: "story"
  isExample: boolean
}

/**
 * Search for stories and voices
 * 
 * @param request - Request containing search query parameter
 * @returns NextResponse with matching stories and voices
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query || query.trim().length < 1) {
      return NextResponse.json({ stories: [], voices: [] })
    }

    const supabase = await createSupabaseServerClient()
    const queryTrimmed = query.trim()
    const queryLower = queryTrimmed.toLowerCase()

    // Search only the 3 example stories
    const { data: stories, error: storiesError } = await supabase
      .from("stories")
      .select("id, title, is_example")
      .eq("is_example", true)
      .ilike("title", `%${queryTrimmed}%`)

    if (storiesError) {
      console.error("Error searching stories:", storiesError)
    }

    // Search voices from the user's voice library (6 curated preset voices + user's cloned voices)
    let voices: VoiceSearchResult[] = []
    
    try {
      // Get all preset voices from ElevenLabs
      const presetVoices = await getVoices()
      
      /**
       * Interface for ElevenLabs voice data
       */
      interface ElevenLabsVoice {
        voice_id: string
        name?: string
        labels?: {
          gender?: string
          languages?: string[]
          [key: string]: unknown
        }
        [key: string]: unknown
      }

      /**
       * Interface for formatted voice data
       */
      interface FormattedVoice {
        id: string
        name: string
        gender: string
        languages: string[]
        is_preset: boolean
        voice_id?: string
        [key: string]: unknown
      }
      
      const formattedPresetVoices: FormattedVoice[] = presetVoices.map((voice: ElevenLabsVoice) => ({
        id: voice.voice_id,
        name: voice.name,
        gender: voice.labels?.gender || 'Neutral',
        languages: voice.labels?.languages || ['en'],
        is_preset: true,
        ...voice
      }))
      
      // Filter to get the 6 curated voices (same as voice library)
      const curatedVoices = filterCuratedVoices(formattedPresetVoices)
      
      // Get user's cloned voices from database (if authenticated)
      const { data: { user } } = await supabase.auth.getUser()
      interface UserVoice {
        voice_id: string
        label: string
      }
      
      let userClonedVoices: Array<{ id: string; name: string; is_cloned: boolean }> = []
      
      if (user) {
        const { data: userVoices } = await supabase
          .from("voices")
          .select("voice_id, label")
          .eq("owner_id", user.id)
        
        if (userVoices) {
          userClonedVoices = userVoices.map((v: UserVoice) => ({
            id: v.voice_id,
            name: v.label,
            is_cloned: true,
          }))
        }
      }
      
      // Combine curated preset voices + user's cloned voices (same as voice library)
      const allLibraryVoices = [...curatedVoices, ...userClonedVoices]
      
      // Filter voices that match the search term (case-insensitive, contains)
      const matchingVoices = allLibraryVoices.filter((voice) => 
        voice.name?.toLowerCase().includes(queryLower)
      )
      
      voices = matchingVoices.map((v) => ({
        id: (v as FormattedVoice).voice_id || v.id,
        name: v.name,
        type: "voice" as const
      }))
    } catch (error) {
      console.error("Error fetching voices for search:", error)
    }

    interface StoryData {
      id: number
      title: string
      is_example: boolean
    }
    
    const results = {
      stories: (stories || []).map((s: StoryData): StorySearchResult => ({
        id: s.id,
        title: s.title,
        type: "story",
        isExample: s.is_example
      })),
      voices
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Error in search:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

