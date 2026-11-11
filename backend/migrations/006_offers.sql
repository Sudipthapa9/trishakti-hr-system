CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY,
  application_id UUID NOT NULL UNIQUE REFERENCES public.applications(id) ON DELETE RESTRICT,
  position TEXT NOT NULL CHECK (length(btrim(position)) BETWEEN 1 AND 200),
  currency TEXT NOT NULL CHECK (currency IN ('NPR', 'USD', 'INR', 'EUR', 'GBP')),
  annual_salary NUMERIC(14,2) NOT NULL CHECK (annual_salary > 0),
  sign_on_bonus NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (sign_on_bonus >= 0),
  joining_date DATE NOT NULL,
  expiry_date DATE NOT NULL CHECK (expiry_date <= joining_date),
  benefits TEXT NOT NULL DEFAULT '' CHECK (length(benefits) <= 10000),
  status TEXT NOT NULL DEFAULT 'Draft'
    CHECK (status IN ('Draft', 'Sent', 'Accepted', 'Declined', 'Withdrawn')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS offers_created_idx ON public.offers(created_at DESC, id DESC);
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
