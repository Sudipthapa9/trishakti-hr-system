CREATE TABLE IF NOT EXISTS public.communications (
  id UUID PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE RESTRICT,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  subject TEXT NOT NULL CHECK (length(btrim(subject)) BETWEEN 1 AND 200),
  body TEXT NOT NULL CHECK (length(btrim(body)) BETWEEN 1 AND 10000),
  status TEXT NOT NULL DEFAULT 'Draft'
    CHECK (status IN ('Draft', 'Sending', 'Accepted', 'Failed', 'Unknown')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by TEXT NOT NULL,
  provider_message_id TEXT,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS communications_created_idx ON public.communications(created_at DESC, id DESC);
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
