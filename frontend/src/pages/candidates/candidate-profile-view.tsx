import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  Download,
  FileText,
  Mail,
  Phone,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/data-display/status-badge";
import { FeedbackMessage } from "@/components/shared/feedback/feedback-message";
import { DetailList } from "@/components/shared/data-display/detail-list";
import { downloadApplicationResume } from "@/data/applications-api";
import type { CandidateDetail, CandidateProfile } from "@/data/candidates-api";
import type { ApplicationStage } from "@/data/application-stages";
import { ApplicationStageControl } from "./application-stage-control";
import { CandidateProfileEditor } from "./candidate-profile-editor";

const dates = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kathmandu",
});
export function CandidateProfileView({
  candidate,
  onProfileSaved,
  onStageSaved,
}: {
  candidate: CandidateDetail;
  onProfileSaved: (profile: CandidateProfile) => void;
  onStageSaved: (id: string, stage: ApplicationStage) => void;
}) {
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState("");
  const downloading = useRef(false);
  const initials = candidate.fullName
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  async function download(id: string) {
    if (downloading.current) return;
    downloading.current = true;
    setDownloadId(id);
    setDownloadError("");
    try {
      const blob = await downloadApplicationResume(id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download =
        "candidate-resume" + (blob.type.includes("pdf") ? ".pdf" : ".docx");
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setDownloadError(
        error instanceof Error ? error.message : "Could not download CV.",
      );
    } finally {
      downloading.current = false;
      setDownloadId(null);
    }
  }
  return (
    <>
      <Link className="candidate-back-link" to="/candidates">
        <ArrowLeft aria-hidden="true" />
        Back to Candidates
      </Link>
      <header className="candidate-profile-heading">
        <div>
          <p>Candidate Profile</p>
          <h1>{candidate.fullName}</h1>
          <span>Review profile details and manage each job application.</span>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/applications">
            All Applications <ArrowUpRight aria-hidden="true" />
          </Link>
        </Button>
      </header>
      <div className="candidate-profile-layout">
        <aside className="candidate-profile-sidebar">
          <section className="candidate-identity-panel">
            <Avatar className="candidate-profile-avatar">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <h2>{candidate.fullName}</h2>
            <p className="candidate-profile-type">Candidate</p>
            <div className="candidate-contact">
              <a href={"mailto:" + candidate.email}>
                <Mail aria-hidden="true" />
                {candidate.email}
              </a>
              <p>
                <Phone aria-hidden="true" />
                {candidate.phone || "Not provided"}
              </p>
            </div>
            <div className="candidate-profile-meta">
              <p>
                <CalendarDays aria-hidden="true" />
                Added {dates.format(new Date(candidate.createdAt))}
              </p>
              <p>
                <BriefcaseBusiness aria-hidden="true" />
                {candidate.applications.length}{" "}
                {candidate.applications.length === 1
                  ? "application"
                  : "applications"}
              </p>
            </div>
          </section>
          <section className="candidate-edit-panel">
            <h2>Profile Information</h2>
            <p>
              Update the candidate's name and phone. Submitted applications keep
              their original details.
            </p>
            <CandidateProfileEditor
              candidate={candidate}
              onSaved={onProfileSaved}
            />
          </section>
        </aside>
        <section className="candidate-applications-panel">
          <header>
            <div>
              <h2>Job Applications</h2>
              <p>Stages are tracked separately for each position.</p>
            </div>
            <span>{candidate.applications.length} total</span>
          </header>
          {downloadError && (
            <FeedbackMessage role="alert">{downloadError}</FeedbackMessage>
          )}
          {downloadId && (
            <FeedbackMessage role="status">Downloading CV...</FeedbackMessage>
          )}
          {!candidate.applications.length ? (
            <div className="candidate-applications-empty">
              <FileText aria-hidden="true" />
              <h3>No applications yet</h3>
              <p>This candidate has no submitted applications.</p>
            </div>
          ) : (
            candidate.applications.map((application) => (
              <article
                className="candidate-application-card"
                key={application.id}
              >
                <header>
                  <div className="candidate-application-position">
                    <span>
                      <BriefcaseBusiness aria-hidden="true" />
                    </span>
                    <div>
                      <h3>{application.jobTitle}</h3>
                      <p>
                        Submitted{" "}
                        {dates.format(new Date(application.createdAt))} (Nepal)
                      </p>
                    </div>
                  </div>
                  <StatusBadge domain="application" status={application.stage}>
                    {application.stage === "Review"
                      ? "Applied"
                      : application.stage}
                  </StatusBadge>
                </header>
                <div className="candidate-application-meta">
                  <StatusBadge domain="job" status={application.jobStatus} />
                  <span>Job status</span>
                  <span className="candidate-cv-received">
                    <FileText aria-hidden="true" />
                    {application.hasResume ? "CV attached" : "No CV available"}
                  </span>
                </div>
                <section className="candidate-stage-panel">
                  <ApplicationStageControl
                    id={application.id}
                    stage={application.stage}
                    onSaved={(stage) => onStageSaved(application.id, stage)}
                  />
                </section>
                <details className="candidate-submission-details">
                  <summary>
                    Submitted contact details &amp; cover letter
                  </summary>
                  <DetailList
                    items={[
                      ["Name", application.fullName],
                      ["Email", application.email],
                      ["Phone", application.phone],
                      ["Reference", `TSH-${application.id}`],
                    ]}
                  />
                  <h4>Cover Letter</h4>
                  <p>
                    {application.coverLetter || "No cover letter provided."}
                  </p>
                </details>
                <footer>
                  <span>Reference TSH-{application.id}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!application.hasResume || downloadId !== null}
                    onClick={() => void download(application.id)}
                  >
                    <Download aria-hidden="true" />
                    {downloadId === application.id
                      ? "Downloading..."
                      : "Download CV"}
                  </Button>
                </footer>
              </article>
            ))
          )}
        </section>
      </div>
    </>
  );
}
