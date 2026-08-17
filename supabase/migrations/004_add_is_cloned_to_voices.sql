-- Migration: Add is_cloned column to voices table
-- This column helps distinguish between cloned voices and preset voices

-- Add is_cloned column if it doesn't exist
ALTER TABLE voices 
ADD COLUMN IF NOT EXISTS is_cloned BOOLEAN DEFAULT false;

-- Update existing voices to set is_cloned based on whether they have an owner_id
-- Voices with owner_id are likely cloned voices
UPDATE voices 
SET is_cloned = true 
WHERE owner_id IS NOT NULL AND is_cloned IS NULL;

-- Add a comment to document the column
COMMENT ON COLUMN voices.is_cloned IS 'Indicates whether this voice is a cloned voice (true) or a preset voice (false)';
