import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { demoModeDisabledResponse } from "@/lib/demo-api-response"

export async function DELETE(request: Request) {
  const demoResponse = demoModeDisabledResponse("Production audio variation deletion")
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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "id query parameter is required" },
        { status: 400 }
      )
    }

    // Delete the audio variation
    const { error: deleteError } = await supabase
      .from("story_audio_variations")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (deleteError) {
      return NextResponse.json(
        { error: `Failed to delete audio variation: ${deleteError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Audio variation deleted successfully",
    })

  } catch (error: unknown) {
    const { handleApiError } = await import("@/lib/api-error-handler");
    return handleApiError(error, "Failed to delete audio variation", 500);
  }
}
