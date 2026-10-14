import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Candidate, CandidateStage } from "@/types/hr";

type CandidateTableProps = {
  candidates: Candidate[];
  onStageChange?: (candidateId: string, stage: CandidateStage) => void;
};

function getStageVariant(stage: CandidateStage) {
  if (stage === "Shortlisted") return "success";
  if (stage === "Interview") return "warning";
  if (stage === "Review") return "neutral";
  return "default";
}

export function CandidateTable({ candidates, onStageChange }: CandidateTableProps) {
  if (candidates.length === 0) {
    return <p className="empty-message">No candidates match your search.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Candidate</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Match</TableHead>
          <TableHead>Stage</TableHead>
          {onStageChange ? <TableHead>Update stage</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {candidates.map((candidate) => (
          <TableRow key={candidate.id}>
            <TableCell>
              <div className="candidate-name">
                <span className="candidate-initials" aria-hidden="true">
                  {candidate.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </span>
                <span>
                  <strong>{candidate.name}</strong>
                  <small>{candidate.updated}</small>
                </span>
              </div>
            </TableCell>
            <TableCell>{candidate.role}</TableCell>
            <TableCell>
              <span className="font-semibold">{candidate.score}%</span>
            </TableCell>
            <TableCell>
              <Badge variant={getStageVariant(candidate.stage)}>{candidate.stage}</Badge>
            </TableCell>
            {onStageChange ? (
              <TableCell>
                <label className="sr-only" htmlFor={`stage-${candidate.id}`}>
                  Update stage for {candidate.name}
                </label>
                <select
                  id={`stage-${candidate.id}`}
                  className="form-select"
                  value={candidate.stage}
                  onChange={(event) => {
                    const nextStage = event.target.value;
                    if (
                      nextStage === "Review" ||
                      nextStage === "Shortlisted" ||
                      nextStage === "Interview" ||
                      nextStage === "Offer"
                    ) {
                      onStageChange(candidate.id, nextStage);
                    }
                  }}
                >
                  <option>Review</option>
                  <option>Shortlisted</option>
                  <option>Interview</option>
                  <option>Offer</option>
                </select>
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
