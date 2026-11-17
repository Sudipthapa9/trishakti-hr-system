import { Link } from "react-router-dom";
import { ScanSearch } from "lucide-react";
import { PageHeader } from "@/components/Layout/page-header";
import { Button } from "@/components/ui/button";
import "./screening-ranking-page.css";

export function ScreeningRankingPage() {
  return (
    <div className="page-stack page-screening-screening-ranking-page">
      <PageHeader
        title="CV Screening"
        description="Review screening results once CV processing is connected."
      />
      <section className="screening-empty">
        <ScanSearch aria-hidden="true" />
        <h2>No screening results yet</h2>
        <p>
          CV screening is not connected to applications yet. Candidate rankings
          and match scores will appear here after processing is available.
        </p>
        <Button asChild variant="outline">
          <Link to="/applications">Review Applications</Link>
        </Button>
      </section>
    </div>
  );
}
