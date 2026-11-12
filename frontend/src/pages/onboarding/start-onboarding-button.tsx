import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { startOnboarding } from "@/data/onboarding-api";
export function StartOnboardingButton({ offerId }: { offerId: string }) {
  const navigate = useNavigate();
  const busy = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  async function start() {
    if (busy.current) return;
    busy.current = true; setIsSubmitting(true); setError("");
    try { const result = await startOnboarding(offerId); navigate("/onboarding/" + result.id); }
    catch (error) { setError(error instanceof Error ? error.message : "Could not start onboarding."); }
    finally { busy.current = false; setIsSubmitting(false); }
  }
  return <div>{error && <p role="alert">{error}</p>}<Button type="button" disabled={isSubmitting} onClick={() => void start()}>{isSubmitting ? "Starting…" : "Start onboarding"}</Button></div>;
}
