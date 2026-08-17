import { NextResponse } from "next/server";
import { TranslationService } from "@/lib/translation";
import { isDemoMode } from "@/lib/app-mode";

/**
 * POST /api/translate
 * Translate text to target language
 * Body: { text, targetLanguage, sourceLanguage? }
 */
export async function POST(request: Request) {
  try {
    const { text, targetLanguage, sourceLanguage = "en" } = await request.json();

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: "text and targetLanguage are required" },
        { status: 400 }
      );
    }

    if (isDemoMode()) {
      return NextResponse.json({
        success: true,
        translatedText: text,
        sourceLanguage,
        targetLanguage,
        provider: "demo-original-text",
        translated: false,
        mode: "demo",
      });
    }

    // If target language is same as source, return original text
    if (targetLanguage === sourceLanguage) {
      return NextResponse.json({
        success: true,
        translatedText: text,
        sourceLanguage,
        targetLanguage,
        provider: "none",
      });
    }

    const translationService = new TranslationService();
    const result = await translationService.translate(
      text,
      targetLanguage,
      sourceLanguage
    );

    // If fallback provider was used (no API key), return a warning
    if (result.provider === 'fallback') {
      return NextResponse.json({
        success: false,
        error: "Translation API key not configured. Please add GOOGLE_TRANSLATE_API_KEY to your .env.local file.",
        translatedText: text, // Return original text as fallback
        sourceLanguage: result.sourceLanguage,
        targetLanguage: result.targetLanguage,
        provider: result.provider,
      }, { status: 503 }); // Service Unavailable
    }

    return NextResponse.json({
      success: true,
      translatedText: result.translatedText,
      sourceLanguage: result.sourceLanguage,
      targetLanguage: result.targetLanguage,
      provider: result.provider,
    });
  } catch (error: unknown) {
    console.error("Translation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Translation failed";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", {
      message: errorMessage,
      stack: errorStack,
      apiKeyExists: !!process.env.GOOGLE_TRANSLATE_API_KEY,
    });
    return NextResponse.json(
      {
        error: errorMessage,
        success: false,
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

