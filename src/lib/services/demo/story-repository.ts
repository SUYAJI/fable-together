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
  translations: Record<"en" | "es" | "fr" | "zh" | "hi", string>
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
    translations: {
      en: "Once upon a time, in a magical forest far away, there lived a brave little rabbit named Luna. Luna had always dreamed of going on grand adventures, but she was too small and too scared to leave her cozy burrow. One sunny morning, Luna heard a mysterious sound coming from deep in the forest. It was the most beautiful melody she had ever heard. Her curiosity overcame her fear, and she decided to follow the sound. As she hopped through the tall grass and under the ancient oak trees, Luna discovered a magical clearing where a wise old owl was playing a golden flute. The owl smiled at Luna and said, 'Welcome, little one. I've been waiting for someone brave enough to find me.' From that day forward, Luna learned that the greatest adventures begin with a single step into the unknown.",
      es: "Érase una vez, en un bosque mágico muy lejano, una valiente conejita llamada Luna. Siempre había soñado con grandes aventuras, pero le daba miedo dejar su acogedora madriguera. Una mañana oyó una hermosa melodía entre los árboles. La curiosidad venció al miedo y siguió el sonido hasta un claro, donde un búho sabio tocaba una flauta dorada. Desde aquel día, Luna comprendió que las mayores aventuras comienzan con un solo paso hacia lo desconocido.",
      fr: "Il était une fois, dans une forêt magique très lointaine, une courageuse petite lapine nommée Luna. Elle rêvait de grandes aventures, mais avait peur de quitter son terrier douillet. Un matin, elle entendit une merveilleuse mélodie parmi les arbres. Sa curiosité l'emporta sur sa peur et la guida jusqu'à une clairière où un vieux hibou jouait d'une flûte dorée. Luna comprit alors que les plus grandes aventures commencent par un seul pas vers l'inconnu.",
      zh: "从前，在一个遥远的魔法森林里，住着一只勇敢的小兔子，名叫露娜。她一直梦想着远行，却害怕离开温暖的洞穴。一天早晨，她听见树林深处传来美妙的旋律。好奇心战胜了恐惧，她循声来到一片空地，看见一只睿智的老猫头鹰正在吹奏金色长笛。从那天起，露娜明白了，最伟大的冒险始于迈向未知的第一步。",
      hi: "एक समय की बात है, दूर एक जादुई जंगल में लूना नाम की एक बहादुर छोटी खरगोश रहती थी। वह बड़े रोमांच का सपना देखती थी, लेकिन अपनी सुरक्षित मांद छोड़ने से डरती थी। एक सुबह उसने पेड़ों के बीच एक सुंदर धुन सुनी। जिज्ञासा ने उसके डर को हरा दिया और वह उस धुन के पीछे एक खुले मैदान तक पहुँची, जहाँ एक बुद्धिमान बूढ़ा उल्लू सुनहरी बाँसुरी बजा रहा था। उस दिन लूना ने सीखा कि सबसे बड़े रोमांच अनजान दिशा में उठाए गए पहले कदम से शुरू होते हैं।",
    },
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
    translations: {
      en: "Detective Maya had always been curious about the old lighthouse on the cliff. When strange lights started appearing there at night, she knew she had to investigate. Armed with her magnifying glass and notebook, Maya discovered a secret passage behind the lighthouse keeper's quarters. Inside, she found a hidden room filled with ancient maps and a mysterious journal. The journal spoke of a lost treasure and a secret that had been kept for generations. As Maya followed the clues, she realized that the greatest mystery wasn't about finding treasure, but about understanding the importance of preserving history and the stories of those who came before us.",
      es: "La detective Maya siempre había sentido curiosidad por el viejo faro del acantilado. Cuando unas luces extrañas comenzaron a aparecer allí por la noche, decidió investigar. Con su lupa y su cuaderno descubrió un pasadizo secreto y una sala llena de mapas antiguos y un diario misterioso. Al seguir las pistas comprendió que el verdadero misterio no era encontrar un tesoro, sino conservar la historia y las voces de quienes vivieron antes que nosotros.",
      fr: "La détective Maya avait toujours été intriguée par le vieux phare sur la falaise. Lorsque d'étranges lumières y apparurent la nuit, elle décida d'enquêter. Avec sa loupe et son carnet, elle découvrit un passage secret puis une pièce remplie de cartes anciennes et d'un journal mystérieux. En suivant les indices, elle comprit que le plus grand mystère n'était pas un trésor, mais la préservation de l'histoire et des récits de ceux qui nous ont précédés.",
      zh: "侦探玛雅一直对悬崖上的古老灯塔充满好奇。夜里出现奇怪的灯光后，她带着放大镜和笔记本前去调查。她在守塔人的房间后发现了一条秘密通道，里面有一间摆满古地图和神秘日记的房间。循着线索，玛雅明白了，最大的谜团并不是宝藏，而是如何保存历史和前人的故事。",
      hi: "जासूस माया चट्टान पर बने पुराने प्रकाशस्तंभ को लेकर हमेशा उत्सुक रहती थी। जब रात में वहाँ रहस्यमयी रोशनी दिखने लगी, तो वह जाँच करने पहुँची। आवर्धक शीशे और नोटबुक के साथ उसने एक गुप्त रास्ता और पुराने नक्शों तथा रहस्यमयी डायरी से भरा कमरा खोजा। सुरागों का पीछा करते हुए उसने समझा कि सबसे बड़ा रहस्य खजाना नहीं, बल्कि इतिहास और पुरानी पीढ़ियों की कहानियों को सुरक्षित रखना है।",
    },
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
    translations: {
      en: "Deep in the heart of the Enchanted Forest, where the trees whispered secrets and the flowers sang lullabies, lived a young fairy named Zara. Zara had the special gift of being able to understand the language of all forest creatures. When the forest began to lose its magic, Zara embarked on a quest to find the Crystal of Harmony, the source of all forest magic. Along her journey, she met talking animals, dancing flowers, and wise old trees who taught her that the real magic wasn't in crystals or spells, but in the love and care we show to nature and each other.",
      es: "En el corazón del Bosque Encantado, donde los árboles susurraban secretos y las flores cantaban canciones de cuna, vivía una joven hada llamada Zara. Cuando el bosque empezó a perder su magia, Zara partió en busca del Cristal de la Armonía. En el camino aprendió que la verdadera magia no estaba en los cristales ni en los hechizos, sino en el amor y el cuidado que ofrecemos a la naturaleza y a los demás.",
      fr: "Au cœur de la Forêt Enchantée, où les arbres murmuraient des secrets et les fleurs chantaient des berceuses, vivait une jeune fée nommée Zara. Lorsque la forêt commença à perdre sa magie, Zara partit à la recherche du Cristal d'Harmonie. En chemin, elle apprit que la véritable magie ne résidait ni dans les cristaux ni dans les sortilèges, mais dans l'amour et l'attention que nous portons à la nature et aux autres.",
      zh: "在魔法森林深处，树木低声诉说秘密，花朵轻唱摇篮曲，住着一位名叫扎拉的小仙子。森林开始失去魔力时，扎拉踏上寻找和谐水晶的旅程。一路上，她遇见会说话的动物、跳舞的花朵和睿智的古树，并明白真正的魔法不在水晶或咒语中，而在我们对自然和彼此的爱与关怀中。",
      hi: "मंत्रमुग्ध वन के बीचोंबीच, जहाँ पेड़ रहस्य फुसफुसाते और फूल लोरियाँ गाते थे, ज़ारा नाम की एक नन्ही परी रहती थी। जब जंगल का जादू कम होने लगा, ज़ारा सामंजस्य के क्रिस्टल की खोज में निकली। रास्ते में बोलते जानवरों, नाचते फूलों और बुद्धिमान पुराने पेड़ों ने उसे सिखाया कि असली जादू क्रिस्टल या मंत्रों में नहीं, बल्कि प्रकृति और एक-दूसरे के प्रति हमारे प्रेम और देखभाल में है।",
    },
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

export type DemoStoryLanguage = keyof DemoStory["translations"]

export function getDemoStoryTranslation(storyId: number, language: string) {
  const story = DEMO_STORIES.find((item) => item.id === storyId)
  if (!story) return null
  return story.translations[language as DemoStoryLanguage] ?? story.translations.en
}
