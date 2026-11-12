ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS response_date DATE,
  ADD COLUMN IF NOT EXISTS response_notes TEXT NOT NULL DEFAULT ''
    CHECK (length(response_notes) <= 5000);

CREATE TABLE IF NOT EXISTS public.offer_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL UNIQUE REFERENCES public.offers(id) ON DELETE RESTRICT,
  outcome TEXT NOT NULL CHECK (outcome IN ('Accepted', 'Declined', 'Withdrawn')),
  response_date DATE NOT NULL,
  notes TEXT NOT NULL DEFAULT '' CHECK (length(notes) <= 5000),
  recorded_by TEXT NOT NULL,
  recorded_name TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.offer_responses ENABLE ROW LEVEL SECURITY;
