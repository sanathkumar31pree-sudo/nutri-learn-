-- Add group column to profiles table
-- Run this in your Supabase SQL Editor

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS "group" TEXT DEFAULT 'volunteer';

-- Optional: Add a check constraint to only allow valid values
ALTER TABLE profiles
ADD CONSTRAINT profiles_group_check
CHECK ("group" IN ('compulsory', 'volunteer'));
