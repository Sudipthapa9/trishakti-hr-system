-- A request UUID identifies a submission so network retries return the same receipt.
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS submission_hash TEXT
    CHECK (submission_hash ~ '^[a-f0-9]{64}$');

-- CV bytes are stored separately so application lists never load document contents.
CREATE TABLE IF NOT EXISTS public.application_resumes (
  application_id UUID PRIMARY KEY REFERENCES public.applications(id) ON DELETE CASCADE,
  content BYTEA NOT NULL CHECK (octet_length(content) BETWEEN 1 AND 10485760)
);

ALTER TABLE public.application_resumes ENABLE ROW LEVEL SECURITY;
