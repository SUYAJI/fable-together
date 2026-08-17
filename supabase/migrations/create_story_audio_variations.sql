-- Create story_audio_variations table
-- This table stores user-saved audio variations for stories with different voice/language/speed combinations
-- Note: story_id is INTEGER to match example stories (1, 2, 3)
-- Note: user_id can be NULL for testing purposes

CREATE TABLE IF NOT EXISTS story_audio_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id INTEGER NOT NULL,
  voice_id TEXT NOT NULL,
  language_code TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  speed NUMERIC(3,2) DEFAULT 1.0 CHECK (speed >= 0.25 AND speed <= 4.0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one variation per user/story/voice/language/speed combination
  -- Note: NULL user_id is allowed for testing, so we use a partial unique index
  CONSTRAINT uq_story_audio_variation UNIQUE(user_id, story_id, voice_id, language_code, speed)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_story_audio_variations_user_story 
  ON story_audio_variations(user_id, story_id);

CREATE INDEX IF NOT EXISTS idx_story_audio_variations_story 
  ON story_audio_variations(story_id);

CREATE INDEX IF NOT EXISTS idx_story_audio_variations_user 
  ON story_audio_variations(user_id) WHERE user_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE story_audio_variations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own audio variations
DROP POLICY IF EXISTS "Users can view their own audio variations" ON story_audio_variations;
CREATE POLICY "Users can view their own audio variations"
  ON story_audio_variations
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR (user_id IS NULL AND auth.uid() IS NULL) -- Allow anonymous access for testing
  );

-- RLS Policy: Users can insert their own audio variations
DROP POLICY IF EXISTS "Users can insert their own audio variations" ON story_audio_variations;
CREATE POLICY "Users can insert their own audio variations"
  ON story_audio_variations
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    OR (user_id IS NULL AND auth.uid() IS NULL) -- Allow anonymous access for testing
  );

-- RLS Policy: Users can update their own audio variations
DROP POLICY IF EXISTS "Users can update their own audio variations" ON story_audio_variations;
CREATE POLICY "Users can update their own audio variations"
  ON story_audio_variations
  FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR (user_id IS NULL AND auth.uid() IS NULL) -- Allow anonymous access for testing
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR (user_id IS NULL AND auth.uid() IS NULL) -- Allow anonymous access for testing
  );

-- RLS Policy: Users can delete their own audio variations
DROP POLICY IF EXISTS "Users can delete their own audio variations" ON story_audio_variations;
CREATE POLICY "Users can delete their own audio variations"
  ON story_audio_variations
  FOR DELETE
  USING (
    auth.uid() = user_id 
    OR (user_id IS NULL AND auth.uid() IS NULL) -- Allow anonymous access for testing
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_story_audio_variations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_story_audio_variations_timestamp ON story_audio_variations;
CREATE TRIGGER update_story_audio_variations_timestamp
  BEFORE UPDATE ON story_audio_variations
  FOR EACH ROW
  EXECUTE FUNCTION update_story_audio_variations_updated_at();

-- Add comment to table
COMMENT ON TABLE story_audio_variations IS 'Stores user-saved audio variations for stories with different voice, language, and speed combinations';
