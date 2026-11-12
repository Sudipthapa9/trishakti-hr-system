-- Each accepted offer starts one private HR onboarding checklist.
CREATE TABLE public.onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL UNIQUE REFERENCES public.offers(id) ON DELETE RESTRICT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  checklist JSONB NOT NULL DEFAULT '{"documents":false,"payroll":false,"accounts":false,"orientation":false}'::jsonb
);
ALTER TABLE public.onboarding ENABLE ROW LEVEL SECURITY;
