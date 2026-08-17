import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

/**
 * GET /api/stories/audio?storyId={id}&voiceId={id}&language={code}
 * Public endpoint to get cached audio URL for a story/voice/language combination
 * No authentication required - used for pre-generated audio
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get("storyId");
    const voiceId = searchParams.get("voiceId");
    const language = searchParams.get("language") || "en";

    if (!storyId || !voiceId) {
      return NextResponse.json(
        { error: "storyId and voiceId parameters are required" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // Construct cached audio file path
    // Path structure: {voiceId}/stories/{storyId}/{language}.mp3
    const cachedAudioPath = `${voiceId}/stories/${storyId}/${language}.mp3`;

    // Check if cached audio exists in storage
    const { data: existingFiles, error: listError } = await supabase.storage
      .from("audio")
      .list(`${voiceId}/stories/${storyId}`, {
        search: `${language}.mp3`,
      });

    if (!listError && existingFiles && existingFiles.length > 0) {
      // Cached audio exists! Return the public URL
      const { data: publicUrl } = supabase.storage
        .from("audio")
        .getPublicUrl(cachedAudioPath);

      return NextResponse.json({
        success: true,
        audioUrl: publicUrl.publicUrl,
        cached: true,
        exists: true,
      });
    }

    // Audio doesn't exist yet
    return NextResponse.json({
      success: false,
      exists: false,
      message: "Cached audio not found. Audio may need to be generated.",
    });
  } catch (error: unknown) {
    console.error("Audio fetch error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage, exists: false },
      { status: 500 }
    );
  }
}

