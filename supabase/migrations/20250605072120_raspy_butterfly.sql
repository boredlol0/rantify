/*
  # Add transcript status field to rants table

  1. Changes
    - Add transcript_status column to rants table with type text
    - Set default value to 'pending'
    - Add check constraint to ensure valid status values
    - Make transcript column nullable
*/

ALTER TABLE rants 
  ADD COLUMN IF NOT EXISTS transcript_status text NOT NULL DEFAULT 'pending',
  ALTER COLUMN transcript DROP NOT NULL;

-- Add check constraint for valid status values
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rants_transcript_status_check'
  ) THEN
    ALTER TABLE rants
      ADD CONSTRAINT rants_transcript_status_check 
      CHECK (transcript_status IN ('pending', 'complete', 'error'));
  END IF;
END $$;