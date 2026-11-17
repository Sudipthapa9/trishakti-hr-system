import { Link } from "react-router-dom";
import { ArrowUpRight, Download, FileText } from "lucide-react";
import { Person } from "@/components/shared/data-display/person";
import { DetailList } from "@/components/shared/data-display/detail-list";
import { StatusBadge } from "@/components/shared/data-display/status-badge";
import { FeedbackMessage } from "@/components/shared/feedback/feedback-message";
import { Button } from "@/components/ui/button";
import type { ApplicationRecord } from "@/data/applications-api";

export function ApplicationDetails({
  application,
  downloadId,
  downloadError,
  onDownload,
}: {
  application: ApplicationRecord;
  downloadId: string | null;
  downloadError: string | null;
  onDownload: (application: ApplicationRecord) => void;
}) {
  return (
    <div className="application-detail-content">
      <Person name={application.fullName} detail={application.jobTitle} />
      <StatusBadge domain="application" status={application.stage}>
        {application.stage === "Review" ? "Applied" : application.stage}
      </StatusBadge>
      <DetailList
        items={[
          ["Email", application.email],
          ["Phone", application.phone],
          [
            "Submitted (Nepal)",
            new Date(application.createdAt).toLocaleString("en-GB", {
              timeZone: "Asia/Kathmandu",
            }),
          ],
          ["Application reference", `TSH-${application.id}`],
        ]}
      />
      <section className="application-cover-letter">
        <h3>Cover Letter</h3>
        <p>{application.coverLetter || "No cover letter provided."}</p>
      </section>
      <section className="application-document">
        <FileText aria-hidden="true" />
        <div>
          <h3>{application.resumeName || "Resume / CV"}</h3>
          <p>
            {application.hasResume
              ? "Private application document"
              : "No CV available"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={!application.hasResume || downloadId !== null}
          onClick={() => void onDownload(application)}
        >
          <Download aria-hidden="true" />
          {downloadId === application.id ? "Downloading..." : "Download"}
        </Button>
      </section>
      {downloadError && (
        <FeedbackMessage role="alert">{downloadError}</FeedbackMessage>
      )}
      <Button asChild>
        <Link to={"/candidates/" + application.candidateId}>
          Open Candidate Profile <ArrowUpRight aria-hidden="true" />
        </Link>
      </Button>
    </div>
  );
}
