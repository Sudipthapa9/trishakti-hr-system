-- Completion and the employee snapshot are written in one transaction.
ALTER TABLE public.onboarding
  ADD COLUMN completed_at TIMESTAMPTZ,
  ADD COLUMN completed_by TEXT;

CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_id UUID NOT NULL UNIQUE REFERENCES public.onboarding(id) ON DELETE RESTRICT,
  candidate_id UUID NOT NULL UNIQUE REFERENCES public.candidates(id) ON DELETE RESTRICT,
  application_id UUID NOT NULL UNIQUE REFERENCES public.applications(id) ON DELETE RESTRICT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  position TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  joining_date DATE NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
