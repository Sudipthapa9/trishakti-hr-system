import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { CandidateTable } from "@/components/HR/candidate-table";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Candidate, CandidateStage } from "@/types/hr";

import "../pages.css";

type CandidatesPageProps = {
  candidates: Candidate[];
  onStageChange: (candidateId: string, stage: CandidateStage) => void;
};

export function CandidatesPage({ candidates, onStageChange }: CandidatesPageProps) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("All stages");

  const filteredCandidates = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return candidates.filter((candidate) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [candidate.name, candidate.email, candidate.role, candidate.location]
          .some((value) => value.toLowerCase().includes(normalizedSearch));
      const matchesStage = stageFilter === "All stages" || candidate.stage === stageFilter;

      return matchesSearch && matchesStage;
    });
  }, [candidates, search, stageFilter]);

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <p className="section-label">Recruitment</p>
          <h1>Candidates</h1>
          <p>Review applicants and update their hiring stage.</p>
        </div>
      </div>

      <p className="demo-note">Demo data only. Stage changes stay in this browser session and are not saved to a server.</p>

      <Card>
        <CardContent className="pt-6">
          <div className="search-row">
            <div className="search-field">
              <Search aria-hidden="true" size={16} />
              <Input
                aria-label="Search candidates"
                placeholder="Search by name, email, role, or location"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <label>
              <span className="sr-only">Filter by stage</span>
              <select className="form-select" value={stageFilter} onChange={(event) => setStageFilter(event.target.value)}>
                <option>All stages</option>
                <option>Review</option>
                <option>Shortlisted</option>
                <option>Interview</option>
                <option>Offer</option>
              </select>
            </label>
          </div>

          <CandidateTable candidates={filteredCandidates} onStageChange={onStageChange} />
          <p className="demo-note">{filteredCandidates.length} candidate{filteredCandidates.length === 1 ? "" : "s"} shown</p>
        </CardContent>
      </Card>
    </div>
  );
}
