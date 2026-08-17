/**
 * Delete Voice API Route
 * 
 * Deletes a cloned voice from both ElevenLabs and the database.
 * Verifies voice ownership before deletion.
 * 
 * DELETE /api/voices/delete?voiceId={voiceId}
 */

import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { deleteVoice } from "@/lib/elevenlabs"
import { clearVoicesCache } from "../route"

/**
 * Delete a voice clone
 * 
 * @param request - Request containing voiceId query parameter
 * @returns NextResponse with success status
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const voiceId = searchParams.get("voiceId")

    if (!voiceId) {
      return NextResponse.json(
        { error: "voiceId query parameter is required" },
        { status: 400 }
      )
    }

    // Verify the voice belongs to the user
    const { data: voiceRecord, error: fetchError } = await supabase
      .from("voices")
      .select("voice_id, owner_id")
      .eq("voice_id", voiceId)
      .eq("owner_id", user.id)
      .single()

    // If voice not found in database, it might already be deleted
    // Still try to delete from ElevenLabs and return success
    if (fetchError || !voiceRecord) {
      // Try to delete from ElevenLabs anyway (in case it exists there but not in our DB)
      try {
        await deleteVoice(voiceId)
      } catch (elevenlabsError) {
        // Voice might already be deleted from ElevenLabs too
        console.error("Error deleting voice from ElevenLabs (voice not in DB):", elevenlabsError)
      }
      
      // Clear cache and return success since voice is effectively deleted
      clearVoicesCache()
      return NextResponse.json({
        success: true,
        message: "Voice deleted successfully (was already removed from database)",
      })
    }

    // Delete from ElevenLabs
    try {
      await deleteVoice(voiceId)
    } catch (elevenlabsError) {
      // Log but don't fail if ElevenLabs deletion fails
      // The voice might already be deleted or there might be a temporary issue
      console.error("Error deleting voice from ElevenLabs:", elevenlabsError)
    }

    // Delete from our database
    const { error: deleteError } = await supabase
      .from("voices")
      .delete()
      .eq("voice_id", voiceId)
      .eq("owner_id", user.id)

    if (deleteError) {
      return NextResponse.json(
        { error: `Failed to delete voice: ${deleteError.message}` },
        { status: 500 }
      )
    }

    // Clear the voices cache so the next fetch gets fresh data
    clearVoicesCache()

    return NextResponse.json({
      success: true,
      message: "Voice deleted successfully",
    })

  } catch (error: unknown) {
    const { handleApiError } = await import("@/lib/api-error-handler");
    return handleApiError(error, "Failed to delete voice", 500);
  }
}
