// Generate a simple avatar for voices based on their characteristics
export function generateVoiceAvatar(voice: {
  name: string;
  gender?: string;
  age?: string;
  accent?: string;
  category?: string;
}): string {
  // Create a simple avatar using initials and colors
  const name = voice.name || 'Voice';
  const initials = name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  
  // Generate colors based on voice characteristics
  let bgColor = '#6366f1'; // Default purple
  const textColor = '#ffffff';
  
  if (voice.gender?.toLowerCase().includes('female') || voice.name.toLowerCase().includes('rachel') || voice.name.toLowerCase().includes('sarah')) {
    bgColor = '#ec4899'; // Pink
  } else if (voice.gender?.toLowerCase().includes('male') || voice.name.toLowerCase().includes('drew') || voice.name.toLowerCase().includes('clyde')) {
    bgColor = '#3b82f6'; // Blue
  } else if (voice.age?.toLowerCase().includes('young') || voice.age?.toLowerCase().includes('child')) {
    bgColor = '#10b981'; // Green
  } else if (voice.age?.toLowerCase().includes('old') || voice.age?.toLowerCase().includes('senior')) {
    bgColor = '#f59e0b'; // Orange
  } else if (voice.category?.toLowerCase().includes('narrator') || voice.category?.toLowerCase().includes('professional')) {
    bgColor = '#8b5cf6'; // Purple
  }
  
  // Create SVG data URL
  const svg = `
    <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" fill="${bgColor}" rx="32"/>
      <text x="32" y="40" font-family="Arial, sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="${textColor}">${initials}</text>
    </svg>
  `;
  
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// Generate a more detailed avatar with voice characteristics
export function generateDetailedVoiceAvatar(voice: {
  name: string;
  gender?: string;
  age?: string;
  accent?: string;
  category?: string;
  description?: string;
}): string {
  const name = voice.name || 'Voice';
  const initials = name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  
  // Color scheme based on voice characteristics
  let bgColor = '#6366f1'; // Default purple
  const textColor = '#ffffff';
  
  // Gender-based colors
  if (voice.gender?.toLowerCase().includes('female')) {
    bgColor = '#ec4899'; // Pink
  } else if (voice.gender?.toLowerCase().includes('male')) {
    bgColor = '#3b82f6'; // Blue
  }
  
  // Age-based colors
  if (voice.age?.toLowerCase().includes('young')) {
    bgColor = '#10b981'; // Green
  } else if (voice.age?.toLowerCase().includes('old') || voice.age?.toLowerCase().includes('senior')) {
    bgColor = '#f59e0b'; // Orange
  }
  
  // Category-based colors
  if (voice.category?.toLowerCase().includes('narrator')) {
    bgColor = '#8b5cf6'; // Purple
  } else if (voice.category?.toLowerCase().includes('character')) {
    bgColor = '#ef4444'; // Red
  }
  
  // Create SVG with solid color (more reliable)
  const svg = `
    <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" fill="${bgColor}" rx="32"/>
      <text x="32" y="40" font-family="Arial, sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="${textColor}">${initials}</text>
    </svg>
  `;
  
  // Use encodeURIComponent for safe encoding
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
