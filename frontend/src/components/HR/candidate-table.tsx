/**
 * Displays candidate rows and optional stage controls; parent callbacks own updates to shared state.
 */
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

// Define CandidateTableProps so callers and implementations agree on the required data shape.
type CandidateTableProps = {
  candidates: Candidate[];
  onStageChange?: (candidateId: string, stage: CandidateStage) => void;
};

// Map business stages to visual badge tones without changing the stored stage.
function getStageVariant(stage: CandidateStage) {
  if (stage === "Shortlisted") return "success";
  if (stage === "Screening") return "warning";
  if (stage === "Interview") return "neutral";
  if (stage === "Review") return "neutral";
  return "default";
}

// Displays candidate rows and optional stage controls; parent callbacks own updates to shared state.
export function CandidateTable({
  candidates,
  onStageChange,
}: CandidateTableProps) {
  if (candidates.length === 0) {
    return <p className="empty-message">No candidates match your search.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Candidate</TableHead>
          <TableHead>Position</TableHead>
          <TableHead>AI Match</TableHead>
          <TableHead>Status</TableHead>
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
              <span className="candidate-match-score">{candidate.score}%</span>
            </TableCell>
            <TableCell>
              <Badge variant={getStageVariant(candidate.stage)}>
                {candidate.stage}
              </Badge>
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
                      nextStage === "Screening" ||
                      nextStage === "Shortlisted" ||
                      nextStage === "Interview" ||
                      nextStage === "Offer"
                    ) {
                      onStageChange(candidate.id, nextStage);
                    }
                  }}
                >
                  <option>Review</option>
                  <option>Screening</option>
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
