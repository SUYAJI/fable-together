import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { demoModeDisabledResponse } from "@/lib/demo-api-response";

export async function POST(request: Request) {
  const demoResponse = demoModeDisabledResponse("Production story saving")
  if (demoResponse) return demoResponse
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Authentication check (currently allowing unauthenticated access for testing)
    
    const { 
      title,
      body,
      audioUrl,
      voiceId,
      language,
      backgroundMusic,
      soundEffects,
      tags,
      isGenerated
    } = await request.json();

    if (!title || !body || !audioUrl) {
      return NextResponse.json({ 
        error: "Title, body, and audio URL are required" 
      }, { status: 400 });
    }

    // Create new story record
    const { data: newStory, error: storyCreateError } = await supabase
      .from("stories")
      .insert({
        title,
        body,
        author: user?.id || 'anonymous',
        owner_id: user?.id || 'anonymous',
        status: "ready",
        audio_url: audioUrl,
        is_example: false,
        language,
        narrator_voice_id: voiceId,
        background_music: backgroundMusic,
        sound_effects: soundEffects,
        tags: tags,
        is_generated: isGenerated || false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (storyCreateError) {
      return NextResponse.json({ 
        error: `Story creation failed: ${storyCreateError.message}` 
      }, { status: 500 });
    }

    // Create story_audio record
    const { error: audioRecordError } = await supabase
      .from("story_audio")
      .insert({
        story_id: newStory.id,
        voice_id: voiceId,
        audio_url: audioUrl,
        duration_seconds: null,
        status: "ready",
      });

    if (audioRecordError) {
      console.warn("Story audio record creation failed:", audioRecordError);
    }

    return NextResponse.json({
      success: true,
      story: {
        id: newStory.id,
        title: newStory.title,
        audioUrl: newStory.audio_url,
      },
    });

  } catch (error: unknown) {
    console.error("Story save error:", error);
    const errorMessage = error instanceof Error ? error.message : "Story save failed";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
