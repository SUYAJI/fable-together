/**
 * Generate Unsplash image URLs for voice avatars
 * Simple name-to-URL mapping with fallbacks
 */

interface Voice {
  name: string;
  gender?: string;
}

// Direct Unsplash URLs mapped to common voice names
// These are professional portrait photos
const VOICE_IMAGE_URLS: Record<string, string> = {
  // Common ElevenLabs voice names
  'Adam': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces&q=80',
  'Antoni': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces&q=80',
  'Arnold': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=faces&q=80',
  'Bella': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces&q=80',
  'Domi': 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=faces&q=80',
  'Elli': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces&q=80',
  'Josh': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces&q=80',
  'Rachel': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces&q=80',
  'Sam': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces&q=80',
  'Sarah': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces&q=80',
  'Clyde': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces&q=80',
  'Emily': 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=faces&q=80',
  'Michael': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=faces&q=80',
  'Nicole': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces&q=80',
  // Curated voices from the app
  'Roger': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces&q=80',
  'Charlie': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces&q=80',
  'George': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=faces&q=80',
  'Laura': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces&q=80',
  'Alice': 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=faces&q=80',
};

// Fallback images by gender - using diverse, professional portraits
const FALLBACK_IMAGES = {
  male: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces&q=80',
  female: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces&q=80',
  neutral: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces&q=80',
  default: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces&q=80',
};

/**
 * Get an Unsplash image URL for a voice based on its name
 */
export function getVoiceUnsplashImage(voice: Voice): string {
  const { name, gender } = voice;
  
  // Get first name from full name
  const firstName = name.split(' ')[0].trim();
  
  // Try exact match first
  if (VOICE_IMAGE_URLS[firstName]) {
    return VOICE_IMAGE_URLS[firstName];
  }
  
  // Try case-insensitive match
  const lowerFirstName = firstName.toLowerCase();
  for (const [key, url] of Object.entries(VOICE_IMAGE_URLS)) {
    if (key.toLowerCase() === lowerFirstName) {
      return url;
    }
  }
  
  // Fallback to gender-based image
  if (gender) {
    const genderLower = gender.toLowerCase();
    if (genderLower.includes('male') && !genderLower.includes('fe')) {
      return FALLBACK_IMAGES.male;
    } else if (genderLower.includes('female') || genderLower.includes('woman')) {
      return FALLBACK_IMAGES.female;
    } else if (genderLower.includes('neutral')) {
      return FALLBACK_IMAGES.neutral;
    }
  }
  
  // Default fallback
  return FALLBACK_IMAGES.default;
}

