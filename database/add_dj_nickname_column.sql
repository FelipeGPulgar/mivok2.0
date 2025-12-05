-- Add dj_nickname column to user_profiles table
-- This column will store the DJ's stage name/nickname

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS dj_nickname text;

-- Add comment to document the column
COMMENT ON COLUMN public.user_profiles.dj_nickname IS 'DJ stage name or nickname (e.g., "DJ Cool", "El Dj Juana")';

-- Optional: Create an index if you plan to search by DJ nickname
-- CREATE INDEX IF NOT EXISTS idx_user_profiles_dj_nickname ON public.user_profiles(dj_nickname);
