// Translation service for multilingual story content
// Supports multiple translation providers with a unified interface

export interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  provider: string;
}

export interface TranslationProvider {
  translate(text: string, targetLanguage: string, sourceLanguage?: string): Promise<TranslationResult>;
}

/**
 * Google Translate API implementation
 * Uses Google Cloud Translation API v2 (free tier available)
 * 
 * To use this, add to your .env.local:
 * GOOGLE_TRANSLATE_API_KEY=your_api_key
 * 
 * Get API key: https://console.cloud.google.com/apis/credentials
 * Enable: Cloud Translation API
 */
class GoogleTranslateProvider implements TranslationProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async translate(
    text: string,
    targetLanguage: string,
    sourceLanguage: string = 'en'
  ): Promise<TranslationResult> {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${this.apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: sourceLanguage,
        target: targetLanguage,
        format: 'text',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Google Translate API error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorText;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      console.error("Google Translate API error details:", {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (data.data?.translations?.[0]?.translatedText) {
      return {
        translatedText: data.data.translations[0].translatedText,
        sourceLanguage: data.data.translations[0].detectedSourceLanguage || sourceLanguage,
        targetLanguage,
        provider: 'google',
      };
    }

    throw new Error('Invalid response from Google Translate API');
  }
}

/**
 * Fallback translation using a free/public API
 * Note: This is a placeholder - replace with actual free API if Google Translate not available
 */
class FallbackTranslateProvider implements TranslationProvider {
  async translate(
    text: string,
    targetLanguage: string,
    sourceLanguage: string = 'en'
  ): Promise<TranslationResult> {
    // Placeholder: In a real implementation, you might use:
    // - LibreTranslate (free, self-hosted)
    // - MyMemory Translation API (has free tier)
    // - DeepL API (paid but high quality)
    
    // For now, return the original text with a note
    console.warn(`Translation not available for ${targetLanguage}. Using fallback.`);
    
    return {
      translatedText: text, // Fallback to original
      sourceLanguage,
      targetLanguage,
      provider: 'fallback',
    };
  }
}

/**
 * Main translation service
 * Automatically selects the best available provider
 */
export class TranslationService {
  private provider: TranslationProvider;

  constructor() {
    const googleApiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    
    if (googleApiKey) {
      this.provider = new GoogleTranslateProvider(googleApiKey);
    } else {
      console.warn('No translation API key found. Using fallback provider.');
      this.provider = new FallbackTranslateProvider();
    }
  }

  /**
   * Translate text to target language
   */
  async translate(
    text: string,
    targetLanguage: string,
    sourceLanguage: string = 'en'
  ): Promise<TranslationResult> {
    return this.provider.translate(text, targetLanguage, sourceLanguage);
  }

  /**
   * Translate multiple texts in batch
   */
  async translateBatch(
    texts: string[],
    targetLanguage: string,
    sourceLanguage: string = 'en'
  ): Promise<TranslationResult[]> {
    // Translate sequentially (can be optimized with parallel requests if API supports)
    const results: TranslationResult[] = [];
    
    for (const text of texts) {
      const result = await this.translate(text, targetLanguage, sourceLanguage);
      results.push(result);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }
}

// Language code mapping for consistency
export const LANGUAGE_CODES = {
  en: 'en',
  es: 'es',
  fr: 'fr',
  de: 'de',
  it: 'it',
  zh: 'zh',
  ja: 'ja',
  ar: 'ar',
} as const;

export type LanguageCode = typeof LANGUAGE_CODES[keyof typeof LANGUAGE_CODES];

