const fs = require('fs');
const path = require('path');

// This script generates a placeholder MP3 file with background music and sound effects
// Run this once to create the audio file for example stories

const placeholderText = `Once upon a time, in a magical forest far away, there lived a brave little rabbit named Luna. Luna had always dreamed of going on grand adventures, but she was too small and too scared to leave her cozy burrow. One sunny morning, Luna heard a mysterious sound coming from deep in the forest. It was the most beautiful melody she had ever heard. Her curiosity overcame her fear, and she decided to follow the sound. As she hopped through the tall grass and under the ancient oak trees, Luna discovered a magical clearing where a wise old owl was playing a golden flute. The owl smiled at Luna and said, 'Welcome, little one. I've been waiting for someone brave enough to find me.' From that day forward, Luna learned that the greatest adventures begin with a single step into the unknown.`;

async function generatePlaceholderAudio() {
  try {
    console.log('Generating placeholder audio with ElevenLabs API...');
    
    const response = await fetch('http://localhost:3000/api/generate-placeholder-audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: placeholderText,
        voiceId: "21m00Tcm4TlvDq8ikWAM" // Rachel voice
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Success:', data);
    
  } catch (error) {
    console.error('Error generating placeholder audio:', error);
    console.log('Make sure your Next.js development server is running on localhost:3000');
  }
}

// Run the script
generatePlaceholderAudio();
