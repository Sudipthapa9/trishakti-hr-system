/**
 * Displays illustrative CV rankings, match filters, and links to candidate analysis; these scores are not live model output.
 */
import { Person } from "@/components/HR/workflow-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Candidate, CandidateStage, Job } from "@/types/hr";
import { Info, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./screening-ranking-page.css";
// Define Props so callers and implementations agree on the required data shape.
type Props = {
  candidates: Candidate[];
  jobs: Job[];
  onStageChange: (id: string, stage: CandidateStage) => void;
};
// Provide the fixed prototype records or display configuration consumed by this module.
const rows = [
  {
    name: "Elena Rostova",
    score: 94,
    skills: ["1 of 5"],
    missing: [],
    status: "Shortlisted",
    age: "2 days ago",
  },
  {
    name: "David Chen",
    score: 88,
    skills: ["1 of 5"],
    missing: ["Lean Six Sigma"],
    status: "Pending Review",
    age: "3 days ago",
  },
  {
    name: "Marcus Johnson",
    score: 62,
    skills: ["Logistics"],
    missing: ["AutoCAD", "Polymer Science"],
    status: "Declined",
    age: "1 week ago",
  },
  {
    name: "Priya Nair",
    score: 86,
    skills: ["AutoCAD", "Polymer Science"],
    missing: ["Lean Six Sigma"],
    status: "Pending Review",
    age: "1 day ago",
  },
  {
    name: "Omar Hassan",
    score: 82,
    skills: ["AutoCAD", "Supply Chain"],
    missing: ["Polymer Science"],
    status: "Pending Review",
    age: "2 days ago",
  },
  {
    name: "Sofia Kim",
    score: 78,
    skills: ["Polymer Science", "Logistics"],
    missing: ["AutoCAD", "Lean Six Sigma"],
    status: "Declined",
    age: "4 days ago",
  },
  {
    name: "Lucas Brooks",
    score: 90,
    skills: ["AutoCAD", "Lean Six Sigma"],
    missing: [],
    status: "Shortlisted",
    age: "1 week ago",
  },
];
// Displays illustrative CV rankings, match filters, and links to candidate analysis; these scores are not live model output.
export function ScreeningRankingPage({
  jobs,
  candidates,
  onStageChange,
}: Props) {
  // Keep job in component state; updates trigger a render.
  const [job, setJob] = useState(jobs[0]?.id ?? "");
  // Keep score in component state; updates trigger a render.
  const [score, setScore] = useState("0");
  // Keep department in component state; updates trigger a render.
  const [department, setDepartment] = useState("All Departments");
  // Recompute this derived view only when its declared inputs change.
  const visible = useMemo(
    () => rows.filter((r) => r.score >= Number(score)),
    [score],
  );
  return (
    <div className="page-screening-screening-ranking-page">
      <div className="page-stack">
        {/* Page or panel heading and contextual actions. */}
        <header className="ranking-heading">
          <div>
            <h1>AI Screening & Ranking</h1>
            <select
              aria-label="Select screening job"
              value={job}
              onChange={(e) => setJob(e.target.value)}
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>
          <div className="ranking-totals">
            <div>
              <small>Vacancies</small>
              <strong>2</strong>
            </div>
            <div>
              <small>Shortlist cap</small>
              <strong>10</strong>
            </div>
          </div>
        </header>
        <div className="ranking-toolbar">
          <SlidersHorizontal size={16} />
          <select
            aria-label="Minimum match score"
            className="form-select"
            value={score}
            onChange={(e) => setScore(e.target.value)}
          >
            <option value="0">All Match Scores</option>
            <option value="80">80% and above</option>
            <option value="90">90% and above</option>
          </select>
          <select
            aria-label="Department"
            className="form-select"
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              const selected = jobs.find(
                (j) => j.department === e.target.value,
              );
              if (selected) setJob(selected.id);
            }}
          >
            <option>All Departments</option>
            {[...new Set(jobs.map((j) => j.department))].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <p>
            <Info size={14} />
            AI-assisted screening. Final hiring decision remains with HR.
          </p>
        </div>
        <div className="ranking-table-wrap">
          {/* Use semantic rows and columns for the tabular records. */}
          <table className="ranking-table">
            <thead>
              <tr>
                {[
                  "Rank",
                  "Candidate",
                  "AI Match Score",
                  "Matched Core Skills",
                  "Missing Requirements",
                  "Status",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((r, i) => {
                const candidate = candidates.find((c) => c.name === r.name);
                return (
                  <tr key={r.name}>
                    <td>#{i + 1}</td>
                    <td>
                      <Link
                        to={
                          "/screening/" +
                          r.name.toLowerCase().replaceAll(" ", "-")
                        }
                      >
                        <Person name={r.name} detail={"Applied: " + r.age} />
                      </Link>
                    </td>
                    <td className="ranking-score">{r.score}%</td>
                    <td>
                      <div className="ranking-tags">
                        {r.skills.map((s) => (
                          <Badge key={s} variant="neutral">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="ranking-tags">
                        {r.missing.length ? (
                          r.missing.map((s) => (
                            <Badge key={s} variant="danger">
                              {s}
                            </Badge>
                          ))
                        ) : (
                          <small>None identified</small>
                        )}
                      </div>
                    </td>
                    <td>
                      {candidate ? (
                        <select
                          aria-label={"Update " + r.name + " stage"}
                          className="form-select"
                          value={candidate.stage}
                          onChange={(e) =>
                            onStageChange(
                              candidate.id,
                              e.target.value as CandidateStage,
                            )
                          }
                        >
                          {["Review", "Shortlisted", "Interview", "Offer"].map(
                            (s) => (
                              <option key={s}>{s}</option>
                            ),
                          )}
                        </select>
                      ) : (
                        <Badge
                          variant={
                            r.status === "Shortlisted" ? "success" : "neutral"
                          }
                        >
                          {r.status}
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!visible.length ? (
            <p className="empty-message">No candidates meet this threshold.</p>
          ) : null}
        </div>
        {/* Supporting links, pagination, or secondary screen actions. */}
        <footer className="table-pagination">
          <span>
            Showing 1 to {visible.length} of {visible.length} entries
          </span>
          <div>
            <Button size="sm" variant="outline" disabled>
              Previous
            </Button>
            <Button size="sm" variant="outline" disabled>
              Next
            </Button>
          </div>
        </footer>
        <p className="demo-note">
          Illustrative screening data; live screening results are not connected.
        </p>
      </div>
    </div>
  );
}
