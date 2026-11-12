import "./communication-page.css";
import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { communicationRequest, CommunicationError, type MessageRecord } from "@/data/communications-api";

type Recipient = { id: string; fullName: string; email: string; jobTitle: string };
const templates = {
  "Application acknowledgement": "Hi {{candidate_name}},\n\nThank you for applying for {{job_title}}. Our HR team will review your application.\n\nBest regards,\nTrishakti HR",
  "Interview invitation": "Hi {{candidate_name}},\n\nWe would like to discuss your application for {{job_title}}. Please reply with your availability.\n\nBest regards,\nTrishakti HR",
  "Rejection notice": "Hi {{candidate_name}},\n\nThank you for your interest in {{job_title}}. We will not be progressing this application at this time.\n\nBest regards,\nTrishakti HR",
  "Offer communication": "Hi {{candidate_name}},\n\nWe would like to discuss an offer for {{job_title}}. Please contact our HR team for details.\n\nBest regards,\nTrishakti HR",
};

export function CommunicationPage() {
  const [searchParams] = useSearchParams();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [recipientPage, setRecipientPage] = useState(1);
  const [moreRecipients, setMoreRecipients] = useState(false);
  const [applicationId, setApplicationId] = useState("");
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [moreHistory, setMoreHistory] = useState(false);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [current, setCurrent] = useState<MessageRecord | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const busy = useRef(false);
  const draftId = useRef<string | null>(null);
  const openedId = useRef<string | null>(searchParams.get("message"));
  const initialMessageLoaded = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const [applications, history] = await Promise.all([
          communicationRequest("applications?page=" + recipientPage, { signal: controller.signal }),
          communicationRequest("communications?page=" + historyPage, { signal: controller.signal }),
        ]);
        if (!controller.signal.aborted) {
          setRecipients(applications.applications);
          setMoreRecipients(applications.hasMore);
          setMessages(history.messages);
          setMoreHistory(history.hasMore);
          setLoadError(null);
        }
        const id = openedId.current;
        if (id) {
          const saved = await communicationRequest("communications/" + id, { signal: controller.signal });
          if (!controller.signal.aborted && openedId.current === id) {
            if (!initialMessageLoaded.current && searchParams.get("message") === id) {
              setSubject(saved.message.subject); setBody(saved.message.body); setApplicationId(saved.message.applicationId);
              initialMessageLoaded.current = true;
            }
            setCurrent((previous) => {
              if (!previous && openedId.current === id) return saved.message;
              if (!previous || previous.id !== id) return previous;
              // Keep the original edit version until HR explicitly reloads an editable draft.
              if (previous.status === "Sending" || previous.status === "Unknown" ||
                  ["Sending", "Unknown", "Accepted"].includes(saved.message.status)) return saved.message;
              return previous;
            });
          }
        }
      } catch (error) {
        if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : "Could not load communication.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [recipientPage, historyPage, revision, searchParams]);

  function refresh() { setLoading(true); setRevision((value) => value + 1); }
  function newMessage() {
    setCurrent(null); openedId.current = null; draftId.current = null; setSubject(""); setBody("");
    setApplicationId(""); setError(null); setNotice("");
  }
  function open(record: MessageRecord) {
    setCurrent(record); openedId.current = record.id; draftId.current = record.id; setApplicationId(record.applicationId);
    setSubject(record.subject); setBody(record.body); setError(null); setNotice("");
  }
  function chooseTemplate(name: keyof typeof templates) {
    const recipient = recipients.find((entry) => entry.id === applicationId);
    if (!recipient) return;
    setSubject(name + " — " + recipient.jobTitle);
    setBody(templates[name].replaceAll("{{candidate_name}}", recipient.fullName).replaceAll("{{job_title}}", recipient.jobTitle));
  }
  async function save(send: boolean) {
    if (busy.current) return;
    if (!applicationId || !subject.trim() || !body.trim()) {
      setError("Select an application and complete the subject and message."); return;
    }
    busy.current = true; setIsSaving(true); setError(null); setNotice("");
    try {
      let saved = current;
      // A send retry for a saved immutable record must never create another draft.
      if (!saved) {
        draftId.current ??= crypto.randomUUID();
        const data = await communicationRequest("communications", {
          method: "POST", body: JSON.stringify({ id: draftId.current, applicationId, subject, body }),
        });
        saved = data.message as MessageRecord;
      } else if (saved.subject !== subject.trim() || saved.body !== body.trim() || (!send && saved.status === "Failed")) {
        const data = await communicationRequest("communications/" + saved.id, {
          method: "PATCH", body: JSON.stringify({ subject, body, expectedVersion: saved.version }),
        });
        saved = data.message as MessageRecord;
      }
      setCurrent(saved);
      openedId.current = saved.id;
      if (send) {
        setCurrent({ ...saved, status: "Sending" });
        const data = await communicationRequest("communications/" + saved.id + "/send", {
          method: "POST", body: JSON.stringify({ expectedVersion: saved.version }),
        });
        setCurrent(data.message);
        setNotice("Accepted by Brevo. Delivery confirmation is pending.");
      } else {
        setNotice("Draft saved.");
      }
      refresh();
    } catch (error) {
      if (error instanceof CommunicationError && error.record) setCurrent(error.record);
      setError(error instanceof Error ? error.message : "Could not save or send this message.");
      refresh();
    } finally {
      busy.current = false; setIsSaving(false);
    }
  }
  const editable = !current || (!current.offerId && !current.interviewId && (current.status === "Draft" || current.status === "Failed"));
  async function checkDelivery() {
    if (!current || busy.current) return;
    busy.current = true; setIsSaving(true); setError(null);
    try { const result = await communicationRequest(`communications/${current.id}/delivery`, { method: "POST" }); setCurrent(result.message); setNotice(result.message.deliveryEvent ? "Delivery events refreshed." : "No delivery or bounce event found in the last 90 days."); refresh(); }
    catch (error) { setError(error instanceof Error ? error.message : "Could not check delivery."); }
    finally { busy.current = false; setIsSaving(false); }
  }

  return (
    <div className="page-recruitment-communication-page">
      <div className="page-stack">
        <header className="page-heading"><div><h1>Communication Hub</h1><p>Write candidate messages, save drafts and review email submissions.</p></div>
          <Button variant="outline" disabled={isSaving} onClick={newMessage}>New message</Button>
        </header>
        {loadError && <div role="alert"><p>{loadError}</p><Button onClick={refresh}>Reload</Button></div>}
        {error && <p role="alert">{error}</p>}
        {notice && <p role="status">{notice}</p>}
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border bg-white p-5">
            <h2>Compose message {current && "· " + current.status}</h2>
            <form onSubmit={(event) => { event.preventDefault(); void save(true); }}>
              <fieldset disabled={isSaving || !editable} className="grid gap-3">
                <label htmlFor="message-application">Application</label>
                <select className="form-select" id="message-application" value={applicationId} required disabled={!!current || loading}
                  onChange={(event) => { setApplicationId(event.target.value); draftId.current = null; }}>
                  <option value="">Select an application</option>
                  {current && !recipients.some((entry) => entry.id === current.applicationId) &&
                    <option value={current.applicationId}>{current.recipientName} · {current.recipientEmail}</option>}
                  {recipients.map((recipient) => <option key={recipient.id} value={recipient.id}>{recipient.fullName} · {recipient.jobTitle} · {recipient.email}</option>)}
                </select>
                {!current && <div className="flex gap-2">
                  <Button type="button" variant="outline" disabled={loading || recipientPage === 1}
                    onClick={() => { setLoading(true); setApplicationId(""); setRecipientPage((value) => value - 1); }}>Previous applicants</Button>
                  <Button type="button" variant="outline" disabled={loading || !moreRecipients}
                    onClick={() => { setLoading(true); setApplicationId(""); setRecipientPage((value) => value + 1); }}>More applicants</Button>
                </div>}
                <label htmlFor="message-template">Template</label>
                <select key={applicationId + (current?.id ?? "new")} id="message-template" className="form-select" defaultValue="" disabled={!applicationId || !!current}
                  onChange={(event) => chooseTemplate(event.target.value as keyof typeof templates)}>
                  <option value="" disabled>Choose an optional template</option>
                  {Object.keys(templates).map((name) => <option key={name}>{name}</option>)}
                </select>
                <label htmlFor="message-subject">Subject</label>
                <Input id="message-subject" value={subject} maxLength={200} required onChange={(event) => { setSubject(event.target.value); if (!current) draftId.current = null; }} />
                <label htmlFor="message-body">Message</label>
                <Textarea id="message-body" className="min-h-72" value={body} maxLength={10000} required onChange={(event) => { setBody(event.target.value); if (!current) draftId.current = null; }} />
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => void save(false)}>{isSaving ? "Working…" : "Save draft"}</Button>
                  <Button type="submit">{isSaving ? "Working…" : "Send email"}</Button>
                </div>
              </fieldset>
            </form>
            {current?.offerId && <Link className="underline" to={"/offers/" + current.offerId}>Manage this message from its saved offer</Link>}
            {current?.interviewId && <div className="grid gap-3"><Link to="/interviews">View saved interview</Link><p>This notification uses the saved schedule. Rescheduled or cancelled interviews require a new notification.</p>{["Draft", "Failed"].includes(current.status) && <Button disabled={isSaving} onClick={() => void save(true)}>Send saved interview notification</Button>}</div>}
            {current?.status === "Accepted" && <section className="mt-4"><p>Delivery: {current.deliveryEvent || "Not confirmed"}{current.deliveryEventAt && " · " + new Date(current.deliveryEventAt).toLocaleString()}</p><Button variant="outline" disabled={isSaving} onClick={() => void checkDelivery()}>Check delivery with Brevo</Button><p>Checks the last 90 days; absence of an event does not mean delivery failed.</p></section>}
            {current?.lastError && <p>{current.lastError}</p>}
            {current?.status === "Sending" && <p>Send is in progress or needs confirmation. Check Brevo logs before creating another message.</p>}
            {current?.status === "Unknown" && <p>The send outcome is uncertain. Check Brevo logs before creating another message.</p>}
          </section>
          <section className="rounded-lg border bg-white p-5">
            <h2>Message history</h2>
            {loading ? <p role="status">Loading messages…</p> : loadError ? null : !messages.length ? <p>No messages saved yet.</p> :
              messages.map((record) => <article className="border-b py-3" key={record.id}>
                <h3>{record.subject}</h3><p>{record.recipientName} · {record.recipientEmail}</p>
                <p>{record.status}{record.deliveryEvent ? " · " + record.deliveryEvent : ""} · {new Date(record.updatedAt).toLocaleString()}</p>
                <Button variant="outline" disabled={isSaving} onClick={() => open(record)}>Open message</Button>
              </article>)}
            <div className="mt-4 flex gap-3">
              <Button variant="outline" disabled={loading || isSaving || historyPage === 1}
                onClick={() => { setLoading(true); setHistoryPage((value) => value - 1); }}>Previous</Button>
              <span>Page {historyPage}</span>
              <Button variant="outline" disabled={loading || isSaving || !!loadError || !moreHistory}
                onClick={() => { setLoading(true); setHistoryPage((value) => value + 1); }}>Next</Button>
              <Button variant="outline" disabled={isSaving || loading} onClick={refresh}>Refresh</Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
