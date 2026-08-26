import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { demoModeDisabledResponse } from "@/lib/demo-api-response";

/**
 * GET /api/translations?storyId={id}&language={code}
 * Fetch translation for a story in a specific language
 */
export async function GET(request: Request) {
  const demoResponse = demoModeDisabledResponse("Production translation storage")
  if (demoResponse) return demoResponse
  try {
    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get("storyId");
    const language = searchParams.get("language") || "en";

    if (!storyId) {
      return NextResponse.json(
        { error: "storyId parameter is required" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // Try to select all available columns, but handle missing ones gracefully
    // This allows the API to work even if some columns don't exist yet
    const { data: translation, error } = await supabase
      .from("story_translations")
      .select("title, body, language_code")
      .eq("story_id", storyId)
      .eq("language_code", language)
      .maybeSingle(); // Use maybeSingle() instead of single() for better error handling

    if (error) {
      console.error("Error fetching translation:", error);
      // If translation doesn't exist or there's an RLS issue, return null (not an error)
      // This allows the frontend to fall back to English
      return NextResponse.json({
        translation: null,
        storyId,
        language,
      });
    }

    if (!translation) {
      // Translation not found - return null so frontend can use English
      return NextResponse.json({
        translation: null,
        storyId,
        language,
      });
    }

    return NextResponse.json({
      translation: {
        title: translation.title,
        body: translation.body,
        language: translation.language_code,
      },
      storyId,
      language,
    });
  } catch (error: unknown) {
    console.error("Translation fetch error:", error);
    // Return null translation instead of error to allow fallback to English
    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get("storyId");
    const language = searchParams.get("language") || "en";
    return NextResponse.json({
      translation: null,
      storyId,
      language,
    });
  }
}

/**
 * POST /api/translations
 * Create or update a translation
 * Body: { storyId, language, title, body, translatorId? }
 */
export async function POST(request: Request) {
  const demoResponse = demoModeDisabledResponse("Production translation storage")
  if (demoResponse) return demoResponse
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { storyId, language, title, body, translatorId } = await request.json();

    if (!storyId || !language || !title || !body) {
      return NextResponse.json(
        { error: "storyId, language, title, and body are required" },
        { status: 400 }
      );
    }

    // Verify user has permission (owns story or it's an example story)
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("id, is_example, owner_id")
      .eq("id", storyId)
      .single();

    if (storyError || !story) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 }
      );
    }

    if (!story.is_example && story.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized to translate this story" },
        { status: 403 }
      );
    }

    // Upsert translation
    const { data: translation, error: upsertError } = await supabase
      .from("story_translations")
      .upsert(
        {
          story_id: storyId,
          language_code: language,
          title,
          body,
          translator_id: translatorId || user.id,
          is_auto_translated: true, // Can be updated later
          translation_provider: "google", // Default provider
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "story_id,language_code",
        }
      )
      .select()
      .single();

    if (upsertError) {
      console.error("Error upserting translation:", upsertError);
      return NextResponse.json(
        { error: "Failed to save translation" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      translation: {
        id: translation.id,
        storyId: translation.story_id,
        language: translation.language_code,
        title: translation.title,
        body: translation.body,
      },
    });
  } catch (error: unknown) {
    console.error("Translation save error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

