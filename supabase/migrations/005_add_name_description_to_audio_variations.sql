-- Migration: Add name and description fields to story_audio_variations table
-- This allows users to customize their saved audio variations

-- Add name column if it doesn't exist
ALTER TABLE story_audio_variations 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Add description column if it doesn't exist
ALTER TABLE story_audio_variations 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Set default name for existing records based on voice and language
-- Uses voice label if available, otherwise falls back to voice_id
UPDATE story_audio_variations
SET name = CONCAT(
  COALESCE(
    (SELECT label FROM voices WHERE voice_id = story_audio_variations.voice_id LIMIT 1),
    story_audio_variations.voice_id
  ),
  ' - ',
  UPPER(language_code)
)
WHERE name IS NULL;

-- Add comments to document the columns
COMMENT ON COLUMN story_audio_variations.name IS 'User-defined name for this audio variation';
COMMENT ON COLUMN story_audio_variations.description IS 'User-defined description for this audio variation';
