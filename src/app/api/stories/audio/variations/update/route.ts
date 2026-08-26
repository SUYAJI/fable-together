import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { demoModeDisabledResponse } from "@/lib/demo-api-response"

export async function PATCH(request: Request) {
  const demoResponse = demoModeDisabledResponse("Production audio variation updates")
  if (demoResponse) return demoResponse
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id, name, description } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      )
    }

    // Build update object (only include fields that are provided)
    const updateData: { name?: string; description?: string } = {}
    if (name !== undefined) {
      updateData.name = name.trim() || null
    }
    if (description !== undefined) {
      updateData.description = description.trim() || null
    }

    // Update the audio variation
    const { data: variation, error: updateError } = await supabase
      .from("story_audio_variations")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update audio variation: ${updateError.message}` },
        { status: 500 }
      )
    }

    if (!variation) {
      return NextResponse.json(
        { error: "Audio variation not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      variation,
      message: "Audio variation updated successfully",
    })

  } catch (error: unknown) {
    const { handleApiError } = await import("@/lib/api-error-handler");
    return handleApiError(error, "Failed to update audio variation", 500);
  }
}
