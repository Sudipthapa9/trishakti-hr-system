import { PageHeader } from "@/components/Layout/page-header";
import { Card } from "@/components/ui/card";
import { FeedbackMessage } from "@/components/shared/feedback/feedback-message";
import { NativeSelect } from "@/components/ui/native-select";
import "./offer-generation-page.css";
import { OfferResponseForm } from "./offer-response-form";
import { StartOnboardingButton } from "@/pages/onboarding/start-onboarding-button";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/forms/form-field";
import { Eye, Printer, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  getOffer,
  offerRecipients,
  saveOffer,
  sendOffer,
  OfferRequestError,
  type OfferRecord,
  type OfferFields,
  type OfferRecipient,
} from "@/data/offers-api";

async function loadRecipients(signal: AbortSignal): Promise<OfferRecipient[]> {
  const records = new Map<string, OfferRecipient>();
  for (let page = 1; ; page += 1) {
    signal.throwIfAborted();
    const result = await offerRecipients(page, signal);
    const previousSize = records.size;
    result.applications.forEach((application) =>
      records.set(application.id, application),
    );
    if (!result.hasMore) return [...records.values()];
    if (records.size === previousSize)
      throw new Error("Could not load all applicants. Please try again.");
  }
}

export function OfferGenerationPage() {
  const { offerId } = useParams();
  return <OfferWorkspace key={offerId ?? "new"} offerId={offerId} />;
}

function OfferWorkspace({ offerId }: { offerId?: string }) {
  const [recipients, setRecipients] = useState<OfferRecipient[]>([]);
  const [selected, setSelected] = useState<OfferRecord | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [savedNotice, setSavedNotice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const [applications, detail] = await Promise.all([
          loadRecipients(controller.signal),
          offerId && !hydrated.current
            ? getOffer(offerId, controller.signal)
            : Promise.resolve(null),
        ]);
        if (!controller.signal.aborted) {
          setRecipients(applications);
          if (!hydrated.current) {
            setSelected(detail?.offer ?? null);
            hydrated.current = true;
          }
          setError(null);
          setHasLoaded(true);
        }
      } catch (error) {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error ? error.message : "Could not load offers.",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [offerId, attempt]);

  return (
    <div className="page-recruitment-offer-generation-page">
      <div className="page-stack">
        <PageHeader
          className="page-heading"
          title={offerId ? "Offer details" : "Generate Offer"}
          description={<>Prepare an offer for a submitted application.</>}
          action={
            offerId ? (
              <Button asChild variant="outline">
                <Link to="/offers/new">New offer</Link>
              </Button>
            ) : undefined
          }
        />
        {savedNotice && (
          <FeedbackMessage role="status">{savedNotice}</FeedbackMessage>
        )}
        {error && (
          <div role="alert">
            <p>{error}</p>
            <Button
              onClick={() => {
                setLoading(true);
                setAttempt((value) => value + 1);
              }}
            >
              Try again
            </Button>
          </div>
        )}
        {loading && !hasLoaded ? (
          <FeedbackMessage role="status">Loading offers…</FeedbackMessage>
        ) : (
          hasLoaded && (
            <OfferEditor
              saved={selected}
              recipients={recipients}
              onSaved={(record, notice) => {
                setSelected(record);
                setSavedNotice(notice ?? "Offer draft saved.");
              }}
            />
          )
        )}
      </div>
    </div>
  );
}

function OfferEditor({
  saved,
  recipients,
  onSaved,
}: {
  saved: OfferRecord | null;
  recipients: OfferRecipient[];
  onSaved: (offer: OfferRecord, notice?: string) => void;
}) {
  const [step, setStep] = useState<"details" | "preview" | "send">(
    saved &&
      (saved.status !== "Draft" ||
        !["NotSent", "Failed"].includes(saved.sendStatus))
      ? "send"
      : "details",
  );
  const [applicationId, setApplicationId] = useState(
    saved?.applicationId ?? "",
  );
  const [fields, setFields] = useState<OfferFields>({
    position: saved?.position ?? "",
    currency: saved?.currency ?? "NPR",
    annualSalary: saved?.annualSalary ?? "",
    signOnBonus: saved?.signOnBonus ?? "0",
    joiningDate: saved?.joiningDate ?? "",
    expiryDate: saved?.expiryDate ?? "",
    benefits: saved?.benefits ?? "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [sendUncertain, setSendUncertain] = useState(false);
  const lock = useRef(false);
  const id = useRef(saved?.id ?? crypto.randomUUID());
  const editable =
    !sendUncertain &&
    (!saved ||
      (saved.status === "Draft" &&
        ["NotSent", "Failed"].includes(saved.sendStatus)));
  const applicant = recipients.find((entry) => entry.id === applicationId);
  const dirty =
    !saved ||
    Object.entries(fields).some(
      ([name, value]) => value !== saved[name as keyof OfferFields],
    );
  function change(name: keyof OfferFields, value: string) {
    setFields((current) => ({ ...current, [name]: value }));
    if (!saved) id.current = crypto.randomUUID();
    setNotice("");
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current || !editable) return;
    if (!applicationId) {
      setError("Select an application.");
      return;
    }
    if (fields.expiryDate > fields.joiningDate) {
      setError("Expiry must be on or before joining date.");
      return;
    }
    setError(null);
    setStep("preview");
  }
  async function acceptPreview() {
    if (lock.current || step !== "preview" || !editable) return;
    lock.current = true;
    setIsSaving(true);
    setError(null);
    setNotice("");
    try {
      const response = await saveOffer(
        fields,
        id.current,
        applicationId,
        saved?.version,
      );
      setFields(
        (current) =>
          Object.fromEntries(
            Object.keys(current).map((name) => [
              name,
              response.offer[name as keyof OfferFields],
            ]),
          ) as OfferFields,
      );
      onSaved(response.offer, "Preview confirmed. Ready to send.");
      setStep("send");
      setNotice("Review the recipient, then send the offer.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not save offer.",
      );
    } finally {
      lock.current = false;
      setIsSaving(false);
    }
  }
  async function reloadSavedOffer() {
    if (!saved || lock.current) return;
    lock.current = true;
    setIsSaving(true);
    setError(null);
    try {
      const response = await getOffer(saved.id, new AbortController().signal);
      setFields(
        (current) =>
          Object.fromEntries(
            Object.keys(current).map((name) => [
              name,
              response.offer[name as keyof OfferFields],
            ]),
          ) as OfferFields,
      );
      setSendUncertain(false);
      onSaved(response.offer, "Saved offer reloaded.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not reload the offer.",
      );
    } finally {
      lock.current = false;
      setIsSaving(false);
    }
  }
  async function sendSavedOffer() {
    if (!saved || dirty || !editable || lock.current || step !== "send") return;
    lock.current = true;
    setIsSaving(true);
    setError(null);
    try {
      const result = await sendOffer(saved.id, saved.version);
      onSaved(
        result.offer,
        "Offer accepted by Brevo. Delivery confirmation is pending.",
      );
    } catch (error) {
      if (error instanceof OfferRequestError && error.offer) {
        onSaved(error.offer, "Review the saved send status before continuing.");
      } else {
        try {
          const refreshed = await getOffer(
            saved.id,
            new AbortController().signal,
          );
          onSaved(
            refreshed.offer,
            "Review the current offer and communication history before sending again.",
          );
        } catch {
          setSendUncertain(true);
        }
      }
      setError(
        error instanceof Error
          ? error.message
          : "Could not confirm the send outcome.",
      );
    } finally {
      lock.current = false;
      setIsSaving(false);
    }
  }
  const name =
    saved?.candidateName ?? applicant?.fullName ?? "Select an applicant";
  const email = saved?.candidateEmail ?? applicant?.email ?? "";
  function money(value: string) {
    if (!value) return "—";
    const [whole, fraction = ""] = value.split(".");
    return (
      fields.currency +
      " " +
      whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
      "." +
      fraction.padEnd(2, "0").slice(0, 2)
    );
  }

  return (
    <div className="offer-editor">
      <nav className="offer-steps" aria-label="Offer preparation">
        <button
          type="button"
          disabled={isSaving || !editable}
          onClick={() => setStep("details")}
          aria-current={step === "details" ? "step" : undefined}
        >
          <span>1</span>Details
        </button>
        <button
          type="button"
          disabled={isSaving || !editable || step === "details"}
          onClick={() => setStep("preview")}
          aria-current={step === "preview" ? "step" : undefined}
        >
          <span>2</span>Preview
        </button>
        <span
          className="offer-step-label"
          aria-current={step === "send" ? "step" : undefined}
        >
          <span>3</span>Send
        </span>
      </nav>
      <div className={"offer-layout offer-step-" + step}>
        <div>
          {error && <FeedbackMessage role="alert">{error}</FeedbackMessage>}
          {notice && <FeedbackMessage role="status">{notice}</FeedbackMessage>}
          <form
            hidden={step !== "details"}
            id="offer-details"
            className="offer-details"
            onSubmit={submit}
          >
            <fieldset disabled={isSaving || !editable} className="offer-fields">
              <h2>Offer Details</h2>
              <FormField
                htmlFor="offer-application"
                label="Candidate / Application"
              >
                <NativeSelect
                  id="offer-application"
                  className="form-select"
                  value={applicationId}
                  disabled={!!saved}
                  required
                  onChange={(event) => {
                    setApplicationId(event.target.value);
                    id.current = crypto.randomUUID();
                    const application = recipients.find(
                      (entry) => entry.id === event.target.value,
                    );
                    change("position", application?.jobTitle ?? "");
                  }}
                >
                  <option value="">Select an application</option>
                  {saved && (
                    <option value={saved.applicationId}>
                      {saved.candidateName} · {saved.jobTitle}
                    </option>
                  )}
                  {!saved &&
                    recipients.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.fullName} · {entry.jobTitle}
                      </option>
                    ))}
                </NativeSelect>
              </FormField>
              <FormField htmlFor="offer-position" label="Position">
                <Input
                  id="offer-position"
                  value={fields.position}
                  maxLength={200}
                  required
                  onChange={(event) => change("position", event.target.value)}
                />
              </FormField>
              <FormField htmlFor="offer-currency" label="Currency">
                <NativeSelect
                  id="offer-currency"
                  className="form-select"
                  value={fields.currency}
                  onChange={(event) => change("currency", event.target.value)}
                >
                  {["NPR", "USD", "INR", "EUR", "GBP"].map((currency) => (
                    <option key={currency}>{currency}</option>
                  ))}
                </NativeSelect>
              </FormField>
              <FormField htmlFor="offer-salary" label="Annual base salary">
                <Input
                  id="offer-salary"
                  type="number"
                  min="0.01"
                  max="999999999999.99"
                  step="0.01"
                  required
                  value={fields.annualSalary}
                  onChange={(event) =>
                    change("annualSalary", event.target.value)
                  }
                />
              </FormField>
              <FormField htmlFor="offer-bonus" label="Sign-on bonus">
                <Input
                  id="offer-bonus"
                  type="number"
                  min="0"
                  max="999999999999.99"
                  step="0.01"
                  required
                  value={fields.signOnBonus}
                  onChange={(event) =>
                    change("signOnBonus", event.target.value)
                  }
                />
              </FormField>
              <div className="offer-dates">
                <FormField htmlFor="offer-start" label="Joining date">
                  <Input
                    id="offer-start"
                    type="date"
                    required
                    value={fields.joiningDate}
                    onChange={(event) =>
                      change("joiningDate", event.target.value)
                    }
                  />
                </FormField>
                <FormField htmlFor="offer-expiry" label="Offer expiry">
                  <Input
                    id="offer-expiry"
                    type="date"
                    required
                    max={fields.joiningDate || undefined}
                    value={fields.expiryDate}
                    onChange={(event) =>
                      change("expiryDate", event.target.value)
                    }
                  />
                </FormField>
              </div>
              <FormField htmlFor="offer-benefits" label="Key Benefits">
                <Textarea
                  id="offer-benefits"
                  maxLength={10000}
                  value={fields.benefits}
                  onChange={(event) => change("benefits", event.target.value)}
                />
              </FormField>
              <Button type="submit">
                <Send aria-hidden="true" />
                Send Offer to Candidate
              </Button>
            </fieldset>
          </form>
          <div id="offer-delivery" hidden={step !== "send"}>
            <h2 className="offer-send-heading">Send Offer</h2>
            <p className="offer-save-hint">
              Review the recipient and send status below.
            </p>
            {saved && (
              <div className="offer-delivery-controls">
                <p>Send status: {saved.sendStatus}</p>
                <p>
                  Recipient: {saved.candidateName} · {saved.candidateEmail}
                </p>
                {saved.delivery?.lastError && (
                  <FeedbackMessage role="alert">
                    {saved.delivery.lastError}
                  </FeedbackMessage>
                )}
                {saved.delivery && (
                  <Link
                    className="underline"
                    to={"/communication?message=" + saved.delivery.id}
                  >
                    View email history and check delivery
                  </Link>
                )}
                {saved.sendStatus === "Accepted" && (
                  <p>Accepted by Brevo. Delivery confirmation is pending.</p>
                )}
                {["Sending", "Unknown"].includes(saved.sendStatus) && (
                  <p>
                    Check Brevo logs and communication history before sending
                    another offer.
                  </p>
                )}
                <Button
                  type="button"
                  disabled={isSaving || dirty || !editable}
                  onClick={() => void sendSavedOffer()}
                >
                  {isSaving
                    ? "Working…"
                    : saved.sendStatus === "Failed"
                      ? "Retry sending saved offer"
                      : "Send Offer to Candidate"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving}
                  onClick={() => void reloadSavedOffer()}
                >
                  Reload saved offer
                </Button>
              </div>
            )}
          </div>
          {sendUncertain && (
            <FeedbackMessage role="alert">
              The send outcome could not be checked. Reload the saved offer
              before continuing.
            </FeedbackMessage>
          )}
          {saved?.status === "Sent" && saved.sendStatus === "Accepted" && (
            <OfferResponseForm
              offer={saved}
              onBusy={setIsSaving}
              onRecorded={(record) =>
                onSaved(record, "Offer response recorded.")
              }
            />
          )}
          {saved?.status === "Accepted" && (
            <StartOnboardingButton offerId={saved.id} />
          )}
          {saved?.responseDate && (
            <Card asChild className="gap-4 py-0 ring-0">
              <section className="mt-4 rounded-lg border bg-white p-4">
                <h2>Recorded outcome: {saved.status}</h2>
                <p>Response date: {saved.responseDate}</p>
                <p className="whitespace-pre-line">
                  {saved.responseNotes || "No notes provided."}
                </p>
                {saved.responseAudit && (
                  <p>
                    Recorded by {saved.responseAudit.recordedName} on{" "}
                    {new Date(saved.responseAudit.recordedAt).toLocaleString()}
                  </p>
                )}
              </section>
            </Card>
          )}
        </div>
        <section
          hidden={step === "send"}
          id="offer-preview"
          className="offer-preview"
          aria-label="Offer letter preview"
        >
          <header>
            <h2>
              <Eye aria-hidden="true" />
              {dirty ? "Document Preview / Unsaved" : "Document Preview"}
            </h2>
            <Button
              variant="outline"
              disabled={isSaving || step === "details"}
              onClick={() => window.print()}
            >
              <Printer aria-hidden="true" /> Generate PDF
            </Button>
          </header>
          {step === "preview" && editable && (
            <div className="offer-preview-actions">
              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                onClick={() => setStep("details")}
              >
                Back to Details
              </Button>
              <Button
                type="button"
                disabled={isSaving}
                onClick={() => void acceptPreview()}
              >
                {isSaving ? "Continuing..." : "Accept and Continue"}
              </Button>
              <p>
                Confirms this preview for sending; it does not record the
                candidate's acceptance.
              </p>
            </div>
          )}
          <article className="offer-paper">
            <div className="offer-letterhead">
              <div>
                <h2>Trikshati Poly Packs</h2>
                <p>Employment offer · {saved?.status ?? "Draft"}</p>
              </div>
              <div>
                <p>
                  {saved
                    ? "Ref: TSH-OFFER-" + saved.id
                    : "Save to generate a reference"}
                </p>
                {saved && (
                  <p>Date: {new Date(saved.updatedAt).toLocaleDateString()}</p>
                )}
              </div>
            </div>
            <p>Dear {name},</p>
            <p>{email}</p>
            <p>
              We offer you the position of{" "}
              <strong>{fields.position || "—"}</strong> at Trikshati Poly Packs.
            </p>
            <h3>Compensation</h3>
            <p>Annual base salary: {money(fields.annualSalary)}</p>
            <p>Sign-on bonus: {money(fields.signOnBonus)}</p>
            <h3>Benefits</h3>
            <p className="whitespace-pre-line">
              {fields.benefits || "No benefits specified."}
            </p>
            <h3>Terms &amp; Acceptance</h3>
            <p>Joining date: {fields.joiningDate || "—"}</p>
            <p>Offer expiry: {fields.expiryDate || "—"}</p>
            <div className="offer-signature">
              Authorized signature<span>Candidate acceptance</span>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
