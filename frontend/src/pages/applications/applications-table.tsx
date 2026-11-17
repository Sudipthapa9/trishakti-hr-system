import { Eye, Download, FileText } from "lucide-react";
import { Person } from "@/components/shared/data-display/person";
import { StatusBadge } from "@/components/shared/data-display/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ApplicationRecord } from "@/data/applications-api";
const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kathmandu",
});
export function ApplicationsTable({
  applications,
  downloadId,
  onDownload,
  onView,
}: {
  applications: ApplicationRecord[];
  downloadId: string | null;
  onDownload: (record: ApplicationRecord) => void;
  onView: (record: ApplicationRecord) => void;
}) {
  return (
    <Table aria-label="Submitted job applications">
      <TableHeader>
        <TableRow>
          <TableHead>Applicant</TableHead>
          <TableHead>Position</TableHead>
          <TableHead>Stage</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead>Resume</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {applications.map((record) => (
          <TableRow key={record.id}>
            <TableCell>
              <button
                type="button"
                className="application-person-button"
                onClick={() => onView(record)}
                aria-label={"Review application from " + record.fullName}
              >
                <Person name={record.fullName} detail={record.email} />
              </button>
            </TableCell>
            <TableCell>
              <span className="application-job-title">{record.jobTitle}</span>
            </TableCell>
            <TableCell>
              <StatusBadge domain="application" status={record.stage}>
                {record.stage === "Review" ? "Applied" : record.stage}
              </StatusBadge>
            </TableCell>
            <TableCell>
              <time dateTime={record.createdAt}>
                {dateFormat.format(new Date(record.createdAt))}
              </time>
              <small className="application-timezone">Nepal time</small>
            </TableCell>
            <TableCell>
              <span
                className={
                  "application-resume-label " +
                  (record.hasResume ? "has-resume" : "")
                }
                title={record.resumeName || undefined}
              >
                <FileText aria-hidden="true" />
                {record.hasResume ? "CV attached" : "Not provided"}
              </span>
            </TableCell>
            <TableCell>
              <div className="application-row-actions">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={!record.hasResume || downloadId !== null}
                  onClick={() => onDownload(record)}
                  aria-label={"Download CV for " + record.fullName}
                  title="Download CV"
                >
                  <Download aria-hidden="true" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView(record)}
                >
                  <Eye aria-hidden="true" />
                  View
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
