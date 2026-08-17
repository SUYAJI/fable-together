import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { ttsToMp3 } from "@/lib/elevenlabs";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Authentication required
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { voiceId, text, language = "en" } = await request.json();

    if (!voiceId || !text) {
      return NextResponse.json({ 
        error: "voiceId and text are required" 
      }, { status: 400 });
    }

    // Generate preview audio using ElevenLabs
    const audioBuffer = await ttsToMp3({
      text,
      voiceId,
      language: language || "en",
    });

    // Return audio file directly
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error: unknown) {
    console.error("Voice preview error:", error);
    const errorMessage = error instanceof Error ? error.message : "Voice preview failed";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
