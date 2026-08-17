// Language code mappings for ElevenLabs multilingual v2 model
// Top 5 most spoken languages in the world

export const ELEVENLABS_LANGUAGE_MAP: Record<string, string> = {
  'en': 'en',      // English
  'zh': 'zh',      // Mandarin Chinese
  'hi': 'hi',      // Hindi
  'es': 'es',      // Spanish
  'fr': 'fr',      // French
}

// Language data with proper names and flag icons (ElevenLabs style)
export interface LanguageData {
  code: string
  name: string
  flag: string
  nativeName?: string
}

export const LANGUAGE_DATA: Record<string, LanguageData> = {
  'en': {
    code: 'en',
    name: 'English',
    flag: '🇬🇧',
    nativeName: 'English'
  },
  'zh': {
    code: 'zh',
    name: 'Chinese',
    flag: '🇨🇳',
    nativeName: '中文'
  },
  'hi': {
    code: 'hi',
    name: 'Hindi',
    flag: '🇮🇳',
    nativeName: 'हिन्दी'
  },
  'es': {
    code: 'es',
    name: 'Spanish',
    flag: '🇪🇸',
    nativeName: 'Español'
  },
  'fr': {
    code: 'fr',
    name: 'French',
    flag: '🇫🇷',
    nativeName: 'Français'
  },
}

// Legacy LANGUAGE_NAMES for backward compatibility
export const LANGUAGE_NAMES: Record<string, string> = {
  'en': 'English',
  'zh': 'Chinese',
  'hi': 'Hindi',
  'es': 'Spanish',
  'fr': 'French',
}

// Get all supported language codes
export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_NAMES)

// Get language data by code
export function getLanguageData(code: string): LanguageData | null {
  return LANGUAGE_DATA[code] || null
}

// Get language name by code
export function getLanguageName(code: string): string {
  return LANGUAGE_DATA[code]?.name || LANGUAGE_NAMES[code] || code
}

// Get language flag by code
export function getLanguageFlag(code: string): string {
  return LANGUAGE_DATA[code]?.flag || '🌐'
}

// Get ElevenLabs language code (with fallback)
export function getElevenLabsLanguageCode(code: string): string {
  return ELEVENLABS_LANGUAGE_MAP[code] || code
}

