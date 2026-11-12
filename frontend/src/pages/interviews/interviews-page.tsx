import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { hrRequest } from "@/data/hr-api";
import "./interviews-page.css";

type Interview = {
  id: string;
  applicationId: string;
  candidateName: string;
  email: string;
  jobTitle: string;
  startsAt: string;
  endsAt: string;
  interviewer: string;
  meetingUrl: string;
  location: string;
  notes: string;
  status: string;
  version: number;
};
type Application = {
  id: string;
  fullName: string;
  jobTitle: string;
  stage: string;
};
const localTime = (value: string) =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(new Date(value))
    .replace(" ", "T");
const displayTime = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kathmandu",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export function InterviewsPage() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [applicationPage, setApplicationPage] = useState(1);
  const [moreApplications, setMoreApplications] = useState(false);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);
  const [date, setDate] = useState("");
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState<Interview | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const busy = useRef(false);
  const createId = useRef(crypto.randomUUID());
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    void Promise.all([
      hrRequest(`interviews?page=${page}${date ? "&date=" + date : ""}`, {
        signal: controller.signal,
      }),
      hrRequest("applications?page=" + applicationPage, {
        signal: controller.signal,
      }),
    ])
      .then(([schedule, applicants]) => {
        if (!controller.signal.aborted) {
          setInterviews(schedule.interviews);
          setMore(schedule.hasMore);
          setApplications(applicants.applications);
          setMoreApplications(applicants.hasMore);
          setError("");
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [page, date, revision, applicationPage]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    const data = new FormData(event.currentTarget);
    const fields = {
      startsAt: new Date(data.get("startsAt") + ":00+05:45").toISOString(),
      endsAt: new Date(data.get("endsAt") + ":00+05:45").toISOString(),
      interviewer: data.get("interviewer"),
      meetingUrl: data.get("meetingUrl"),
      location: data.get("location"),
      notes: data.get("notes"),
    };
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      await hrRequest("interviews" + (editing ? "/" + editing.id : ""), {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(
          editing
            ? { ...fields, expectedVersion: editing.version }
            : {
                ...fields,
                id: createId.current,
                applicationId: data.get("applicationId"),
              },
        ),
      });
      createId.current = crypto.randomUUID();
      setShowForm(false);
      setEditing(null);
      setRevision((v) => v + 1);
      setNotice(
        "Interview saved. Prepare a notification to inform the candidate.",
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not save interview.",
      );
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  async function action(record: Interview, action: string) {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      const result = await hrRequest(
        `interviews/${record.id}/${action === "notification" ? action : "status"}`,
        {
          method: "POST",
          body: JSON.stringify({
            expectedVersion: record.version,
            ...(action === "notification" ? {} : { status: action }),
          }),
        },
      );
      if (action === "notification")
        navigate("/communication?message=" + result.messageId);
      else {
        setRevision((v) => v + 1);
        setNotice(
          "Status saved. Cancellation notifications must be prepared and sent separately.",
        );
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not update interview.",
      );
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  return (
    <div className="page-interviews-interviews-page">
      <div className="page-stack">
        <header className="page-heading">
          <div>
            <h1>Interview Management</h1>
            <p>
              Schedule in Nepal time (Asia/Kathmandu). Paste a meeting link or
              enter a physical location.
            </p>
          </div>
          <Button
            disabled={saving}
            onClick={() => {
              setEditing(null);
              setShowForm(true);
              createId.current = crypto.randomUUID();
            }}
          >
            Schedule interview
          </Button>
        </header>
        {error && <p role="alert">{error}</p>}
        {notice && <p role="status">{notice}</p>}
        {showForm && (
          <form
            key={editing?.id || "new"}
            className="interview-schedule"
            onSubmit={save}
          >
            <fieldset disabled={saving} className="grid gap-3">
              <h2>
                {editing ? "Edit / reschedule interview" : "New interview"}
              </h2>
              {!editing && (
                <>
                  <label htmlFor="interview-application">Application</label>
                  <select
                    className="form-select"
                    id="interview-application"
                    name="applicationId"
                    required
                    defaultValue=""
                  >
                    <option value="">Select application</option>
                    {applications
                      .filter(
                        (a) =>
                          !["Hired", "Rejected", "Withdrawn"].includes(a.stage),
                      )
                      .map((a) => (
                        <option value={a.id} key={a.id}>
                          {a.fullName} · {a.jobTitle}
                        </option>
                      ))}
                  </select>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={applicationPage === 1 || loading}
                      onClick={() => setApplicationPage((p) => p - 1)}
                    >
                      Previous applicants
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!moreApplications || loading}
                      onClick={() => setApplicationPage((p) => p + 1)}
                    >
                      More applicants
                    </Button>
                  </div>
                </>
              )}
              {(
                [
                  [
                    "startsAt",
                    "Start (Nepal time)",
                    "datetime-local",
                    editing ? localTime(editing.startsAt) : "",
                  ],
                  [
                    "endsAt",
                    "End (Nepal time)",
                    "datetime-local",
                    editing ? localTime(editing.endsAt) : "",
                  ],
                  [
                    "interviewer",
                    "Interviewer",
                    "text",
                    editing?.interviewer || "",
                  ],
                  [
                    "meetingUrl",
                    "HTTPS meeting link",
                    "url",
                    editing?.meetingUrl || "",
                  ],
                  [
                    "location",
                    "Physical location",
                    "text",
                    editing?.location || "",
                  ],
                ] as const
              ).map(([name, label, type, value]) => (
                <label key={name}>
                  {label}
                  <Input
                    name={name}
                    type={type}
                    defaultValue={value}
                    required={["startsAt", "endsAt", "interviewer"].includes(
                      name,
                    )}
                    maxLength={name === "meetingUrl" ? 2000 : 500}
                  />
                </label>
              ))}
              <label>
                Internal notes (not included in candidate notifications)
                <Textarea
                  name="notes"
                  defaultValue={editing?.notes}
                  maxLength={5000}
                />
              </label>
              <div className="flex gap-3">
                <Button type="submit">
                  {saving ? "Saving…" : "Save schedule"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Close
                </Button>
              </div>
            </fieldset>
          </form>
        )}
        <div className="flex gap-3">
          <label>
            Filter by Nepal date
            <Input
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <Button
            variant="outline"
            disabled={loading || saving}
            onClick={() => setRevision((v) => v + 1)}
          >
            Reload
          </Button>
        </div>
        {loading ? (
          <p role="status">Loading interviews…</p>
        ) : !interviews.length ? (
          <p>No interviews found.</p>
        ) : (
          interviews.map((record) => (
            <section className="rounded-lg border bg-white p-5" key={record.id}>
              <h2>
                {record.candidateName} · {record.jobTitle}
              </h2>
              <p>
                {record.status} · {displayTime(record.startsAt)} —{" "}
                {displayTime(record.endsAt)} (Nepal)
              </p>
              <p>Interviewer: {record.interviewer}</p>
              {record.meetingUrl && (
                <a
                  className="underline"
                  href={record.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open meeting link
                </a>
              )}
              <p>{record.location}</p>
              <p className="whitespace-pre-line">{record.notes}</p>
              <div className="flex flex-wrap gap-3">
                {record.status === "Scheduled" && (
                  <>
                    <Button
                      disabled={saving}
                      variant="outline"
                      onClick={() => {
                        setEditing(record);
                        setShowForm(true);
                      }}
                    >
                      Edit / reschedule
                    </Button>
                    <Button
                      disabled={saving}
                      variant="outline"
                      onClick={() => void action(record, "Completed")}
                    >
                      Mark completed
                    </Button>
                    <Button
                      disabled={saving}
                      variant="outline"
                      onClick={() => void action(record, "Cancelled")}
                    >
                      Cancel interview
                    </Button>
                  </>
                )}
                {record.status !== "Completed" && (
                  <Button
                    disabled={saving}
                    onClick={() => void action(record, "notification")}
                  >
                    Prepare{" "}
                    {record.status === "Cancelled"
                      ? "cancellation"
                      : "schedule"}{" "}
                    email
                  </Button>
                )}
              </div>
            </section>
          ))
        )}
        <div className="flex gap-3">
          <Button
            disabled={loading || page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span>Page {page}</span>
          <Button
            disabled={loading || !more}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
