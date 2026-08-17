-- Migration: Create story_translations table
-- Purpose: Store multilingual story translations in a scalable, normalized structure

-- Create story_translations table
CREATE TABLE IF NOT EXISTS story_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL,
  language_code TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  translator_id UUID REFERENCES profiles(id), -- Optional: who translated
  translation_date TIMESTAMPTZ DEFAULT NOW(),
  quality_score INTEGER, -- Optional: translation quality rating (1-5)
  is_auto_translated BOOLEAN DEFAULT true, -- Track if translation was automated
  translation_provider TEXT, -- e.g., 'google', 'deepl', 'manual'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one translation per language per story
  CONSTRAINT uq_story_translation UNIQUE (story_id, language_code)
);

-- Add foreign key constraint to stories table
-- Note: This assumes stories table has an id column (UUID)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'story_translations_story_id_fkey'
  ) THEN
    ALTER TABLE story_translations
    ADD CONSTRAINT story_translations_story_id_fkey
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_story_translations_story_id ON story_translations(story_id);
CREATE INDEX IF NOT EXISTS idx_story_translations_language ON story_translations(language_code);
CREATE INDEX IF NOT EXISTS idx_story_translations_story_lang ON story_translations(story_id, language_code);

-- Enable RLS (Row Level Security)
ALTER TABLE story_translations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can read translations for example stories or their own stories
DROP POLICY IF EXISTS "Anyone can read translations for example stories" ON story_translations;
CREATE POLICY "Anyone can read translations for example stories"
ON story_translations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM stories 
    WHERE stories.id = story_translations.story_id 
    AND (stories.is_example = true OR stories.owner_id = auth.uid())
  )
);

-- Users can insert translations for their own stories
DROP POLICY IF EXISTS "Users can insert translations for own stories" ON story_translations;
CREATE POLICY "Users can insert translations for own stories"
ON story_translations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM stories 
    WHERE stories.id = story_translations.story_id 
    AND (stories.is_example = true OR stories.owner_id = auth.uid())
  )
);

-- Users can update translations for their own stories
DROP POLICY IF EXISTS "Users can update translations for own stories" ON story_translations;
CREATE POLICY "Users can update translations for own stories"
ON story_translations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM stories 
    WHERE stories.id = story_translations.story_id 
    AND (stories.is_example = true OR stories.owner_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM stories 
    WHERE stories.id = story_translations.story_id 
    AND (stories.is_example = true OR stories.owner_id = auth.uid())
  )
);

-- Users can delete translations for their own stories
DROP POLICY IF EXISTS "Users can delete translations for own stories" ON story_translations;
CREATE POLICY "Users can delete translations for own stories"
ON story_translations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM stories 
    WHERE stories.id = story_translations.story_id 
    AND (stories.is_example = true OR stories.owner_id = auth.uid())
  )
);

-- Add comment
COMMENT ON TABLE story_translations IS 'Stores multilingual translations of stories for scalable internationalization';

