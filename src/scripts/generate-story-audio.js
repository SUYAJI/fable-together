const fs = require('fs');
const path = require('path');

// This script generates real audio files for the 3 example stories using ElevenLabs API
// Run this once to create the audio files, then they'll be static assets

const stories = [
  {
    id: 1,
    title: "The Adventure Begins",
    text: "Once upon a time, in a magical forest far away, there lived a brave little rabbit named Luna. Luna had always dreamed of going on grand adventures, but she was too small and too scared to leave her cozy burrow. One sunny morning, Luna heard a mysterious sound coming from deep in the forest. It was the most beautiful melody she had ever heard. Her curiosity overcame her fear, and she decided to follow the sound. As she hopped through the tall grass and under the ancient oak trees, Luna discovered a magical clearing where a wise old owl was playing a golden flute. The owl smiled at Luna and said, 'Welcome, little one. I've been waiting for someone brave enough to find me.' From that day forward, Luna learned that the greatest adventures begin with a single step into the unknown.",
    voiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel - good for children's stories
    fileName: "adventure-begins.mp3"
  },
  {
    id: 2,
    title: "The Mystery Unfolds", 
    text: "Detective Maya had always been curious about the old lighthouse on the cliff. When strange lights started appearing there at night, she knew she had to investigate. Armed with her magnifying glass and notebook, Maya discovered a secret passage behind the lighthouse keeper's quarters. Inside, she found a hidden room filled with ancient maps and a mysterious journal. The journal spoke of a lost treasure and a secret that had been kept for generations. As Maya followed the clues, she realized that the greatest mystery wasn't about finding treasure, but about understanding the importance of preserving history and the stories of those who came before us.",
    voiceId: "AZnzlk1XvdvUeBnXmlld", // Domi - good for mystery stories
    fileName: "mystery-unfolds.mp3"
  },
  {
    id: 3,
    title: "The Enchanted Forest",
    text: "Deep in the heart of the Enchanted Forest, where the trees whispered secrets and the flowers sang lullabies, lived a young fairy named Zara. Zara had the special gift of being able to understand the language of all forest creatures. When the forest began to lose its magic, Zara embarked on a quest to find the Crystal of Harmony, the source of all forest magic. Along her journey, she met talking animals, dancing flowers, and wise old trees who taught her that the real magic wasn't in crystals or spells, but in the love and care we show to nature and each other.",
    voiceId: "EXAVITQu4vr4xnSDxMaL", // Bella - good for fantasy stories
    fileName: "enchanted-forest.mp3"
  }
];

async function generateAudioFile(story) {
  try {
    console.log(`Generating audio for: ${story.title}`);
    
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + story.voiceId, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: story.text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const audioPath = path.join(process.cwd(), 'public', 'audio', story.fileName);
    
    // Ensure directory exists
    const audioDir = path.dirname(audioPath);
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }
    
    fs.writeFileSync(audioPath, Buffer.from(audioBuffer));
    console.log(`✅ Generated: ${story.fileName}`);
    
  } catch (error) {
    console.error(`❌ Failed to generate ${story.fileName}:`, error.message);
  }
}

async function generateAllAudio() {
  console.log('🎵 Starting audio generation for example stories...');
  console.log('This will use your ElevenLabs API key to generate real audio files.');
  console.log('');
  
  for (const story of stories) {
    await generateAudioFile(story);
    // Add delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('');
  console.log('🎉 Audio generation complete!');
  console.log('The audio files are now available in /public/audio/');
}

// Check if API key is available
if (!process.env.ELEVENLABS_API_KEY) {
  console.error('❌ ELEVENLABS_API_KEY environment variable is not set');
  console.log('Please set your ElevenLabs API key in .env.local');
  process.exit(1);
}

generateAllAudio().catch(console.error);