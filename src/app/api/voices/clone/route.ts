import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { cloneVoice } from "@/lib/elevenlabs";
import { completeQuestServerSide } from "@/lib/quest-completion";
import { isDemoMode } from "@/lib/app-mode";

/**
 * API Route: Create an Instant Voice Clone using ElevenLabs API
 * 
 * Endpoint: POST /api/voices/clone
 * 
 * Request (multipart/form-data):
 * - name: string (required) - Name for the voice clone
 * - audioFile: File (required) - Audio file to clone from
 * - removeBackgroundNoise: boolean (optional) - Whether to remove background noise
 * - description: string (optional) - Description of the voice
 * 
 * Response:
 * - success: boolean
 * - voice: { id, name, voiceId, provider, isCloned, requiresVerification }
 * 
 * Documentation: https://elevenlabs.io/docs/api-reference/voices/ivc/create
 */
export async function POST(request: Request) {
  if (isDemoMode()) {
    return NextResponse.json(
      {
        error: "Voice cloning is not performed in Demo Mode.",
        mode: "demo",
        simulated: false,
        code: "DEMO_CLONING_PENDING",
      },
      { status: 501 }
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const audioFile = formData.get("audioFile") as File;
    const removeBackgroundNoise = formData.get("removeBackgroundNoise") === "true";
    const description = formData.get("description") as string | null;

    // Validate and sanitize required fields
    if (!name || !name.trim()) {
      return NextResponse.json({ 
        error: "Voice name is required" 
      }, { status: 400 });
    }

    // Sanitize name - remove potentially dangerous characters and limit length
    const sanitizedName = name.trim().slice(0, 100).replace(/[<>\"']/g, '')
    if (sanitizedName.length === 0) {
      return NextResponse.json({ 
        error: "Voice name is required" 
      }, { status: 400 });
    }

    if (!audioFile) {
      return NextResponse.json({ 
        error: "Audio file is required" 
      }, { status: 400 });
    }

    // Validate file type - ElevenLabs accepts MP3 (192kbps+), WAV, M4A, MP4, WebM
    const allowedTypes = ["audio/mpeg", "audio/wav", "audio/mp4", "audio/m4a", "audio/webm"];
    const allowedExtensions = [".mp3", ".wav", ".m4a", ".mp4", ".webm"];
    const fileExtension = audioFile.name.toLowerCase().substring(audioFile.name.lastIndexOf("."));
    
    if (!allowedTypes.includes(audioFile.type) && !allowedExtensions.includes(fileExtension)) {
      return NextResponse.json({ 
        error: "Invalid file type. Please upload MP3 (192kbps+), WAV, M4A, MP4, or WebM files." 
      }, { status: 400 });
    }

    // Validate file size (max 25MB for ElevenLabs)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json({ 
        error: "File too large. Maximum size is 25MB." 
      }, { status: 400 });
    }

    // Clone voice with ElevenLabs Instant Voice Cloning API
    // Response: { voice_id: string, requires_verification: boolean }
    const clonedVoice = await cloneVoice({
      name: sanitizedName,
      audioFiles: audioFile, // Can be single file or array
      removeBackgroundNoise,
      description: description ? description.slice(0, 500).replace(/[<>\"']/g, '') : undefined,
      labels: {
        created_by: user.id,
        created_at: new Date().toISOString(),
      },
    });

    // Store voice in our database
    // Based on actual schema: voices table has: id, owner_id, voice_id, label, provider, category, created_at
    // Note: is_cloned column does NOT exist in the actual schema
    const insertData = {
      owner_id: user.id,
      voice_id: clonedVoice.voice_id,
      label: sanitizedName,
      provider: "elevenlabs",
      category: "narrator", // Default category
      // Note: created_at will be set automatically by database default
    };

    // Check if voice already exists (by voice_id and owner_id)
    const { data: existingVoice } = await supabase
      .from("voices")
      .select("*")
      .eq("voice_id", clonedVoice.voice_id)
      .eq("owner_id", user.id)
      .single();

    let voiceRecord;

    if (existingVoice) {
      // Voice already exists, update it instead
      const { data: updatedVoice, error: updateError } = await supabase
        .from("voices")
        .update({
          label: sanitizedName,
          provider: "elevenlabs",
          category: "narrator",
        })
        .eq("id", existingVoice.id)
        .select()
        .single();

      if (updateError) {
        console.error("Database update error:", updateError);
        return NextResponse.json({ 
          error: "Failed to update existing voice in database. The voice was created in ElevenLabs but couldn't be saved locally.",
          details: process.env.NODE_ENV === 'development' ? updateError.message : undefined
        }, { status: 500 });
      }

      voiceRecord = updatedVoice;
    } else {
      // Voice doesn't exist, insert it
      const { data: newVoice, error: dbError } = await supabase
        .from("voices")
        .insert(insertData)
        .select()
        .single();

      if (dbError) {
        // Only log in development to avoid exposing sensitive information
        if (process.env.NODE_ENV === 'development') {
          console.error("Database error:", dbError);
          console.error("Error details:", JSON.stringify(dbError, null, 2));
        }
        
        // Provide more helpful error message
        let errorMessage = "Failed to save voice to database.";
        if (dbError.code === '23505') {
          // Unique constraint violation - try to find and return existing voice
          const { data: foundVoice } = await supabase
            .from("voices")
            .select("*")
            .eq("voice_id", clonedVoice.voice_id)
            .eq("owner_id", user.id)
            .single();
          
          if (foundVoice) {
            voiceRecord = foundVoice;
            // Continue with existing voice instead of failing
          } else {
            errorMessage = "A voice with this name or ID already exists. Please choose a different name.";
          }
        } else if (dbError.code === '23503') {
          errorMessage = "Database constraint error. Please try again or contact support.";
        } else if (dbError.message) {
          // Include the error message if it's safe (doesn't contain sensitive info)
          const safeMessage = dbError.message
            .replace(/api[_-]?key/gi, '[API_KEY]')
            .replace(/password/gi, '[PASSWORD]')
            .replace(/token/gi, '[TOKEN]');
          errorMessage = `Database error: ${safeMessage}`;
        }
        
        if (!voiceRecord) {
          return NextResponse.json({ 
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
          }, { status: 500 });
        }
      } else {
        voiceRecord = newVoice;
      }
    }

    // Auto-complete "Clone a Voice" quest
    if (user) {
      completeQuestServerSide("clone-voice", user.id).catch(() => {
        // Silently fail - quest completion is not critical
      })
    }

    return NextResponse.json({
      success: true,
      voice: {
        id: voiceRecord.id,
        name: voiceRecord.label || sanitizedName,
        voiceId: clonedVoice.voice_id,
        provider: "elevenlabs",
        isCloned: true, // This is a logical flag for the frontend, not stored in DB
        requiresVerification: clonedVoice.requires_verification || false,
      },
    });

  } catch (error: unknown) {
    // Handle specific error types with user-friendly messages
    if (error instanceof Error) {
      const rawMessage = error.message.toLowerCase();
      
      if (rawMessage.includes('maximum') && rawMessage.includes('custom voice')) {
        return NextResponse.json(
          { 
            error: "You've reached the maximum number of custom voices. Custom voices include all voices you've created (both Instant Voice Clones and Professional Voice Clones). To create more voices, you can delete unused voices from your Voice Library or upgrade your ElevenLabs subscription.",
            code: "VOICE_LIMIT_REACHED"
          },
          { status: 403 }
        );
      } else if (rawMessage.includes('limit') && rawMessage.includes('voice')) {
        return NextResponse.json(
          { 
            error: "You've reached your voice limit. Please delete unused voices from your Voice Library or upgrade your subscription to create more voices.",
            code: "VOICE_LIMIT_REACHED"
          },
          { status: 403 }
        );
      }
    }
    
    // Use standardized error handler for other errors
    const { handleApiError } = await import("@/lib/api-error-handler");
    return handleApiError(error, "Voice cloning failed. Please try again.", 500);
  }
}
