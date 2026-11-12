import "./offer-generation-page.css";
import { OfferResponseForm } from "./offer-response-form";
import { StartOnboardingButton } from "@/pages/onboarding/start-onboarding-button";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { listOffers, getOffer, offerRecipients, saveOffer, sendOffer, OfferRequestError, type OfferRecord, type OfferFields, type OfferRecipient } from "@/data/offers-api";

export function OfferGenerationPage() {
  const { offerId } = useParams();
  return <OfferWorkspace key={offerId ?? "new"} offerId={offerId} />;
}

function OfferWorkspace({ offerId }: { offerId?: string }) {
  const [offers, setOffers] = useState<OfferRecord[]>([]);
  const [recipients, setRecipients] = useState<OfferRecipient[]>([]);
  const [selected, setSelected] = useState<OfferRecord | null>(null);
  const [query, setQuery] = useState({ offers: 1, applications: 1, attempt: 0 });
  const [moreOffers, setMoreOffers] = useState(false);
  const [moreApplications, setMoreApplications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [savedNotice, setSavedNotice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const [history, applications, detail] = await Promise.all([
          listOffers(query.offers, controller.signal),
          offerRecipients(query.applications, controller.signal),
          offerId && !hydrated.current ? getOffer(offerId, controller.signal) : Promise.resolve(null),
        ]);
        if (!controller.signal.aborted) {
          setOffers(history.offers); setMoreOffers(history.hasMore);
          setRecipients(applications.applications); setMoreApplications(applications.hasMore);
          if (!hydrated.current) {
            setSelected(detail?.offer ?? null);
            hydrated.current = true;
          }
          setError(null); setHasLoaded(true);
        }
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Could not load offers.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [offerId, query]);

  function page(kind: "offers" | "applications", direction: number) {
    setLoading(true);
    setQuery((value) => ({ ...value, [kind]: value[kind] + direction }));
  }

  return (
    <div className="page-recruitment-offer-generation-page">
      <div className="page-stack">
        <header className="page-heading">
          <div><h1>{offerId ? "Saved offer" : "Create offer draft"}</h1><p>Prepare an offer for a submitted application.</p></div>
          {offerId && <Button asChild variant="outline"><Link to="/offers/new">New offer</Link></Button>}
        </header>
        {savedNotice && <p role="status">{savedNotice}</p>}
        {error && <div role="alert"><p>{error}</p><Button onClick={() => {
          setLoading(true); setQuery((value) => ({ ...value, attempt: value.attempt + 1 }));
        }}>Try again</Button></div>}
        {loading && !hasLoaded ? <p role="status">Loading offers…</p> : hasLoaded && (
          <OfferEditor key={selected ? selected.id + ":" + selected.version : "new"} saved={selected} recipients={recipients} onBusy={setBusy}
            onSaved={(record, notice) => {
              setSelected((current) => current ? { ...current, ...record } : record);
              setOffers((current) => current.map((offer) => offer.id === record.id ? { ...offer, ...record } : offer));
              setSavedNotice(notice ?? "Offer draft saved.");
            }} />
        )}
        {!offerId && <div className="flex gap-3">
          <Button variant="outline" disabled={loading || busy || query.applications === 1} onClick={() => page("applications", -1)}>Previous applicants</Button>
          <Button variant="outline" disabled={loading || busy || !!error || !moreApplications} onClick={() => page("applications", 1)}>More applicants</Button>
        </div>}
        <section className="offer-history">
          <h2>Saved offers</h2>
          {!loading && !error && !offers.length && <p>No offers saved yet.</p>}
          {!loading && !error && offers.map((offer) => (
            <article className="rounded-lg border bg-white p-4" key={offer.id}>
              <h3>{offer.candidateName} · {offer.position}</h3>
              <p>{offer.candidateEmail} · {offer.status}</p>
              <Link className="underline" to={"/offers/" + offer.id}>Open offer</Link>
            </article>
          ))}
          <div className="mt-3 flex gap-3">
            <Button variant="outline" disabled={loading || busy || query.offers === 1} onClick={() => page("offers", -1)}>Previous</Button>
            <span>Page {query.offers}</span>
            <Button variant="outline" disabled={loading || busy || !!error || !moreOffers} onClick={() => page("offers", 1)}>Next</Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function OfferEditor({ saved, recipients, onBusy, onSaved }: {
  saved: OfferRecord | null; recipients: OfferRecipient[]; onBusy: (busy: boolean) => void; onSaved: (offer: OfferRecord, notice?: string) => void;
}) {
  const navigate = useNavigate();
  const [applicationId, setApplicationId] = useState(saved?.applicationId ?? "");
  const [fields, setFields] = useState<OfferFields>({
    position: saved?.position ?? "", currency: saved?.currency ?? "NPR",
    annualSalary: saved?.annualSalary ?? "", signOnBonus: saved?.signOnBonus ?? "0",
    joiningDate: saved?.joiningDate ?? "", expiryDate: saved?.expiryDate ?? "", benefits: saved?.benefits ?? "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [chosenApplicant, setChosenApplicant] = useState<OfferRecipient | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [sendUncertain, setSendUncertain] = useState(false);
  const lock = useRef(false);
  const id = useRef(saved?.id ?? crypto.randomUUID());
  const editable = !sendUncertain && (!saved || (saved.status === "Draft" && ["NotSent", "Failed"].includes(saved.sendStatus)));
  const applicant = chosenApplicant ?? recipients.find((entry) => entry.id === applicationId);
  const dirty = !saved || Object.entries(fields).some(([name, value]) => value !== saved[name as keyof OfferFields]);
  function change(name: keyof OfferFields, value: string) {
    setFields((current) => ({ ...current, [name]: value }));
    if (!saved) id.current = crypto.randomUUID();
    setNotice("");
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    if (!applicationId) { setError("Select an application."); return; }
    if (fields.expiryDate > fields.joiningDate) { setError("Expiry must be on or before joining date."); return; }
    lock.current = true; setIsSaving(true); onBusy(true); setError(null); setNotice("");
    try {
      const response = await saveOffer(fields, id.current, applicationId, saved?.version);
      if (saved) {
        onSaved(response.offer);
      } else {
        navigate("/offers/" + response.offer.id);
      }
      setNotice("Offer draft saved.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not save offer.");
    } finally {
      lock.current = false; setIsSaving(false); onBusy(false);
    }
  }
  async function sendSavedOffer() {
    if (!saved || dirty || !editable || lock.current) return;
    lock.current = true; setIsSaving(true); onBusy(true); setError(null);
    try {
      const result = await sendOffer(saved.id, saved.version);
      onSaved(result.offer, "Offer accepted by Brevo. Delivery confirmation is pending.");
    } catch (error) {
      if (error instanceof OfferRequestError && error.offer) {
        onSaved(error.offer, "Review the saved send status before continuing.");
      } else {
        try {
          const refreshed = await getOffer(saved.id, new AbortController().signal);
          onSaved(refreshed.offer, "Review the current offer and communication history before sending again.");
        } catch {
          setSendUncertain(true);
        }
      }
      setError(error instanceof Error ? error.message : "Could not confirm the send outcome.");
    } finally {
      lock.current = false; setIsSaving(false); onBusy(false);
    }
  }
  const name = saved?.candidateName ?? applicant?.fullName ?? "Select an applicant";
  const email = saved?.candidateEmail ?? applicant?.email ?? "";
  function money(value: string) {
    if (!value) return "—";
    const [whole, fraction = ""] = value.split(".");
    return fields.currency + " " + whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + fraction.padEnd(2, "0").slice(0, 2);
  }

  return (
    <div className="offer-layout">
      <div>
        {error && <p role="alert">{error}</p>}
        {notice && <p role="status">{notice}</p>}
        <form className="offer-details" onSubmit={submit}>
          <fieldset disabled={isSaving || !editable} className="grid gap-3">
            <Label htmlFor="offer-application">Application</Label>
            <select id="offer-application" className="form-select" value={applicationId} disabled={!!saved} required
              onChange={(event) => {
                setApplicationId(event.target.value); id.current = crypto.randomUUID();
                const application = recipients.find((entry) => entry.id === event.target.value);
                setChosenApplicant(application);
                change("position", application?.jobTitle ?? "");
              }}>
              <option value="">Select an application</option>
              {saved && <option value={saved.applicationId}>{saved.candidateName} · {saved.jobTitle}</option>}
              {!saved && chosenApplicant && !recipients.some((entry) => entry.id === chosenApplicant.id) &&
                <option value={chosenApplicant.id}>{chosenApplicant.fullName} · {chosenApplicant.jobTitle}</option>}
              {!saved && recipients.map((entry) => <option key={entry.id} value={entry.id}>{entry.fullName} · {entry.jobTitle}</option>)}
            </select>
            <Label htmlFor="offer-position">Position</Label>
            <Input id="offer-position" value={fields.position} maxLength={200} required onChange={(event) => change("position", event.target.value)} />
            <Label htmlFor="offer-currency">Currency</Label>
            <select id="offer-currency" className="form-select" value={fields.currency} onChange={(event) => change("currency", event.target.value)}>
              {["NPR", "USD", "INR", "EUR", "GBP"].map((currency) => <option key={currency}>{currency}</option>)}
            </select>
            <Label htmlFor="offer-salary">Annual base salary</Label>
            <Input id="offer-salary" type="number" min="0.01" max="999999999999.99" step="0.01" required value={fields.annualSalary} onChange={(event) => change("annualSalary", event.target.value)} />
            <Label htmlFor="offer-bonus">Sign-on bonus</Label>
            <Input id="offer-bonus" type="number" min="0" max="999999999999.99" step="0.01" required value={fields.signOnBonus} onChange={(event) => change("signOnBonus", event.target.value)} />
            <Label htmlFor="offer-start">Joining date</Label>
            <Input id="offer-start" type="date" required value={fields.joiningDate} onChange={(event) => change("joiningDate", event.target.value)} />
            <Label htmlFor="offer-expiry">Offer expiry</Label>
            <Input id="offer-expiry" type="date" required max={fields.joiningDate || undefined} value={fields.expiryDate} onChange={(event) => change("expiryDate", event.target.value)} />
            <Label htmlFor="offer-benefits">Benefits</Label>
            <Textarea id="offer-benefits" maxLength={10000} value={fields.benefits} onChange={(event) => change("benefits", event.target.value)} />
            <Button type="submit">{isSaving ? "Saving…" : "Save draft"}</Button>
          </fieldset>
        </form>
        {saved && (
          <div className="mt-4 grid gap-3">
            <p>Send status: {saved.sendStatus}</p>
            <p>Recipient: {saved.candidateName} · {saved.candidateEmail}</p>
            {saved.delivery?.lastError && <p role="alert">{saved.delivery.lastError}</p>}
            {saved.sendStatus === "Accepted" && <p>Accepted by Brevo. Delivery confirmation is pending.</p>}
            {["Sending", "Unknown"].includes(saved.sendStatus) && <p>Check Brevo logs and communication history before sending another offer.</p>}
            <Button type="button" disabled={isSaving || dirty || !editable} onClick={() => void sendSavedOffer()}>
              {isSaving ? "Working…" : saved.sendStatus === "Failed" ? "Retry sending saved offer" : "Send saved offer"}
            </Button>
            <Button type="button" variant="outline" disabled={isSaving} onClick={() => window.location.reload()}>Reload saved offer</Button>
          </div>
        )}
        {sendUncertain && <p role="alert">The send outcome could not be checked. Reload the saved offer before continuing.</p>}
        {saved?.status === "Sent" && saved.sendStatus === "Accepted" && (
          <OfferResponseForm offer={saved} onBusy={onBusy} onRecorded={(record) => onSaved(record, "Offer response recorded.")} />
        )}
        {saved?.status === "Accepted" && <StartOnboardingButton offerId={saved.id} />}
        {saved?.responseDate && (
          <section className="mt-4 rounded-lg border bg-white p-4">
            <h2>Recorded outcome: {saved.status}</h2>
            <p>Response date: {saved.responseDate}</p>
            <p className="whitespace-pre-line">{saved.responseNotes || "No notes provided."}</p>
            {saved.responseAudit && <p>Recorded by {saved.responseAudit.recordedName} on {new Date(saved.responseAudit.recordedAt).toLocaleString()}</p>}
          </section>
        )}
      </div>
      <section className="offer-preview">
        <header><span>{dirty ? "Unsaved preview" : "Saved offer preview"}</span>
          <Button variant="outline" disabled={isSaving || dirty} onClick={() => window.print()}>Print / Save PDF</Button>
        </header>
        <article className="offer-paper">
          <div className="offer-letterhead"><div><h2>Trikshati Poly Packs</h2><p>Employment offer · {saved?.status ?? "Draft"}</p></div>
            <div><p>{saved ? "Ref: TSH-OFFER-" + saved.id : "Save to generate a reference"}</p>
              {saved && <p>Date: {new Date(saved.updatedAt).toLocaleDateString()}</p>}</div>
          </div>
          <p>Dear {name},</p><p>{email}</p>
          <p>We offer you the position of <strong>{fields.position || "—"}</strong> at Trikshati Poly Packs.</p>
          <h3>Compensation</h3><p>Annual base salary: {money(fields.annualSalary)}</p><p>Sign-on bonus: {money(fields.signOnBonus)}</p>
          <h3>Benefits</h3><p className="whitespace-pre-line">{fields.benefits || "No benefits specified."}</p>
          <h3>Dates</h3><p>Joining date: {fields.joiningDate || "—"}</p><p>Offer expiry: {fields.expiryDate || "—"}</p>
          <div className="offer-signature">Authorized signature<span>Candidate acceptance</span></div>
        </article>
      </section>
    </div>
  );
}
