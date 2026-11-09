-- Add form settings to existing jobs without changing their identifiers.
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS responsibilities TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS required_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS preferred_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS vacancies INTEGER NOT NULL DEFAULT 1 CHECK (vacancies > 0),
  ADD COLUMN IF NOT EXISTS shortlist_multiplier INTEGER NOT NULL DEFAULT 5 CHECK (shortlist_multiplier > 0);
