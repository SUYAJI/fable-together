-- ============================================
-- Fable Together Complete Database Migration
-- ============================================
-- This script sets up the complete database schema, RLS policies,
-- and seed data for the Fable Together application.
-- 
-- Run this in your Supabase SQL Editor to set up everything at once.
-- ============================================

-- PART 1: PROFILES TABLE ENHANCEMENTS
-- ============================================

-- Ensure profiles table exists (created by Supabase Auth by default)
-- Add missing columns to profiles table
DO $$ 
BEGIN
  -- Add display_name if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN display_name TEXT;
  END IF;

  -- Add avatar_url if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
  END IF;

  -- Add bio if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE profiles ADD COLUMN bio TEXT;
  END IF;

  -- Add location if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'location'
  ) THEN
    ALTER TABLE profiles ADD COLUMN location TEXT;
  END IF;

  -- Add website if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'website'
  ) THEN
    ALTER TABLE profiles ADD COLUMN website TEXT;
  END IF;

  -- Add first_name if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN first_name TEXT;
  END IF;

  -- Add last_name if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_name TEXT;
  END IF;

  -- Add phone if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone TEXT;
  END IF;

  -- Add available_credits if it doesn't exist (renamed from token_balance)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'available_credits'
  ) THEN
    ALTER TABLE profiles ADD COLUMN available_credits INTEGER DEFAULT 150;
  END IF;

  -- Add created_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Add updated_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- PART 2: STORIES TABLE
-- ============================================

-- Create stories table if it doesn't exist
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT,
  summary TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_example BOOLEAN DEFAULT false,
  language TEXT DEFAULT 'en',
  narrator_voice_id UUID,
  background_music BOOLEAN DEFAULT false,
  sound_effects BOOLEAN DEFAULT false,
  token_cost INTEGER DEFAULT 0,
  category TEXT DEFAULT 'Adventure',
  duration TEXT DEFAULT '10 min',
  rating DECIMAL(2,1) DEFAULT 4.5,
  thumbnail TEXT,
  audio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stories' AND column_name = 'summary'
  ) THEN
    ALTER TABLE stories ADD COLUMN summary TEXT;
  END IF;
END $$;

-- Create trigger for stories updated_at
DROP TRIGGER IF EXISTS update_stories_updated_at ON stories;
CREATE TRIGGER update_stories_updated_at
  BEFORE UPDATE ON stories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- PART 3: VOICES TABLE
-- ============================================

-- Create voices table if it doesn't exist
CREATE TABLE IF NOT EXISTS voices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_cloned BOOLEAN DEFAULT false,
  voice_id TEXT, -- External voice ID (e.g., ElevenLabs)
  sample_count INTEGER DEFAULT 0,
  category TEXT DEFAULT 'narrator',
  accent TEXT,
  age TEXT,
  gender TEXT,
  tags TEXT[],
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trigger for voices updated_at
DROP TRIGGER IF EXISTS update_voices_updated_at ON voices;
CREATE TRIGGER update_voices_updated_at
  BEFORE UPDATE ON voices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- PART 4: STORY AUDIO VARIATIONS TABLE
-- ============================================

-- Create story_audio_variations table if it doesn't exist
CREATE TABLE IF NOT EXISTS story_audio_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  voice_id UUID REFERENCES voices(id) ON DELETE SET NULL,
  audio_url TEXT NOT NULL,
  language_code TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, user_id, voice_id, language_code)
);

-- PART 5: QUESTS TABLES
-- ============================================

-- Create quests_master table for quest definitions
-- Note: This matches migration 001_create_quests_tables.sql schema
CREATE TABLE IF NOT EXISTS quests_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  credits_reward INTEGER NOT NULL DEFAULT 0,
  progress_max INTEGER NOT NULL DEFAULT 1,
  icon TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'onboarding',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add slug column if it doesn't exist (for existing tables)
ALTER TABLE quests_master ADD COLUMN IF NOT EXISTS slug TEXT;

-- Add updated_at column if it doesn't exist (for existing tables)
ALTER TABLE quests_master ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Handle existing NULL slugs for existing tables (fill with UUIDs)
UPDATE quests_master SET slug = gen_random_uuid()::text WHERE slug IS NULL;

-- Set slug to NOT NULL (safe after filling NULLs above)
DO $$
BEGIN
  -- Only alter if column is currently nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quests_master' 
    AND column_name = 'slug' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE quests_master ALTER COLUMN slug SET NOT NULL;
  END IF;
END $$;

-- Create unique constraint on slug (required for ON CONFLICT to work)
DROP INDEX IF EXISTS quests_master_slug_unique;
DO $$
BEGIN
  -- Only add constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'uq_quests_master_slug'
  ) THEN
    ALTER TABLE quests_master ADD CONSTRAINT uq_quests_master_slug UNIQUE (slug);
  END IF;
END $$;

-- Create user_quests table for tracking user progress
-- Note: This matches migration 001_create_quests_tables.sql schema
CREATE TABLE IF NOT EXISTS user_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES quests_master(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress INTEGER NOT NULL DEFAULT 0,
  progress_max INTEGER NOT NULL DEFAULT 1,
  completed_at TIMESTAMPTZ,
  credits_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, quest_id)
);

-- Create indexes for performance (matching migration 001)
CREATE INDEX IF NOT EXISTS idx_user_quests_user_id ON user_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_quest_id ON user_quests(quest_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_status ON user_quests(status);
CREATE INDEX IF NOT EXISTS idx_quests_master_category ON quests_master(category);
CREATE INDEX IF NOT EXISTS idx_quests_master_is_active ON quests_master(is_active);
CREATE INDEX IF NOT EXISTS idx_quests_master_display_order ON quests_master(display_order);
CREATE INDEX IF NOT EXISTS idx_quests_master_slug ON quests_master(slug);

-- Create trigger for quests updated_at
DROP TRIGGER IF EXISTS update_quests_master_updated_at ON quests_master;
CREATE TRIGGER update_quests_master_updated_at
  BEFORE UPDATE ON quests_master
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_quests_updated_at ON user_quests;
CREATE TRIGGER update_user_quests_updated_at
  BEFORE UPDATE ON user_quests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- PART 6: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE voices ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_audio_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quests ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Stories policies
DROP POLICY IF EXISTS "Anyone can read example stories" ON stories;
CREATE POLICY "Anyone can read example stories"
  ON stories FOR SELECT
  USING (is_example = true);

DROP POLICY IF EXISTS "Users can read their own stories" ON stories;
CREATE POLICY "Users can read their own stories"
  ON stories FOR SELECT
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can create their own stories" ON stories;
CREATE POLICY "Users can create their own stories"
  ON stories FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own stories" ON stories;
CREATE POLICY "Users can update their own stories"
  ON stories FOR UPDATE
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete their own stories" ON stories;
CREATE POLICY "Users can delete their own stories"
  ON stories FOR DELETE
  USING (auth.uid() = owner_id);

-- Voices policies
DROP POLICY IF EXISTS "Anyone can read preset voices" ON voices;
CREATE POLICY "Anyone can read preset voices"
  ON voices FOR SELECT
  USING (owner_id IS NULL);

DROP POLICY IF EXISTS "Users can read their own voices" ON voices;
CREATE POLICY "Users can read their own voices"
  ON voices FOR SELECT
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can create their own voices" ON voices;
CREATE POLICY "Users can create their own voices"
  ON voices FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own voices" ON voices;
CREATE POLICY "Users can update their own voices"
  ON voices FOR UPDATE
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete their own voices" ON voices;
CREATE POLICY "Users can delete their own voices"
  ON voices FOR DELETE
  USING (auth.uid() = owner_id);

-- Story audio variations policies
DROP POLICY IF EXISTS "Users can read their own audio variations" ON story_audio_variations;
CREATE POLICY "Users can read their own audio variations"
  ON story_audio_variations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own audio variations" ON story_audio_variations;
CREATE POLICY "Users can create their own audio variations"
  ON story_audio_variations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own audio variations" ON story_audio_variations;
CREATE POLICY "Users can delete their own audio variations"
  ON story_audio_variations FOR DELETE
  USING (auth.uid() = user_id);

-- Quests master policies (public read, no write for users)
DROP POLICY IF EXISTS "Anyone can read active quests" ON quests_master;
CREATE POLICY "Anyone can read active quests"
  ON quests_master FOR SELECT
  USING (is_active = true);

-- User quests policies
DROP POLICY IF EXISTS "Users can read their own quests" ON user_quests;
CREATE POLICY "Users can read their own quests"
  ON user_quests FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own quests" ON user_quests;
CREATE POLICY "Users can create their own quests"
  ON user_quests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own quests" ON user_quests;
CREATE POLICY "Users can update their own quests"
  ON user_quests FOR UPDATE
  USING (auth.uid() = user_id);

-- PART 7: INDEXES FOR PERFORMANCE
-- ============================================

-- Stories indexes
CREATE INDEX IF NOT EXISTS idx_stories_owner_id ON stories(owner_id);
CREATE INDEX IF NOT EXISTS idx_stories_is_example ON stories(is_example);
CREATE INDEX IF NOT EXISTS idx_stories_category ON stories(category);

-- Voices indexes
CREATE INDEX IF NOT EXISTS idx_voices_owner_id ON voices(owner_id);
CREATE INDEX IF NOT EXISTS idx_voices_category ON voices(category);

-- Story audio variations indexes
CREATE INDEX IF NOT EXISTS idx_story_audio_variations_story_id ON story_audio_variations(story_id);
CREATE INDEX IF NOT EXISTS idx_story_audio_variations_user_id ON story_audio_variations(user_id);

-- User quests indexes
CREATE INDEX IF NOT EXISTS idx_user_quests_user_id ON user_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_quest_id ON user_quests(quest_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_status ON user_quests(status);

-- PART 8: SEED DATA
-- ============================================

-- Seed the explore_platform quest
-- Note: Uses slug for conflict resolution to match migration 001
INSERT INTO quests_master (slug, title, description, credits_reward, progress_max, icon, display_order, category, is_active)
VALUES (
  'explore_platform',
  'Explore the Platform',
  'Discover Fable Together. Complete 3 simple tasks to earn tokens and learn about the platform.',
  30,
  3,
  'user',
  1,
  'onboarding',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  credits_reward = EXCLUDED.credits_reward,
  progress_max = EXCLUDED.progress_max,
  icon = EXCLUDED.icon,
  display_order = EXCLUDED.display_order,
  category = EXCLUDED.category,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- PART 9: STORAGE BUCKETS (for avatars and audio)
-- ============================================

-- Note: Storage buckets need to be created via Supabase Dashboard or API
-- Run these commands in Supabase Dashboard > Storage or via API:

-- 1. Create 'avatars' bucket (public read, authenticated write)
-- 2. Create 'story-audio' bucket (authenticated read/write)

-- Storage policies are typically set via the Supabase Dashboard

-- ============================================
-- Migration Complete!
-- ============================================
-- Next steps:
-- 1. Configure email templates in Supabase Dashboard > Authentication > Email Templates
-- 2. Set up storage buckets for avatars and audio files
-- 3. Test the application with the new schema
-- ============================================


