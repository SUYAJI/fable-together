interface DemoStoryCreator {
  id: string
  name: string
  role: "Author" | "Illustrator" | "Musician"
  avatar?: string
  bio?: string
}

export interface DemoStory {
  id: number
  title: string
  category: string
  duration: string
  rating: number
  thumbnail: string
  isPurchased: boolean
  isExample: boolean
  tokens: number
  audioUrl: string
  summary: string
  body: string
  creators: DemoStoryCreator[]
}

export const DEMO_STORIES: DemoStory[] = [
  {
    id: 1,
    title: "The Adventure Begins",
    category: "Adventure",
    duration: "10 min",
    rating: 4.6,
    thumbnail: "https://images.unsplash.com/photo-1464207687429-7505649dae38?w=600&h=400&fit=crop&q=80",
    isPurchased: true,
    isExample: true,
    tokens: 137,
    audioUrl: "/audio/adventure-begins.mp3",
    summary: "A brave little rabbit named Luna overcomes her fears to embark on a magical adventure in the forest, discovering that the greatest journeys begin with a single step.",
    body: "Once upon a time, in a magical forest far away, there lived a brave little rabbit named Luna. Luna had always dreamed of going on grand adventures, but she was too small and too scared to leave her cozy burrow. One sunny morning, Luna heard a mysterious sound coming from deep in the forest. It was the most beautiful melody she had ever heard. Her curiosity overcame her fear, and she decided to follow the sound. As she hopped through the tall grass and under the ancient oak trees, Luna discovered a magical clearing where a wise old owl was playing a golden flute. The owl smiled at Luna and said, 'Welcome, little one. I've been waiting for someone brave enough to find me.' From that day forward, Luna learned that the greatest adventures begin with a single step into the unknown.",
    creators: [
      {
        id: "sarah-j",
        name: "Sarah Johnson",
        role: "Author",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&q=80",
        bio: "Award-winning children's author with 15+ published stories",
      },
      {
        id: "mike-r",
        name: "Mike Rivera",
        role: "Illustrator",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&q=80",
        bio: "Digital artist specializing in fantasy illustrations",
      },
      {
        id: "emma-l",
        name: "Emma Lopez",
        role: "Musician",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&q=80",
        bio: "Composer of enchanting soundtracks for children's media",
      },
    ],
  },
  {
    id: 2,
    title: "The Mystery Unfolds",
    category: "Mystery",
    duration: "12 min",
    rating: 4.8,
    thumbnail: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=600&h=400&fit=crop&q=80",
    isPurchased: true,
    isExample: true,
    tokens: 156,
    audioUrl: "/audio/mystery-unfolds.mp3",
    summary: "Detective Maya investigates strange lights at an old lighthouse, uncovering hidden secrets and learning that the greatest mysteries are about preserving history.",
    body: "Detective Maya had always been curious about the old lighthouse on the cliff. When strange lights started appearing there at night, she knew she had to investigate. Armed with her magnifying glass and notebook, Maya discovered a secret passage behind the lighthouse keeper's quarters. Inside, she found a hidden room filled with ancient maps and a mysterious journal. The journal spoke of a lost treasure and a secret that had been kept for generations. As Maya followed the clues, she realized that the greatest mystery wasn't about finding treasure, but about understanding the importance of preserving history and the stories of those who came before us.",
    creators: [
      {
        id: "alex-c",
        name: "Alex Chen",
        role: "Author",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&q=80",
        bio: "Mystery writer with a passion for puzzles and adventure",
      },
    ],
  },
  {
    id: 3,
    title: "The Enchanted Forest",
    category: "Fantasy",
    duration: "15 min",
    rating: 4.9,
    thumbnail: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&h=400&fit=crop&q=80",
    isPurchased: true,
    isExample: true,
    tokens: 189,
    audioUrl: "/audio/enchanted-forest.mp3",
    summary: "A young fairy named Zara embarks on a quest to save the Enchanted Forest, discovering that true magic comes from love and care for nature.",
    body: "Deep in the heart of the Enchanted Forest, where the trees whispered secrets and the flowers sang lullabies, lived a young fairy named Zara. Zara had the special gift of being able to understand the language of all forest creatures. When the forest began to lose its magic, Zara embarked on a quest to find the Crystal of Harmony, the source of all forest magic. Along her journey, she met talking animals, dancing flowers, and wise old trees who taught her that the real magic wasn't in crystals or spells, but in the love and care we show to nature and each other.",
    creators: [
      {
        id: "luna-m",
        name: "Luna Martinez",
        role: "Author",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&q=80",
        bio: "Fantasy author who believes in the magic of nature",
      },
    ],
  },
]

export const demoStoryRepository = {
  async list() {
    return DEMO_STORIES
  },
  async getById(id: number) {
    return DEMO_STORIES.find((story) => story.id === id) ?? null
  },
}
