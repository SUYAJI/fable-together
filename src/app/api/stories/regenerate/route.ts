import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { ttsToMp3, calculateTokenCost } from "@/lib/elevenlabs";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { 
      storyId, 
      voiceId, 
      language = "en", 
      backgroundMusic = false, 
      soundEffects = false 
    } = await request.json();

    if (!storyId || !voiceId) {
      return NextResponse.json({ 
        error: "Story ID and voice ID are required" 
      }, { status: 400 });
    }

    // Get the story (ensure user owns it)
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("*")
      .eq("id", storyId)
      .eq("owner_id", user.id)
      .single();

    if (storyError || !story) {
      return NextResponse.json({ 
        error: "Story not found or access denied" 
      }, { status: 404 });
    }

    // Get user's token balance
    const { data: profile } = await supabase
      .from("profiles")
      .select("token_balance")
      .eq("id", user.id)
      .single();

    const currentBalance = profile?.token_balance || 0;

    // Calculate token cost
    const wordCount = story.body?.split(" ").length || 0;
    const tokenCost = calculateTokenCost(wordCount, "eleven_multilingual_v2", {
      backgroundMusic,
      soundEffects,
    });

    if (currentBalance < tokenCost) {
      return NextResponse.json({ 
        error: `Insufficient tokens. Required: ${tokenCost}, Available: ${currentBalance}` 
      }, { status: 400 });
    }

    // Generate new audio using ElevenLabs
    const audioBuffer = await ttsToMp3({
      text: story.body || story.title,
      voiceId,
    });

    // Upload new audio to Supabase Storage
    const filename = `user-${user.id}/story-${storyId}-${Date.now()}-${randomUUID()}.mp3`;
    const { data: upload, error: uploadError } = await supabase.storage
      .from("audio")
      .upload(filename, audioBuffer, {
        contentType: "audio/mpeg",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ 
        error: `Audio upload failed: ${uploadError.message}` 
      }, { status: 500 });
    }

    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from("audio")
      .getPublicUrl(upload.path);

    // Update story with new settings and audio
    const { data: updatedStory, error: updateError } = await supabase
      .from("stories")
      .update({
        audio_url: publicUrl.publicUrl,
        language,
        narrator_voice_id: voiceId,
        background_music: backgroundMusic,
        sound_effects: soundEffects,
        token_cost: story.token_cost + tokenCost, // Add to existing cost
      })
      .eq("id", storyId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ 
        error: `Story update failed: ${updateError.message}` 
      }, { status: 500 });
    }

    // Create new story_audio record
    const { error: audioRecordError } = await supabase
      .from("story_audio")
      .insert({
        story_id: storyId,
        voice_id: voiceId,
        audio_url: publicUrl.publicUrl,
        duration_seconds: null,
        status: "ready",
      });

    if (audioRecordError) {
      console.warn("Story audio record creation failed:", audioRecordError);
    }

    // Deduct tokens from user's balance
    const { error: balanceError } = await supabase
      .from("profiles")
      .update({ token_balance: currentBalance - tokenCost })
      .eq("id", user.id);

    if (balanceError) {
      console.warn("Token balance update failed:", balanceError);
    }

    return NextResponse.json({
      success: true,
      story: {
        id: updatedStory.id,
        title: updatedStory.title,
        audioUrl: publicUrl.publicUrl,
        tokenCost,
        remainingBalance: currentBalance - tokenCost,
      },
    });

  } catch (error: unknown) {
    console.error("Story regeneration error:", error);
    const errorMessage = error instanceof Error ? error.message : "Story regeneration failed";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
