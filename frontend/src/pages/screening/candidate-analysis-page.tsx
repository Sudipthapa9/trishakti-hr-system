import { Link } from "react-router-dom";
import { PageHeader } from "@/components/Layout/page-header";
import { DataState } from "@/components/shared/feedback/data-state";
import { Button } from "@/components/ui/button";

export function CandidateAnalysisPage() {
  return (
    <div className="page-stack">
      <PageHeader
        title="Candidate Analysis"
        description="Results require a processed CV and saved screening output."
      />
      <DataState kind="empty">
        No saved analysis is available. CV screening integration is pending.
      </DataState>
      <Button asChild variant="outline" className="w-fit">
        <Link to="/screening">Back to Screening</Link>
      </Button>
    </div>
  );
}
