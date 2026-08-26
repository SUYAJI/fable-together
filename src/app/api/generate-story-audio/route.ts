import { NextResponse } from "next/server";
import { ttsToMp3 } from "@/lib/elevenlabs";
import { demoModeDisabledResponse } from "@/lib/demo-api-response";

const stories = [
  {
    id: 1,
    title: "The Adventure Begins",
    text: "Once upon a time, in a magical forest far away, there lived a brave little rabbit named Luna. Luna had always dreamed of going on grand adventures, but she was too small and too scared to leave her cozy burrow. One sunny morning, Luna heard a mysterious sound coming from deep in the forest. It was the most beautiful melody she had ever heard. Her curiosity overcame her fear, and she decided to follow the sound. As she hopped through the tall grass and under the ancient oak trees, Luna discovered a magical clearing where a wise old owl was playing a golden flute. The owl smiled at Luna and said, 'Welcome, little one. I've been waiting for someone brave enough to find me.' From that day forward, Luna learned that the greatest adventures begin with a single step into the unknown.",
    voiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel
    fileName: "adventure-begins.mp3"
  },
  {
    id: 2,
    title: "The Mystery Unfolds", 
    text: "Detective Maya had always been curious about the old lighthouse on the cliff. When strange lights started appearing there at night, she knew she had to investigate. Armed with her magnifying glass and notebook, Maya discovered a secret passage behind the lighthouse keeper's quarters. Inside, she found a hidden room filled with ancient maps and a mysterious journal. The journal spoke of a lost treasure and a secret that had been kept for generations. As Maya followed the clues, she realized that the greatest mystery wasn't about finding treasure, but about understanding the importance of preserving history and the stories of those who came before us.",
    voiceId: "AZnzlk1XvdvUeBnXmlld", // Domi
    fileName: "mystery-unfolds.mp3"
  },
  {
    id: 3,
    title: "The Enchanted Forest",
    text: "Deep in the heart of the Enchanted Forest, where the trees whispered secrets and the flowers sang lullabies, lived a young fairy named Zara. Zara had the special gift of being able to understand the language of all forest creatures. When the forest began to lose its magic, Zara embarked on a quest to find the Crystal of Harmony, the source of all forest magic. Along her journey, she met talking animals, dancing flowers, and wise old trees who taught her that the real magic wasn't in crystals or spells, but in the love and care we show to nature and each other.",
    voiceId: "EXAVITQu4vr4xnSDxMaL", // Bella
    fileName: "enchanted-forest.mp3"
  }
];

export async function POST(request: Request) {
  const demoResponse = demoModeDisabledResponse("Production story audio generation")
  if (demoResponse) return demoResponse
  try {
    const { storyId } = await request.json();
    
    const story = stories.find(s => s.id === storyId);
    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    // Generate audio using ElevenLabs API
    const audioBuffer = await ttsToMp3({
      text: story.text,
      voiceId: story.voiceId,
    });

    // Convert to base64 data URL for immediate playback
    const base64 = audioBuffer.toString('base64');
    const audioUrl = `data:audio/mpeg;base64,${base64}`;

    return NextResponse.json({ 
      success: true, 
      audioUrl,
      story: {
        id: story.id,
        title: story.title,
        fileName: story.fileName
      }
    });

  } catch (error) {
    console.error("Error generating story audio:", error);
    return NextResponse.json(
      { error: "Failed to generate audio" },
      { status: 500 }
    );
  }
}
