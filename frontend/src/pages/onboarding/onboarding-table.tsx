import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Person } from "@/components/shared/data-display/person";
import { StatusBadge } from "@/components/shared/data-display/status-badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OnboardingRecord } from "@/data/onboarding-api";

const joiningDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function OnboardingTable({ records }: { records: OnboardingRecord[] }) {
  return (
    <Table aria-label="Candidate onboarding records">
      <TableHeader>
        <TableRow>
          <TableHead>Candidate</TableHead>
          <TableHead>Position</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Joining Date</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record) => {
          const completed = Object.values(record.checklist).filter(
            Boolean,
          ).length;
          const status = record.completedAt
            ? "Completed"
            : completed === 4
              ? "Ready for approval"
              : "In progress";
          return (
            <TableRow key={record.id}>
              <TableCell>
                <Link
                  className="onboarding-candidate-link"
                  to={"/onboarding/" + record.id}
                >
                  <Person name={record.candidateName} detail={record.email} />
                </Link>
              </TableCell>
              <TableCell>{record.position}</TableCell>
              <TableCell>{record.department || "Not specified"}</TableCell>
              <TableCell>
                <time dateTime={record.joiningDate}>
                  {joiningDate.format(
                    new Date(record.joiningDate + "T00:00:00Z"),
                  )}
                </time>
              </TableCell>
              <TableCell>
                <div className="onboarding-list-progress">
                  <span>{completed}/4 verified</span>
                  <Progress
                    value={completed}
                    max={4}
                    aria-label={
                      record.candidateName +
                      ": " +
                      completed +
                      " of 4 actions verified"
                    }
                  />
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge domain="onboarding" status={status} />
              </TableCell>
              <TableCell className="text-right">
                <Button asChild variant="ghost" size="sm">
                  <Link
                    to={"/onboarding/" + record.id}
                    aria-label={"Open onboarding for " + record.candidateName}
                  >
                    Open <ArrowUpRight aria-hidden="true" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
