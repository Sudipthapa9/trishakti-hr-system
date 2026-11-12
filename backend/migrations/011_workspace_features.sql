-- Saved interview schedules and versioned candidate notifications.
CREATE TABLE public.interviews (
  id UUID PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE RESTRICT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL CHECK (ends_at > starts_at),
  interviewer TEXT NOT NULL CHECK (length(btrim(interviewer)) BETWEEN 1 AND 200),
  meeting_url TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled','Completed','Cancelled')),
  version INTEGER NOT NULL DEFAULT 1,
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (meeting_url <> '' OR btrim(location) <> '')
);
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications
  ADD COLUMN interview_id UUID REFERENCES public.interviews(id) ON DELETE RESTRICT,
  ADD COLUMN interview_version INTEGER,
  ADD COLUMN delivery_event TEXT,
  ADD COLUMN delivery_event_at TIMESTAMPTZ,
  ADD COLUMN delivery_checked_at TIMESTAMPTZ;
CREATE UNIQUE INDEX communications_interview_version_unique ON public.communications(interview_id,interview_version);

-- Employee edits use optimistic concurrency; fields have no invented defaults.
ALTER TABLE public.employees
  ADD COLUMN version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN updated_by TEXT,
  ADD COLUMN emergency_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN emergency_relationship TEXT NOT NULL DEFAULT '',
  ADD COLUMN emergency_phone TEXT NOT NULL DEFAULT '';
CREATE TABLE public.employee_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
  changed_by TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  previous_values JSONB NOT NULL,
  new_values JSONB NOT NULL
);
ALTER TABLE public.employee_changes ENABLE ROW LEVEL SECURITY;

-- Private PDF/DOCX bytes use the same bounded storage approach as applications.
CREATE TABLE public.onboarding_documents (
  id UUID PRIMARY KEY,
  onboarding_id UUID NOT NULL REFERENCES public.onboarding(id) ON DELETE RESTRICT,
  original_name TEXT NOT NULL,
  media_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes BETWEEN 1 AND 10485760),
  content BYTEA NOT NULL,
  uploaded_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (octet_length(content)=size_bytes)
);
CREATE INDEX onboarding_documents_record_idx ON public.onboarding_documents(onboarding_id,created_at DESC);
ALTER TABLE public.onboarding_documents ENABLE ROW LEVEL SECURITY;
