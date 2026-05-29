ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS college text,
  ADD COLUMN IF NOT EXISTS branch text,
  ADD COLUMN IF NOT EXISTS graduation_year text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS github_url text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS experience_level text;