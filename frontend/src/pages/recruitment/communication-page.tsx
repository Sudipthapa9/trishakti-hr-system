import { PaginationControls } from "@/components/shared/navigation/pagination-controls";
import { Card } from "@/components/ui/card";
import { FeedbackMessage } from "@/components/shared/feedback/feedback-message";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import "./communication-page.css";
import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Mail,
  CalendarDays,
  CircleX,
  Send,
  CircleCheck,
  Plus,
  RotateCcw,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  communicationRequest,
  CommunicationError,
  type MessageRecord,
} from "@/data/communications-api";

type Recipient = {
  id: string;
  fullName: string;
  email: string;
  jobTitle: string;
};
const templates = {
  "Application acknowledgement":
    "Hi {{candidate_name}},\n\nThank you for applying for {{job_title}}. Our HR team will review your application.\n\nBest regards,\nTrishakti HR",
  "Interview invitation":
    "Hi {{candidate_name}},\n\nWe would like to discuss your application for {{job_title}}. Please reply with your availability.\n\nBest regards,\nTrishakti HR",
  "Selection notification":
    "Dear {{candidate_name}},\n\nYour application for {{job_title}} has been shortlisted. Our team will contact you about the next steps.\n\nBest regards,\nThe Trishakti Recruitment Team",
  "Rejection notice":
    "Hi {{candidate_name}},\n\nThank you for your interest in {{job_title}}. We will not be progressing this application at this time.\n\nBest regards,\nTrishakti HR",
  "Offer communication":
    "Hi {{candidate_name}},\n\nWe would like to discuss an offer for {{job_title}}. Please contact our HR team for details.\n\nBest regards,\nTrishakti HR",
};

function relativeTime(value: string) {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 60000),
  );
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
}

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
  const [selectedTemplate, setSelectedTemplate] = useState<
    keyof typeof templates | null
  >(null);
  const [isSaving, setIsSaving] = useState(false);
  const bodyInput = useRef<HTMLTextAreaElement>(null);
  const caretFrame = useRef<number | null>(null);
  function cancelCaretRestore() {
    if (caretFrame.current !== null) cancelAnimationFrame(caretFrame.current);
    caretFrame.current = null;
  }
  useEffect(
    () => () => {
      if (caretFrame.current !== null) cancelAnimationFrame(caretFrame.current);
    },
    [],
  );
  const busy = useRef(false);
  const draftId = useRef<string | null>(null);
  const openedId = useRef<string | null>(searchParams.get("message"));
  const initialMessageLoaded = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const [applications, history] = await Promise.all([
          communicationRequest("applications?page=" + recipientPage, {
            signal: controller.signal,
          }),
          communicationRequest("communications?page=" + historyPage, {
            signal: controller.signal,
          }),
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
          const saved = await communicationRequest("communications/" + id, {
            signal: controller.signal,
          });
          if (!controller.signal.aborted && openedId.current === id) {
            if (
              !initialMessageLoaded.current &&
              searchParams.get("message") === id
            ) {
              setSubject(saved.message.subject);
              setBody(saved.message.body);
              setApplicationId(saved.message.applicationId);
              initialMessageLoaded.current = true;
            }
            setCurrent((previous) => {
              if (!previous && openedId.current === id) return saved.message;
              if (!previous || previous.id !== id) return previous;
              // Keep the original edit version until HR explicitly reloads an editable draft.
              if (
                previous.status === "Sending" ||
                previous.status === "Unknown" ||
                ["Sending", "Unknown", "Accepted"].includes(
                  saved.message.status,
                )
              )
                return saved.message;
              return previous;
            });
          }
        }
      } catch (error) {
        if (!controller.signal.aborted)
          setLoadError(
            error instanceof Error
              ? error.message
              : "Could not load communication.",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [recipientPage, historyPage, revision, searchParams]);

  function refresh() {
    setLoading(true);
    setRevision((value) => value + 1);
  }
  function newMessage() {
    cancelCaretRestore();
    setSelectedTemplate(null);
    setCurrent(null);
    openedId.current = null;
    draftId.current = null;
    setSubject("");
    setBody("");
    setApplicationId("");
    setError(null);
    setNotice("");
  }
  function open(record: MessageRecord) {
    cancelCaretRestore();
    setSelectedTemplate(null);
    setCurrent(record);
    openedId.current = record.id;
    draftId.current = record.id;
    setApplicationId(record.applicationId);
    setSubject(record.subject);
    setBody(record.body);
    setError(null);
    setNotice("");
  }
  function chooseTemplate(name: keyof typeof templates) {
    const recipient = recipients.find((entry) => entry.id === applicationId);
    if (!recipient || busy.current || current) return;
    setSelectedTemplate(name);
    draftId.current = null;
    setSubject(name + " — " + recipient.jobTitle);
    setBody(
      templates[name]
        .replaceAll("{{candidate_name}}", recipient.fullName)
        .replaceAll("{{job_title}}", recipient.jobTitle),
    );
  }
  async function save(send: boolean) {
    if (busy.current) return;
    if (!applicationId || !subject.trim() || !body.trim()) {
      setError("Select an application and complete the subject and message.");
      return;
    }
    busy.current = true;
    setIsSaving(true);
    setError(null);
    setNotice("");
    try {
      let saved = current;
      // A send retry for a saved immutable record must never create another draft.
      if (!saved) {
        draftId.current ??= crypto.randomUUID();
        const data = await communicationRequest("communications", {
          method: "POST",
          body: JSON.stringify({
            id: draftId.current,
            applicationId,
            subject,
            body,
          }),
        });
        saved = data.message as MessageRecord;
      } else if (
        saved.subject !== subject.trim() ||
        saved.body !== body.trim() ||
        (!send && saved.status === "Failed")
      ) {
        const data = await communicationRequest("communications/" + saved.id, {
          method: "PATCH",
          body: JSON.stringify({
            subject,
            body,
            expectedVersion: saved.version,
          }),
        });
        saved = data.message as MessageRecord;
      }
      setCurrent(saved);
      openedId.current = saved.id;
      if (send) {
        setCurrent({ ...saved, status: "Sending" });
        const data = await communicationRequest(
          "communications/" + saved.id + "/send",
          {
            method: "POST",
            body: JSON.stringify({ expectedVersion: saved.version }),
          },
        );
        setCurrent(data.message);
        setNotice("Accepted by Brevo. Delivery confirmation is pending.");
      } else {
        setNotice("Draft saved.");
      }
      refresh();
    } catch (error) {
      if (error instanceof CommunicationError && error.record)
        setCurrent(error.record);
      setError(
        error instanceof Error
          ? error.message
          : "Could not save or send this message.",
      );
      refresh();
    } finally {
      busy.current = false;
      setIsSaving(false);
    }
  }
  const editable =
    !current ||
    (!current.offerId &&
      !current.interviewId &&
      (current.status === "Draft" || current.status === "Failed"));
  async function checkDelivery() {
    if (!current || busy.current) return;
    busy.current = true;
    setIsSaving(true);
    setError(null);
    try {
      const result = await communicationRequest(
        `communications/${current.id}/delivery`,
        { method: "POST" },
      );
      setCurrent(result.message);
      setNotice(
        result.message.deliveryEvent
          ? "Delivery events refreshed."
          : "No delivery or bounce event found in the last 90 days.",
      );
      refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not check delivery.",
      );
    } finally {
      busy.current = false;
      setIsSaving(false);
    }
  }

  return (
    <div className="page-recruitment-communication-page">
      <div className="page-stack">
        {loadError && (
          <div role="alert">
            <p>{loadError}</p>
            <Button onClick={refresh}>Reload</Button>
          </div>
        )}
        {error && <FeedbackMessage role="alert">{error}</FeedbackMessage>}
        {notice && <FeedbackMessage role="status">{notice}</FeedbackMessage>}
        <div className="communication-layout">
          <Card asChild className="gap-4 py-0 ring-0">
            <section className="communication-composer rounded-lg border bg-white p-5">
              <header className="communication-composer-header">
                <h2>Compose Message {current && " / " + current.status}</h2>
                <div className="communication-composer-actions">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSaving || !editable}
                    onClick={() => void save(false)}
                  >
                    {isSaving ? "Working..." : "Save Draft"}
                  </Button>
                  <Button
                    type="submit"
                    form="communication-compose-form"
                    size="sm"
                    disabled={isSaving || !editable}
                  >
                    <Send aria-hidden="true" />{" "}
                    {isSaving ? "Working..." : "Send Email"}
                  </Button>
                </div>
              </header>
              <form
                id="communication-compose-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  void save(true);
                }}
              >
                <fieldset
                  disabled={isSaving || !editable}
                  className="communication-fields"
                >
                  <div className="communication-field-row">
                    <Label htmlFor="message-application">To:</Label>
                    <NativeSelect
                      className="form-select"
                      id="message-application"
                      value={applicationId}
                      required
                      disabled={!!current || loading}
                      onChange={(event) => {
                        setSelectedTemplate(null);
                        setApplicationId(event.target.value);
                        draftId.current = null;
                      }}
                    >
                      <option value="">Select an application</option>
                      {current &&
                        !recipients.some(
                          (entry) => entry.id === current.applicationId,
                        ) && (
                          <option value={current.applicationId}>
                            {current.recipientName} · {current.recipientEmail}
                          </option>
                        )}
                      {recipients.map((recipient) => (
                        <option key={recipient.id} value={recipient.id}>
                          {recipient.fullName} · {recipient.jobTitle} ·{" "}
                          {recipient.email}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                  {!current && (
                    <div className="communication-recipient-pages">
                      <PaginationControls
                        label="Application selection pages"
                        previousLabel="Previous applicants"
                        nextLabel="More applicants"
                        previousDisabled={loading || recipientPage === 1}
                        nextDisabled={loading || !moreRecipients}
                        onPrevious={() => {
                          setLoading(true);
                          setSelectedTemplate(null);
                          draftId.current = null;
                          setApplicationId("");
                          setRecipientPage((value) => value - 1);
                        }}
                        onNext={() => {
                          setLoading(true);
                          setSelectedTemplate(null);
                          draftId.current = null;
                          setApplicationId("");
                          setRecipientPage((value) => value + 1);
                        }}
                      ></PaginationControls>
                    </div>
                  )}
                  <div className="communication-field-row">
                    <Label htmlFor="message-subject">Subject:</Label>
                    <Input
                      id="message-subject"
                      value={subject}
                      maxLength={200}
                      required
                      onChange={(event) => {
                        setSelectedTemplate(null);
                        setSubject(event.target.value);
                        if (!current) draftId.current = null;
                      }}
                    />
                  </div>
                  <Label className="sr-only" htmlFor="message-body">
                    Message
                  </Label>
                  <div className="communication-editor-toolbar">
                    <NativeSelect
                      aria-label="Insert variable"
                      defaultValue=""
                      disabled={
                        !applicationId ||
                        !editable ||
                        isSaving ||
                        !recipients.some((entry) => entry.id === applicationId)
                      }
                      onChange={(event) => {
                        const recipient = recipients.find(
                          (entry) => entry.id === applicationId,
                        );
                        const value =
                          event.target.value === "candidate"
                            ? recipient?.fullName
                            : recipient?.jobTitle;
                        if (value) {
                          const input = bodyInput.current;
                          const start = input?.selectionStart ?? body.length;
                          const end = input?.selectionEnd ?? start;
                          const nextBody =
                            body.slice(0, start) + value + body.slice(end);
                          if (nextBody.length <= 10000) {
                            setBody(nextBody);
                            setSelectedTemplate(null);
                            if (!current) draftId.current = null;
                            cancelCaretRestore();
                            caretFrame.current = requestAnimationFrame(() => {
                              caretFrame.current = null;
                              if (
                                !input?.isConnected ||
                                input !== bodyInput.current
                              )
                                return;
                              input.focus();
                              input.setSelectionRange(
                                start + value.length,
                                start + value.length,
                              );
                            });
                          }
                        }
                        event.target.value = "";
                      }}
                    >
                      <option value="" disabled>
                        Insert Variable
                      </option>
                      <option value="candidate">Candidate name</option>
                      <option value="job">Job title</option>
                    </NativeSelect>
                  </div>
                  <Textarea
                    ref={bodyInput}
                    id="message-body"
                    className="communication-body"
                    value={body}
                    maxLength={10000}
                    required
                    onChange={(event) => {
                      setSelectedTemplate(null);
                      setBody(event.target.value);
                      if (!current) draftId.current = null;
                    }}
                  />
                </fieldset>
              </form>
              {current?.offerId && (
                <Link className="underline" to={"/offers/" + current.offerId}>
                  Manage this message from its saved offer
                </Link>
              )}
              {current?.interviewId && (
                <div className="grid gap-3">
                  <Link to="/interviews">View saved interview</Link>
                  <p>
                    This notification uses the saved schedule. Rescheduled or
                    cancelled interviews require a new notification.
                  </p>
                  {["Draft", "Failed"].includes(current.status) && (
                    <Button disabled={isSaving} onClick={() => void save(true)}>
                      Send saved interview notification
                    </Button>
                  )}
                </div>
              )}
              {current?.status === "Accepted" && (
                <section className="mt-4">
                  <p>
                    Delivery: {current.deliveryEvent || "Not confirmed"}
                    {current.deliveryEventAt &&
                      " · " +
                        new Date(current.deliveryEventAt).toLocaleString()}
                  </p>
                  <Button
                    variant="outline"
                    disabled={isSaving}
                    onClick={() => void checkDelivery()}
                  >
                    Check delivery with Brevo
                  </Button>
                  <p>
                    Checks the last 90 days; absence of an event does not mean
                    delivery failed.
                  </p>
                </section>
              )}
              {current?.lastError && <p>{current.lastError}</p>}
              {current?.status === "Sending" && (
                <p>
                  Send is in progress or needs confirmation. Check Brevo logs
                  before creating another message.
                </p>
              )}
              {current?.status === "Unknown" && (
                <p>
                  The send outcome is uncertain. Check Brevo logs before
                  creating another message.
                </p>
              )}
            </section>
          </Card>
          <aside
            className="communication-sidebar"
            aria-label="Templates and message history"
          >
            <Card asChild className="gap-0 py-0 ring-0">
              <section className="communication-templates rounded-lg border bg-white">
                <header className="communication-sidebar-heading">
                  <h2>Email Templates</h2>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Compose a new message"
                    title="New message"
                    disabled={isSaving}
                    onClick={newMessage}
                  >
                    <Plus aria-hidden="true" />
                  </Button>
                </header>
                <div className="communication-template-list">
                  {(Object.keys(templates) as (keyof typeof templates)[]).map(
                    (name) => {
                      const Icon =
                        name === "Interview invitation"
                          ? CalendarDays
                          : name === "Selection notification"
                            ? CircleCheck
                            : name === "Rejection notice"
                              ? CircleX
                              : name === "Offer communication"
                                ? Send
                                : Mail;
                      return (
                        <Button
                          key={name}
                          type="button"
                          variant="ghost"
                          className="communication-template-button"
                          aria-pressed={selectedTemplate === name}
                          disabled={
                            !applicationId || !!current || isSaving || loading
                          }
                          onClick={() => chooseTemplate(name)}
                        >
                          <Icon aria-hidden="true" />
                          {name.replace(/\b\w/g, (letter) =>
                            letter.toUpperCase(),
                          )}
                        </Button>
                      );
                    },
                  )}
                </div>
                {!applicationId && (
                  <p className="communication-template-hint">
                    Select an application to use a template.
                  </p>
                )}
              </section>
            </Card>
            <Card asChild className="gap-4 py-0 ring-0">
              <section className="communication-history rounded-lg border bg-white p-5">
                <h2>Recent History</h2>
                {loading ? (
                  <FeedbackMessage role="status">
                    Loading messages…
                  </FeedbackMessage>
                ) : loadError ? null : !messages.length ? (
                  <p>No messages saved yet.</p>
                ) : (
                  messages.map((record) => (
                    <article key={record.id}>
                      <button
                        type="button"
                        className="communication-history-entry"
                        disabled={isSaving}
                        aria-pressed={current?.id === record.id}
                        onClick={() => open(record)}
                        title={record.subject + " / " + record.recipientEmail}
                      >
                        <span className="communication-history-top">
                          <strong>{record.recipientName}</strong>
                          <time
                            dateTime={record.updatedAt}
                            title={new Date(record.updatedAt).toLocaleString()}
                          >
                            {relativeTime(record.updatedAt)}
                          </time>
                        </span>
                        <span className="communication-history-subject">
                          {record.subject}
                        </span>
                        <span
                          className="communication-history-status"
                          data-status={record.status}
                        >
                          {record.deliveryEvent ||
                            (record.status === "Accepted"
                              ? "Submitted"
                              : record.status)}
                        </span>
                      </button>
                    </article>
                  ))
                )}
                <div className="communication-history-pagination">
                  <PaginationControls
                    label="Message history pages"
                    previousLabel="Previous"
                    nextLabel="Next"
                    previousDisabled={loading || isSaving || historyPage === 1}
                    nextDisabled={
                      loading || isSaving || !!loadError || !moreHistory
                    }
                    onPrevious={() => {
                      setLoading(true);
                      setHistoryPage((value) => value - 1);
                    }}
                    onNext={() => {
                      setLoading(true);
                      setHistoryPage((value) => value + 1);
                    }}
                  >
                    <span>Page {historyPage}</span>
                  </PaginationControls>

                  <Button
                    variant="outline"
                    disabled={isSaving || loading}
                    onClick={refresh}
                  >
                    <RotateCcw aria-hidden="true" /> Refresh
                  </Button>
                </div>
              </section>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
