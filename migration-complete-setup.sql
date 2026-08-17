-- ============================================
-- Fable Together Complete Database Migration
-- ============================================
-- This script sets up the complete database schema, RLS policies,
-- and seed data for the Fable Together application.
-- 
-- Run this in your Supabase SQL Editor to set up everything at once.
-- ============================================

-- PART 1: SCHEMA UPDATES (Add Missing Columns)
-- ============================================

-- Update stories table with all required columns
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS body TEXT,
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_example BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS narrator_voice_id UUID,
ADD COLUMN IF NOT EXISTS background_music BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sound_effects BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS token_cost INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Adventure',
ADD COLUMN IF NOT EXISTS duration TEXT DEFAULT '10 min',
ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1) DEFAULT 4.5,
ADD COLUMN IF NOT EXISTS thumbnail TEXT,
ADD COLUMN IF NOT EXISTS audio_url TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update profiles table with token balance
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS token_balance INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create voices table if it doesn't exist
CREATE TABLE IF NOT EXISTS voices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id),
    provider TEXT NOT NULL DEFAULT 'elevenlabs',
    voice_id TEXT NOT NULL,
    label TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create story_audio table for audio artifacts
CREATE TABLE IF NOT EXISTS story_audio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    voice_id UUID REFERENCES voices(id) ON DELETE CASCADE,
    audio_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PART 2: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE voices ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_audio ENABLE ROW LEVEL SECURITY;

-- Stories policies
DROP POLICY IF EXISTS "Users can read example stories or own stories" ON stories;
CREATE POLICY "Users can read example stories or own stories"
ON stories FOR SELECT
USING (
  is_example = true 
  OR owner_id = auth.uid()
);

DROP POLICY IF EXISTS "Users can insert own stories" ON stories;
CREATE POLICY "Users can insert own stories"
ON stories FOR INSERT
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own stories" ON stories;
CREATE POLICY "Users can update own stories"
ON stories FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own stories" ON stories;
CREATE POLICY "Users can delete own stories"
ON stories FOR DELETE
USING (owner_id = auth.uid());

-- Profiles policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (id = auth.uid());

-- Voices policies
DROP POLICY IF EXISTS "Users can read preset voices or own voices" ON voices;
CREATE POLICY "Users can read preset voices or own voices"
ON voices FOR SELECT
USING (
  owner_id IS NULL  -- Preset voices
  OR owner_id = auth.uid()  -- Own voices
);

DROP POLICY IF EXISTS "Users can insert own voices" ON voices;
CREATE POLICY "Users can insert own voices"
ON voices FOR INSERT
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own voices" ON voices;
CREATE POLICY "Users can update own voices"
ON voices FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own voices" ON voices;
CREATE POLICY "Users can delete own voices"
ON voices FOR DELETE
USING (owner_id = auth.uid());

-- Story_audio policies
DROP POLICY IF EXISTS "Users can access audio for own stories" ON story_audio;
CREATE POLICY "Users can access audio for own stories"
ON story_audio FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM stories 
    WHERE stories.id = story_audio.story_id 
    AND stories.owner_id = auth.uid()
  )
);

-- PART 3: CREATE STORAGE BUCKET
-- ============================================

-- Create audio storage bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio', 'audio', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for audio bucket
DROP POLICY IF EXISTS "Public read access for audio files" ON storage.objects;
CREATE POLICY "Public read access for audio files"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio');

DROP POLICY IF EXISTS "Users can upload audio files" ON storage.objects;
CREATE POLICY "Users can upload audio files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'audio' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update own audio files" ON storage.objects;
CREATE POLICY "Users can update own audio files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'audio' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete own audio files" ON storage.objects;
CREATE POLICY "Users can delete own audio files"
ON storage.objects FOR DELETE
USING (bucket_id = 'audio' AND auth.uid()::text = (storage.foldername(name))[1]);

-- PART 4: SEED EXAMPLE STORIES
-- ============================================

-- Clear existing example stories (if any)
DELETE FROM stories WHERE is_example = true;

-- Insert 3 example stories with full content
INSERT INTO stories (
  id,
  title,
  body,
  category,
  duration,
  rating,
  thumbnail,
  is_example,
  owner_id,
  language,
  token_cost,
  created_at
) VALUES 
(
  gen_random_uuid(),
  'The Adventure Begins',
  'Once upon a time, in a magical forest far away, there lived a brave little rabbit named Luna. Luna had always dreamed of going on grand adventures, but she was too small and too scared to leave her cozy burrow. One sunny morning, Luna heard a mysterious sound coming from deep in the forest. It was the most beautiful melody she had ever heard. Her curiosity overcame her fear, and she decided to follow the sound. As she hopped through the tall grass and under the ancient oak trees, Luna discovered a magical clearing where a wise old owl was playing a golden flute. The owl smiled at Luna and said, "Welcome, little one. I''ve been waiting for someone brave enough to find me." From that day forward, Luna learned that the greatest adventures begin with a single step into the unknown.',
  'Adventure',
  '10 min',
  4.6,
  '/adventure-story-illustration.jpg',
  true,
  NULL,
  'en',
  137,
  NOW()
),
(
  gen_random_uuid(),
  'Moonlight Dreams',
  'Every night, when the moon rises high in the sky, young Maya closes her eyes and begins her magical journey. Tonight, she finds herself walking on a path made of starlight, leading to a castle floating among the clouds. The castle is made entirely of moonbeams and is home to the Dream Keeper, a gentle giant who collects the most beautiful dreams from children all around the world. "Welcome, dear child," the Dream Keeper says with a voice like wind chimes. "Tonight, I will show you how to paint your dreams with colors that only exist in the realm of imagination." Together, they create a dream so wonderful that when Maya wakes up, she carries its magic with her all day long.',
  'Bedtime',
  '8 min',
  4.8,
  '/moonlight-dreams-illustration.jpg',
  true,
  NULL,
  'en',
  112,
  NOW()
),
(
  gen_random_uuid(),
  'The Curious Robot',
  'In a bustling city of the future, there lived a small robot named Spark who was different from all the others. While other robots followed their programming perfectly, Spark was curious about everything. "Why do birds fly?" he would ask. "What makes flowers smell so sweet?" One day, Spark met an old gardener who taught him that the most important thing in life is not knowing all the answers, but asking the right questions. Together, they discovered that friendship, kindness, and wonder are the most powerful forces in the universe. From that day on, Spark became the city''s first robot who could feel emotions, and he used his new gift to help others and spread joy wherever he went.',
  'Educational',
  '12 min',
  4.7,
  '/curious-robot-illustration.jpg',
  true,
  NULL,
  'en',
  156,
  NOW()
);

-- PART 5: CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_stories_owner_id ON stories(owner_id);
CREATE INDEX IF NOT EXISTS idx_stories_is_example ON stories(is_example);
CREATE INDEX IF NOT EXISTS idx_voices_owner_id ON voices(owner_id);
CREATE INDEX IF NOT EXISTS idx_story_audio_story_id ON story_audio(story_id);
CREATE INDEX IF NOT EXISTS idx_profiles_token_balance ON profiles(token_balance);

-- PART 6: VERIFICATION QUERIES
-- ============================================

-- Verify the setup worked
SELECT 
  'Schema Setup Complete' as status,
  (SELECT COUNT(*) FROM stories WHERE is_example = true) as example_stories_count,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('stories', 'profiles', 'voices', 'story_audio')) as tables_created,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('stories', 'profiles', 'voices', 'story_audio')) as rls_policies_created;

-- ============================================
-- MIGRATION COMPLETE!
-- ============================================
-- Your Fable Together database is now fully set up with:
-- ✅ All required tables and columns
-- ✅ Row Level Security policies
-- ✅ Storage bucket for audio files
-- ✅ 3 example stories with full content
-- ✅ Performance indexes
-- 
-- You can now run your application and test all features!
-- ============================================
