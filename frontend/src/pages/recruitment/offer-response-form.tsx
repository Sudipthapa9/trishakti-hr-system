import { Card } from "@/components/ui/card";
import { FeedbackMessage } from "@/components/HR/feedback-message";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  recordOfferResponse,
  type OfferOutcome,
  type OfferRecord,
} from "@/data/offers-api";

export function OfferResponseForm({
  offer,
  onRecorded,
  onBusy,
}: {
  offer: OfferRecord;
  onRecorded: (record: OfferRecord) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [outcome, setOutcome] = useState<OfferOutcome>("Accepted");
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kathmandu",
  }).format(new Date());
  const [date, setDate] = useState(today);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setIsSaving(true);
    onBusy(true);
    setError(null);
    try {
      const saved = await recordOfferResponse(
        offer.id,
        offer.version,
        outcome,
        date,
        notes,
      );
      onRecorded(saved.offer);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not record the offer response.",
      );
    } finally {
      busy.current = false;
      setIsSaving(false);
      onBusy(false);
    }
  }

  return (
    <Card asChild className="gap-4 py-0 ring-0">
      <section className="rounded-lg border bg-white p-5">
        <h2>Record offer response</h2>
        <p>
          Record the candidate's decision or an HR withdrawal. This final
          outcome is locked after saving.
        </p>
        {error && <FeedbackMessage role="alert">{error}</FeedbackMessage>}
        <form onSubmit={submit} aria-busy={isSaving}>
          <fieldset disabled={isSaving} className="grid gap-3">
            <Label htmlFor="offer-outcome">Outcome</Label>
            <NativeSelect
              id="offer-outcome"
              className="form-select"
              value={outcome}
              onChange={(event) =>
                setOutcome(event.target.value as OfferOutcome)
              }
            >
              <option>Accepted</option>
              <option>Declined</option>
              <option>Withdrawn</option>
            </NativeSelect>
            <Label htmlFor="offer-response-date">
              Response date (Nepal time)
            </Label>
            <Input
              id="offer-response-date"
              type="date"
              required
              value={date}
              max={
                outcome === "Accepted" && offer.expiryDate < today
                  ? offer.expiryDate
                  : today
              }
              onChange={(event) => setDate(event.target.value)}
            />
            <Label htmlFor="offer-response-notes">Notes</Label>
            <Textarea
              id="offer-response-notes"
              value={notes}
              maxLength={5000}
              onChange={(event) => setNotes(event.target.value)}
            />
            <Button type="submit">
              {isSaving ? "Saving…" : "Save final outcome"}
            </Button>
          </fieldset>
        </form>
      </section>
    </Card>
  );
}
