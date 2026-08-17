-- Create quests_master table for quest definitions
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
-- Drop the old partial index if it exists, then add the constraint
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_quests_user_id ON user_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_quest_id ON user_quests(quest_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_status ON user_quests(status);
CREATE INDEX IF NOT EXISTS idx_quests_master_category ON quests_master(category);
CREATE INDEX IF NOT EXISTS idx_quests_master_is_active ON quests_master(is_active);
CREATE INDEX IF NOT EXISTS idx_quests_master_display_order ON quests_master(display_order);
CREATE INDEX IF NOT EXISTS idx_quests_master_slug ON quests_master(slug);

-- Enable RLS
ALTER TABLE quests_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quests_master (everyone can read active quests)
CREATE POLICY "Anyone can view active quests" ON quests_master
  FOR SELECT
  USING (is_active = true);

-- RLS Policies for user_quests (users can only see their own quests)
CREATE POLICY "Users can view their own quests" ON user_quests
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quests" ON user_quests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quests" ON user_quests
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add credits columns to profiles if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'available_credits') THEN
    ALTER TABLE profiles ADD COLUMN available_credits INTEGER NOT NULL DEFAULT 150;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_credits') THEN
    ALTER TABLE profiles ADD COLUMN total_credits INTEGER NOT NULL DEFAULT 150;
  END IF;
END $$;

-- Insert the explore_platform quest (single quest for now)
-- This quest has 3 tasks: Browse Stories, Explore Voices, Create Story
INSERT INTO quests_master (slug, title, description, credits_reward, progress_max, icon, display_order, category, is_active)
VALUES
  ('explore_platform', 'Explore the Platform', 'Discover Fable Together. Complete 3 simple tasks to earn tokens and learn about the platform.', 30, 3, 'user', 1, 'onboarding', true)
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

