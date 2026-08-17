// src/app/api/tts/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { ttsToMp3 } from "@/lib/elevenlabs";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { storyId, voiceId } = await req.json();
    if (!storyId || !voiceId) {
      return NextResponse.json({ error: "storyId and voiceId are required" }, { status: 400 });
    }

    // 1) Fetch the story (RLS enforces author/owner)
    const { data: story, error: storyErr } = await supabase
      .from("stories")
      .select("id, title, body, audio_url")
      .eq("id", storyId)
      .single();

    if (storyErr) {
      return NextResponse.json({ error: `Story fetch failed: ${storyErr.message}` }, { status: 400 });
    }
    const text: string = story?.body || story?.title || "Untitled";

    // 2) Generate MP3 buffer via ElevenLabs
    const mp3Buffer = await ttsToMp3({ text, voiceId });

    // 3) Upload to Supabase Storage (audio bucket)
    const filename = `user-${user.id}/story-${storyId}-${Date.now()}-${randomUUID()}.mp3`;
    const { data: upload, error: upErr } = await supabase.storage
      .from("audio")
      .upload(filename, mp3Buffer, {
        contentType: "audio/mpeg",
        upsert: false,
      });
    if (upErr) {
      return NextResponse.json({ error: `Upload failed: ${upErr.message}` }, { status: 500 });
    }

    // 4) Get a public URL (because you created public-read policy)
    const { data: pub } = supabase.storage.from("audio").getPublicUrl(upload.path);
    const audioUrl = pub.publicUrl;

    // 5) Insert artifact + update story (RLS: you own the story, allowed)
    const { error: insErr } = await supabase.from("story_audio").insert({
      story_id: storyId,
      voice_id: null, // optional: link to a row in voices if you store one
      audio_url: audioUrl,
      duration_seconds: null,
      status: "ready",
    });
    if (insErr) {
      // non-fatal; still return the URL
      console.warn("story_audio insert failed", insErr);
    }

    // Optional: keep convenience field on stories
    await supabase.from("stories").update({ audio_url: audioUrl }).eq("id", storyId);

    return NextResponse.json({ audioUrl }, { status: 200 });
  } catch (err: unknown) {
    console.error(err);
    const errorMessage = err instanceof Error ? err.message : "TTS error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
