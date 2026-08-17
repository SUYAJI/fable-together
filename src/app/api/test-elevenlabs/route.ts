import { NextResponse } from "next/server";
import { getVoices } from "@/lib/elevenlabs";

export async function GET() {
  try {
    console.log("Testing ElevenLabs API...");
    console.log("API Key exists:", !!process.env.ELEVENLABS_API_KEY);
    console.log("API Key length:", process.env.ELEVENLABS_API_KEY?.length);
    
    const voices = await getVoices();
    console.log("Successfully fetched voices:", voices.length);
    
    return NextResponse.json({ 
      success: true, 
      voiceCount: voices.length,
      sampleVoice: voices[0] || null,
      apiKeyExists: !!process.env.ELEVENLABS_API_KEY,
      apiKeyLength: process.env.ELEVENLABS_API_KEY?.length
    });
  } catch (error) {
    console.error("ElevenLabs test failed:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        apiKeyExists: !!process.env.ELEVENLABS_API_KEY,
        apiKeyLength: process.env.ELEVENLABS_API_KEY?.length
      },
      { status: 500 }
    );
  }
}
