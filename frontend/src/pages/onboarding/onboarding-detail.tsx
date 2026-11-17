import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  FileCheck,
  Landmark,
  Monitor,
  Users,
} from "lucide-react";
import { ProfileSummary } from "@/components/shared/data-display/profile-summary";
import { DetailList } from "@/components/shared/data-display/detail-list";
import { StatusBadge } from "@/components/shared/data-display/status-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { FeedbackMessage } from "@/components/shared/feedback/feedback-message";
import type { Checklist, OnboardingRecord } from "@/data/onboarding-api";
import { OnboardingDocuments } from "./onboarding-documents";

const actions = [
  {
    key: "documents",
    label: "Documents verified",
    description: "Review the candidate's submitted documents.",
    icon: FileCheck,
  },
  {
    key: "payroll",
    label: "Bank & Payroll Setup",
    description: "Confirm bank details and payroll preparation.",
    icon: Landmark,
  },
  {
    key: "accounts",
    label: "Work Accounts Prepared",
    description: "Verify the candidate's work account setup.",
    icon: Monitor,
  },
  {
    key: "orientation",
    label: "Orientation Completed",
    description: "Confirm the candidate's orientation.",
    icon: Users,
  },
] as const;
const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
export function OnboardingDetail({
  record,
  saving,
  uncertain,
  onToggle,
  onFinish,
  onReload,
}: {
  record: OnboardingRecord;
  saving: boolean;
  uncertain: boolean;
  onToggle: (key: keyof Checklist) => void;
  onFinish: () => void;
  onReload: () => void;
}) {
  const completed = actions.filter(({ key }) => record.checklist[key]).length;
  const finished = Boolean(record.completedAt);
  return (
    <>
      <Link className="onboarding-back-link" to="/onboarding">
        <ArrowLeft aria-hidden="true" /> All onboarding records
      </Link>
      <header className="onboarding-heading">
        <div>
          <h1>Onboarding: {record.candidateName}</h1>
          <div className="onboarding-heading-meta">
            <StatusBadge
              domain="onboarding"
              status={finished ? "Completed" : "In progress"}
            >
              {finished
                ? "Completed"
                : `In Progress (${Math.round((completed / 4) * 100)}%)`}
            </StatusBadge>
            <span>
              <CalendarDays aria-hidden="true" /> Joining:{" "}
              {dateFormat.format(new Date(record.joiningDate + "T00:00:00Z"))}
            </span>
          </div>
        </div>
        <div className="onboarding-heading-actions">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={saving}
            onClick={onReload}
          >
            Reload
          </Button>
          {finished && record.employeeId ? (
            <Button asChild size="sm">
              <Link to={"/employees/" + record.employeeId}>
                View Employee Record
              </Link>
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              disabled={saving || uncertain || completed !== 4 || finished}
              onClick={onFinish}
            >
              {saving ? "Saving..." : "Approve & Create Record"}
            </Button>
          )}
        </div>
      </header>
      <div className="onboarding-detail-layout">
        <aside className="onboarding-detail-sidebar">
          <section
            className="onboarding-profile"
            aria-label="Candidate profile"
          >
            <ProfileSummary
              name={record.candidateName}
              detail={record.position}
            />
            <DetailList
              items={[
                ["Department", record.department || "Not specified"],
                [
                  "Joining Date",
                  dateFormat.format(
                    new Date(record.joiningDate + "T00:00:00Z"),
                  ),
                ],
                ["Location", record.location || "Not specified"],
                ["Email", record.email],
              ]}
            />
            <Link
              className="onboarding-offer-link"
              to={"/offers/" + record.offerId}
            >
              View Accepted Offer
            </Link>
            <p className="onboarding-profile-note">
              Recruitment details are populated from the accepted offer.
            </p>
          </section>
          <section
            className="onboarding-progress"
            aria-label="Onboarding progress"
          >
            <h2>Onboarding Progress</h2>
            <div className="onboarding-progress-overview">
              <div
                className="onboarding-progress-ring"
                aria-hidden="true"
                style={{
                  background: `conic-gradient(#194e65 ${(completed / 4) * 100}%, #eeeae1 0)`,
                }}
              >
                <span>{completed}/4</span>
              </div>
              <div>
                <p>
                  <strong>{completed} of 4</strong> actions verified
                </p>
                <p>
                  {finished
                    ? "Employee record created"
                    : completed === 4
                      ? "Ready for final approval"
                      : "Verification in progress"}
                </p>
              </div>
            </div>
            <Progress
              value={completed}
              max={4}
              aria-label="Verified onboarding actions"
            />
            <p className="onboarding-progress-note">
              Progress reflects saved HR confirmations.
            </p>
          </section>
        </aside>
        <div className="onboarding-detail-panels">
          <section className="onboarding-checklist">
            <header>
              <h2>Required Actions Checklist</h2>
              <span>{completed} of 4 completed</span>
            </header>
            <fieldset
              disabled={saving || uncertain || finished}
              aria-busy={saving}
            >
              {actions.map(({ key, label, description, icon: Icon }) => (
                <Label className="onboarding-checklist-row" key={key}>
                  <input
                    className="sr-only"
                    type="checkbox"
                    checked={record.checklist[key]}
                    onChange={() => onToggle(key)}
                  />
                  <span
                    className="onboarding-check-indicator"
                    data-checked={record.checklist[key]}
                    aria-hidden="true"
                  >
                    {record.checklist[key] ? <Check /> : <Icon />}
                  </span>
                  <span className="onboarding-task-copy">
                    <strong>{label}</strong>
                    <small>
                      {record.checklist[key] ? "Verified by HR" : description}
                    </small>
                  </span>
                  <Icon className="onboarding-task-icon" aria-hidden="true" />
                </Label>
              ))}
            </fieldset>
            <footer>
              <p>
                {finished
                  ? "This checklist is locked after completion."
                  : "Verify each action before approving the employee record."}
              </p>
              {saving && (
                <FeedbackMessage role="status">
                  Saving changes...
                </FeedbackMessage>
              )}
              {uncertain && (
                <FeedbackMessage role="alert">
                  Reload the saved record before making more changes.
                </FeedbackMessage>
              )}
            </footer>
          </section>
          <OnboardingDocuments onboardingId={record.id} />
          <p className="onboarding-completion-note">
            {finished
              ? `Completed on ${new Date(record.completedAt!).toLocaleString("en-GB", { timeZone: "Asia/Kathmandu" })} (Nepal) by ${record.completedBy}.`
              : "Approval locks the checklist, creates the employee record and marks the application Hired."}
          </p>
        </div>
      </div>
    </>
  );
}
