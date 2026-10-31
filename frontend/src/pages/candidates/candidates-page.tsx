/**
 * Groups candidates by pipeline stage and supports local additions, score filters, and stage actions.
 */
import "./candidates-page.css";
import { useMemo, useState, type FormEvent } from "react";
import { Clock3, Filter, MoreVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Candidate, CandidateStage } from "@/types/hr";
// Provide the fixed prototype records or display configuration consumed by this module.
const columns: [CandidateStage, string][] = [
  ["Review", "Applied"],
  ["Screening", "Screening"],
  ["Shortlisted", "Shortlisted"],
];
// Groups candidates by pipeline stage and supports local additions, score filters, and stage actions.
export function CandidatesPage({
  candidates,
  onStageChange,
}: {
  candidates: Candidate[];
  onStageChange: (id: string, stage: CandidateStage) => void;
}) {
  // Keep job in component state; updates trigger a render.
  const [job, setJob] = useState("Senior Frontend Engineer");
  // Keep score in component state; updates trigger a render.
  const [score, setScore] = useState("0");
  // Keep showForm in component state; updates trigger a render.
  const [showForm, setShowForm] = useState(false);
  // Keep local in component state; updates trigger a render.
  const [local, setLocal] = useState<Candidate[]>([]);
  // Keep overrides in component state; updates trigger a render.
  const [overrides, setOverrides] = useState<Record<string, CandidateStage>>(
    {},
  );
  const roles = [...new Set([...candidates, ...local].map((c) => c.role))];
  // Recompute this derived view only when its declared inputs change.
  const visible = useMemo(
    () =>
      [...candidates, ...local].filter(
        (c) => c.role === job && c.score >= Number(score),
      ),
    [candidates, local, job, score],
  );
  // Add a fictional local candidate to the selected role and reset the score filter so the record is visible.
  function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    setLocal((v) => [
      ...v,
      {
        id: "local-" + Date.now(),
        name: String(d.get("name")),
        email: String(d.get("email")),
        role: job,
        location: "",
        score: 0,
        stage: "Review",
        updated: "Just now",
      },
    ]);
    setScore("0");
    setShowForm(false);
  }
  return (
    <div className="page-candidates-candidates-page">
      <div className="page-stack">
        <div className="candidate-pipeline-toolbar">
          <div>
            <Label htmlFor="candidate-job">Job Title</Label>
            <select
              id="candidate-job"
              className="form-select"
              value={job}
              onChange={(e) => setJob(e.target.value)}
            >
              {roles.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>
          <label className="pipeline-filter">
            <Filter size={17} />
            <select
              aria-label="Filter by score"
              value={score}
              onChange={(e) => setScore(e.target.value)}
            >
              <option value="0">Filter by Score</option>
              <option value="80">80% and above</option>
              <option value="90">90% and above</option>
            </select>
          </label>
          <Button onClick={() => setShowForm((v) => !v)}>
            <Plus />
            Add Candidate
          </Button>
        </div>
        {showForm ? (
          <form className="candidate-add-form" onSubmit={add}>
            <div className="form-field">
              <Label htmlFor="candidate-name">Full Name</Label>
              <Input id="candidate-name" name="name" required />
            </div>
            <div className="form-field">
              <Label htmlFor="candidate-email">Email</Label>
              <Input id="candidate-email" name="email" type="email" required />
            </div>
            <div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add Locally</Button>
            </div>
          </form>
        ) : null}
        <div className="candidate-pipeline">
          {columns.map(([stage, title]) => {
            const rows = visible.filter(
              (c) => (overrides[c.id] ?? c.stage) === stage,
            );
            return (
              <section key={stage}>
                <div className="candidate-column-heading">
                  <h1>{title}</h1>
                  <span>{rows.length}</span>
                </div>
                <div className="candidate-column-cards">
                  {rows.map((c) => (
                    <article className="pipeline-candidate-card" key={c.id}>
                      <div className="pipeline-card-head">
                        <span className="candidate-initials" aria-hidden="true">
                          {c.name
                            .split(" ")
                            .map((v) => v[0])
                            .slice(0, 2)
                            .join("")}
                        </span>
                        <div>
                          <strong>{c.name}</strong>
                          <small>Sr. Frontend Eng.</small>
                        </div>
                        <details className="candidate-actions">
                          <summary aria-label={"Actions for " + c.name}>
                            <MoreVertical size={16} />
                          </summary>
                          <div>
                            {columns
                              .filter(([s]) => s !== stage)
                              .map(([next, label]) => (
                                <button
                                  key={next}
                                  onClick={() => {
                                    if (c.id.startsWith("local-"))
                                      setOverrides((v) => ({
                                        ...v,
                                        [c.id]: next,
                                      }));
                                    else onStageChange(c.id, next);
                                  }}
                                >
                                  Move to {label}
                                </button>
                              ))}
                          </div>
                        </details>
                      </div>
                      <div className="pipeline-card-foot">
                        <span>
                          <Clock3 size={12} />
                          {c.updated}
                        </span>
                        <Badge variant="neutral">{c.score}%</Badge>
                      </div>
                    </article>
                  ))}
                  {!rows.length ? (
                    <p className="empty-message">
                      No candidates in this stage.
                    </p>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
        <p className="demo-note">
          Prototype pipeline. Changes stay in this browser session.
        </p>
      </div>
    </div>
  );
}
