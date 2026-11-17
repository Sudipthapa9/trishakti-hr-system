import { PageHeader } from "@/components/Layout/page-header";
import { StatusBadge } from "@/components/shared/data-display/status-badge";
import { FeedbackMessage } from "@/components/shared/feedback/feedback-message";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { PaginationControls } from "@/components/shared/navigation/pagination-controls";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { hrRequest } from "@/data/hr-api";
import "./interviews-page.css";
import { InterviewCalendar } from "./interview-calendar";
import { Plus, RotateCcw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Person } from "@/components/shared/data-display/person";
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
  const [statuses, setStatuses] = useState([
    "Scheduled",
    "Completed",
    "Cancelled",
  ]);
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState<Interview | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const busy = useRef(false);
  const createId = useRef(crypto.randomUUID());
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    void Promise.all([
      hrRequest(
        `interviews?page=${page}${date ? "&date=" + date : ""}&status=${statuses.join(",")}`,
        {
          signal: controller.signal,
        },
      ),
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
          setLoadError("");
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) setLoadError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [page, date, revision, applicationPage, statuses]);
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
        <PageHeader
          className="page-heading"
          title={<>Interview Management</>}
          description={
            <>Manage and track candidate interviews across all positions.</>
          }
          action={
            <>
              <Button
                disabled={saving}
                onClick={() => {
                  setEditing(null);
                  setShowForm(true);
                  createId.current = crypto.randomUUID();
                }}
              >
                <Plus aria-hidden="true" /> Schedule interview
              </Button>
            </>
          }
        />
        {error && <FeedbackMessage role="alert">{error}</FeedbackMessage>}
        {notice && <FeedbackMessage role="status">{notice}</FeedbackMessage>}
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
                  <Label htmlFor="interview-application">Application</Label>
                  <NativeSelect
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
                  </NativeSelect>
                  <div className="flex gap-3">
                    <PaginationControls
                      label="Interview application selection pages"
                      previousLabel="Previous applicants"
                      nextLabel="More applicants"
                      previousDisabled={applicationPage === 1 || loading}
                      nextDisabled={!moreApplications || loading}
                      onPrevious={() => setApplicationPage((p) => p - 1)}
                      onNext={() => setApplicationPage((p) => p + 1)}
                    />
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
                <Label key={name}>
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
                </Label>
              ))}
              <Label>
                Internal notes (not included in candidate notifications)
                <Textarea
                  name="notes"
                  defaultValue={editing?.notes}
                  maxLength={5000}
                />
              </Label>
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
        <div className="interview-layout">
          <aside aria-label="Interview filters">
            <InterviewCalendar
              value={date}
              disabled={saving}
              onChange={(value) => {
                setDate(value);
                setPage(1);
              }}
            />
            <section className="interview-filters">
              <h2>Quick Filters</h2>
              {["Scheduled", "Completed", "Cancelled"].map((status) => (
                <label key={status}>
                  <input
                    type="checkbox"
                    checked={statuses.includes(status)}
                    disabled={saving}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setStatuses((current) =>
                        checked
                          ? [...current, status]
                          : current.filter((item) => item !== status),
                      );
                      setPage(1);
                    }}
                  />
                  {status}
                </label>
              ))}
            </section>
          </aside>
          <div className="interview-results">
            <div className="interview-results-toolbar">
              <h2>{date ? `Interviews / ${date}` : "All Interviews"}</h2>
              <Button
                variant="outline"
                size="sm"
                disabled={loading || saving}
                onClick={() => setRevision((value) => value + 1)}
              >
                <RotateCcw aria-hidden="true" /> Reload
              </Button>
            </div>
            {loading ? (
              <FeedbackMessage role="status">
                Loading interviews…
              </FeedbackMessage>
            ) : loadError ? (
              <FeedbackMessage role="alert">
                Could not load interviews. Try Reload.
              </FeedbackMessage>
            ) : !interviews.length ? (
              <p className="interview-empty">
                {statuses.length
                  ? "No interviews match the selected filters."
                  : "Select a status to show interviews."}
              </p>
            ) : (
              <section className="interview-table">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Interviewer</TableHead>
                      <TableHead>Status / Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {interviews.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <Person
                            name={record.candidateName}
                            detail={record.email}
                          />
                        </TableCell>

                        <TableCell>{record.jobTitle}</TableCell>

                        <TableCell>
                          <p>{displayTime(record.startsAt)}</p>
                          <small>Until {displayTime(record.endsAt)}</small>
                        </TableCell>

                        <TableCell>{record.interviewer}</TableCell>

                        <TableCell>
                          <StatusBadge
                            domain="interview"
                            status={record.status}
                          />

                          <details className="mt-2">
                            <summary className="cursor-pointer">
                              View details / actions
                            </summary>

                            <div className="mt-3 grid gap-2">
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

                              {record.location && <p>{record.location}</p>}

                              {record.notes && (
                                <p className="whitespace-pre-line">
                                  {record.notes}
                                </p>
                              )}

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
                                    onClick={() =>
                                      void action(record, "Completed")
                                    }
                                  >
                                    Mark completed
                                  </Button>

                                  <Button
                                    disabled={saving}
                                    variant="outline"
                                    onClick={() =>
                                      void action(record, "Cancelled")
                                    }
                                  >
                                    Cancel interview
                                  </Button>
                                </>
                              )}

                              {record.status !== "Completed" && (
                                <Button
                                  disabled={saving}
                                  onClick={() =>
                                    void action(record, "notification")
                                  }
                                >
                                  Prepare{" "}
                                  {record.status === "Cancelled"
                                    ? "cancellation"
                                    : "schedule"}{" "}
                                  email
                                </Button>
                              )}
                            </div>
                          </details>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </section>
            )}
            <div className="flex gap-3">
              <PaginationControls
                previousDisabled={loading || saving || page === 1}
                nextDisabled={loading || saving || Boolean(loadError) || !more}
                onPrevious={() => setPage((p) => p - 1)}
                onNext={() => setPage((p) => p + 1)}
              >
                <span>Page {page}</span>
              </PaginationControls>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
