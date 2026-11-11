ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS send_status TEXT NOT NULL DEFAULT 'NotSent'
    CHECK (send_status IN ('NotSent', 'Sending', 'Accepted', 'Failed', 'Unknown'));
ALTER TABLE public.communications
  ADD COLUMN IF NOT EXISTS offer_id UUID REFERENCES public.offers(id) ON DELETE RESTRICT;
CREATE UNIQUE INDEX IF NOT EXISTS communications_offer_unique
  ON public.communications(offer_id) WHERE offer_id IS NOT NULL;
ALTER TABLE public.communications DROP CONSTRAINT IF EXISTS communications_body_check;
ALTER TABLE public.communications ADD CONSTRAINT communications_body_check
  CHECK (length(btrim(body)) BETWEEN 1 AND 20000);
