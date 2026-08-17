/**
 * Update Voice API Route
 * 
 * Updates voice metadata (name, tags, description) in the database.
 * Does not modify the voice in ElevenLabs, only local metadata.
 * 
 * POST /api/voices/update
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

/**
 * Update voice metadata
 * 
 * @param request - Request containing voiceId, name, tags, and description
 * @returns NextResponse with updated voice data
 */
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { voiceId, name, tags, description } = body;

    if (!voiceId || !name) {
      return NextResponse.json({ 
        error: "Voice ID and name are required" 
      }, { status: 400 });
    }

    // Update voice in database
    // First, find the voice by voice_id (ElevenLabs voice ID)
    const { data: existingVoice, error: findError } = await supabase
      .from("voices")
      .select("*")
      .eq("voice_id", voiceId)
      .eq("owner_id", user.id)
      .single();

    if (findError || !existingVoice) {
      return NextResponse.json({ 
        error: "Voice not found" 
      }, { status: 404 });
    }

    /**
     * Interface for voice update data
     */
    interface VoiceUpdateData {
      label: string
      tags?: string[]
      description?: string
    }

    // Update the voice record
    const updateData: VoiceUpdateData = {
      label: name,
    };

    // Add tags if provided (store as JSON array)
    if (tags && Array.isArray(tags)) {
      updateData.tags = tags;
    }

    // Add description if provided
    if (description) {
      updateData.description = description;
    }

    const { data: updatedVoice, error: updateError } = await supabase
      .from("voices")
      .update(updateData)
      .eq("id", existingVoice.id)
      .select()
      .single();

    if (updateError) {
      console.error("Database update error:", updateError);
      return NextResponse.json({ 
        error: "Failed to update voice" 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      voice: {
        id: updatedVoice.id,
        name: updatedVoice.label,
        voiceId: updatedVoice.voice_id,
        tags: updatedVoice.tags || [],
        description: updatedVoice.description || null,
      },
    });

  } catch (error: unknown) {
    const { handleApiError } = await import("@/lib/api-error-handler");
    return handleApiError(error, "Voice update failed", 500);
  }
}

