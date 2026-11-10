-- A candidate can apply to several jobs. Each application owns its hiring stage.
CREATE TABLE IF NOT EXISTS public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL CHECK (length(btrim(full_name)) BETWEEN 1 AND 200),
  email TEXT NOT NULL UNIQUE
    CHECK (email = lower(btrim(email)) AND length(email) BETWEEN 3 AND 254),
  phone TEXT NOT NULL CHECK (length(btrim(phone)) BETWEEN 1 AND 50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE RESTRICT,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE RESTRICT,
  -- Preserve the submitted details independently of later candidate profile edits.
  full_name TEXT NOT NULL CHECK (length(btrim(full_name)) BETWEEN 1 AND 200),
  email TEXT NOT NULL CHECK (email = lower(btrim(email)) AND length(email) BETWEEN 3 AND 254),
  phone TEXT NOT NULL CHECK (length(btrim(phone)) BETWEEN 1 AND 50),
  cover_letter TEXT NOT NULL DEFAULT '' CHECK (length(cover_letter) <= 10000),
  stage TEXT NOT NULL DEFAULT 'Review'
    CHECK (stage IN (
      'Review', 'Screening', 'Shortlisted', 'Interview', 'Offer',
      'Hired', 'Rejected', 'Withdrawn'
    )),
  -- Store a private object key and metadata here once the CV upload is implemented.
  resume_storage_key TEXT,
  resume_original_name TEXT,
  resume_media_type TEXT CHECK (
    resume_media_type IN (
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
  ),
  resume_size_bytes INTEGER CHECK (resume_size_bytes BETWEEN 1 AND 10485760),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT applications_candidate_job_unique UNIQUE (candidate_id, job_id),
  CONSTRAINT applications_resume_metadata_complete CHECK (
    (resume_storage_key IS NULL AND resume_original_name IS NULL
      AND resume_media_type IS NULL AND resume_size_bytes IS NULL)
    OR
    (resume_storage_key IS NOT NULL AND resume_original_name IS NOT NULL
      AND resume_media_type IS NOT NULL AND resume_size_bytes IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS applications_job_created_idx
  ON public.applications (job_id, created_at DESC);

ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
