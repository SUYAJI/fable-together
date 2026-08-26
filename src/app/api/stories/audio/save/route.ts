import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getLanguageName } from "@/lib/language-codes";
import { completeQuestServerSide } from "@/lib/quest-completion";
import { demoModeDisabledResponse } from "@/lib/demo-api-response";

export async function POST(request: Request) {
  const demoResponse = demoModeDisabledResponse("Production story audio saving")
  if (demoResponse) return demoResponse
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Authentication check (currently allowing unauthenticated access for testing)

    const { 
      storyId,
      voiceId,
      languageCode,
      audioUrl,
      speed = 1.0,
      name,
      description,
    } = await request.json();

    if (!storyId || !voiceId || !languageCode || !audioUrl) {
      return NextResponse.json({ 
        error: "storyId, voiceId, languageCode, and audioUrl are required" 
      }, { status: 400 });
    }

    // Get voice name for default name if not provided
    let defaultName = name
    if (!defaultName) {
      const { data: voiceData } = await supabase
        .from("voices")
        .select("label")
        .eq("voice_id", voiceId)
        .single()
      
      const voiceName = voiceData?.label || voiceId
      const languageName = getLanguageName(languageCode)
      defaultName = `${voiceName} - ${languageName}`
    }

    // Create record in story_audio_variations table
    const { data: variation, error: insertError } = await supabase
      .from("story_audio_variations")
      .insert({
        user_id: user?.id || null, // Allow null for testing
        story_id: storyId,
        voice_id: voiceId,
        language_code: languageCode,
        audio_url: audioUrl,
        speed: speed,
        name: defaultName,
        description: description || null,
      })
      .select()
      .single();

    if (insertError) {
      // Check if it's a unique constraint violation (already exists)
      if (insertError.code === '23505') {
        // Update existing record instead
        const updateData: { audio_url: string; speed: number; name?: string; description?: string } = {
          audio_url: audioUrl,
          speed: speed,
        }
        if (name !== undefined) updateData.name = name
        if (description !== undefined) updateData.description = description

        const { data: updated, error: updateError } = await supabase
          .from("story_audio_variations")
          .update(updateData)
          .eq("user_id", user?.id || null)
          .eq("story_id", storyId)
          .eq("voice_id", voiceId)
          .eq("language_code", languageCode)
          .select()
          .single();

        if (updateError) {
          return NextResponse.json({ 
            error: `Failed to update audio variation: ${updateError.message}` 
          }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          variation: updated,
          message: "Audio variation updated",
        });
      }

      return NextResponse.json({ 
        error: `Failed to save audio variation: ${insertError.message}` 
      }, { status: 500 });
    }

    // Auto-complete "Create Audio" quest
    if (user) {
      completeQuestServerSide("create-audio", user.id).catch(() => {
        // Silently fail - quest completion is not critical
      })
    }

    return NextResponse.json({
      success: true,
      variation: variation,
      message: "Audio variation saved",
    });

  } catch (error: unknown) {
    const { handleApiError } = await import("@/lib/api-error-handler");
    return handleApiError(error, "Failed to save audio variation", 500);
  }
}

