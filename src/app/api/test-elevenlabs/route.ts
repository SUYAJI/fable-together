import { NextResponse } from "next/server";
import { getVoices } from "@/lib/elevenlabs";
import { demoModeDisabledResponse } from "@/lib/demo-api-response";

export async function GET() {
  const demoResponse = demoModeDisabledResponse("ElevenLabs diagnostics")
  if (demoResponse) return demoResponse
  try {
    const voices = await getVoices();
    
    return NextResponse.json({ 
      success: true, 
      voiceCount: voices.length,
      sampleVoice: voices[0] || null,
      apiKeyExists: !!process.env.ELEVENLABS_API_KEY
    });
  } catch (error) {
    console.error("ElevenLabs test failed:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        apiKeyExists: !!process.env.ELEVENLABS_API_KEY
      },
      { status: 500 }
    );
  }
}
