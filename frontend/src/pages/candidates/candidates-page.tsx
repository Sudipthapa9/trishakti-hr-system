import { Filter, MoreVertical, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/Layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Candidate, CandidateStage } from "@/types/hr";

import "../pages.css";

type CandidatesPageProps = {
  candidates: Candidate[];
  onStageChange: (candidateId: string, stage: CandidateStage) => void;
};

const columns: { title: CandidateStage; subtitle: string }[] = [
  { title: "Review", subtitle: "Applied" },
  { title: "Interview", subtitle: "Screening" },
  { title: "Shortlisted", subtitle: "Shortlisted" },
];

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2);
}
export function CandidatesPage({ candidates, onStageChange }: CandidatesPageProps) {
  const [search, setSearch] = useState("");
  const [job, setJob] = useState("Senior Frontend Engineer");
  const normalizedSearch = search.trim().toLowerCase();
  const visible = useMemo(() => candidates.filter((candidate) =>
    (candidate.name + " " + candidate.role + " " + candidate.location).toLowerCase().includes(normalizedSearch)
  ), [candidates, normalizedSearch]);

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Recruitment" title="Candidate Pipeline" description="Move candidates through your hiring workflow with a clear view of every stage." />
      <div className="candidate-pipeline-toolbar">
        <div>
          <label htmlFor="candidate-job">Job title</label>
          <select id="candidate-job" className="form-select" value={job} onChange={(event) => setJob(event.target.value)}>
            <option>Senior Frontend Engineer</option>
            <option>Frontend Engineer</option>
            <option>Operations Manager</option>
          </select>
        </div>
        <button className="pipeline-filter"><Filter aria-hidden="true" size={17} /> Filter by score</button>
        <div className="pipeline-search"><Search aria-hidden="true" size={16} /><Input aria-label="Search candidates" placeholder="Search candidates..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        <Button><Plus aria-hidden="true" /> Add candidate</Button>
      </div>

      <div className="candidate-pipeline">
        {columns.map((column) => {
          const stageCandidates = visible.filter((candidate) => candidate.stage === column.title || (column.title === "Review" && candidate.stage === "Offer"));
          return <section key={column.title} className="candidate-pipeline-column">
            <div className="candidate-column-heading"><div><h2>{column.title === "Review" ? "Applied" : column.subtitle}</h2><p>{column.title === "Review" ? "New applications" : column.title === "Interview" ? "In progress" : "Ready for next step"}</p></div><span>{stageCandidates.length}</span></div>
            <div className="candidate-column-cards">
              {stageCandidates.map((candidate) => <Card className="pipeline-candidate-card" key={candidate.id}>
                <div className="pipeline-card-head"><span className="candidate-initials" aria-hidden="true">{initials(candidate.name)}</span><div><strong>{candidate.name}</strong><small>{candidate.role}</small></div><button className="icon-action" aria-label={"More actions for " + candidate.name}><MoreVertical size={17} /></button></div>
                <div className="pipeline-card-foot"><span>{candidate.updated}</span><Badge variant={candidate.score >= 90 ? "success" : "neutral"}>{candidate.score}%</Badge></div>
                <label className="sr-only" htmlFor={"stage-" + candidate.id}>Update stage for {candidate.name}</label>
                <select id={"stage-" + candidate.id} className="pipeline-stage-select" value={candidate.stage} onChange={(event) => onStageChange(candidate.id, event.target.value as CandidateStage)}>
                  <option>Review</option><option>Shortlisted</option><option>Interview</option><option>Offer</option>
                </select>
              </Card>)}
              {stageCandidates.length === 0 ? <p className="empty-message">No candidates here.</p> : null}
            </div>
          </section>;
        })}
      </div>
      <p className="demo-note">Showing {visible.length} candidate{visible.length === 1 ? "" : "s"} for {job}. Stage changes stay in this browser session.</p>
    </div>
  );
}

