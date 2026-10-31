/**
 * Displays illustrative score explanations and local HR review actions. Hiring decisions remain with HR.
 */
import "./candidate-analysis-page.css";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  FileText,
  Info,
  ScanSearch,
  X,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// Displays illustrative score explanations and local HR review actions. Hiring decisions remain with HR.
export function CandidateAnalysisPage() {
  const { candidateId } = useParams();
  const name = candidateId
    ? candidateId
        .split("-")
        .map((v) => v[0]?.toUpperCase() + v.slice(1))
        .join(" ")
    : "Marcus Reed";
  // Keep notice in component state; updates trigger a render.
  const [notice, setNotice] = useState("");
  return (
    <div className="page-screening-candidate-analysis-page">
      <div className="page-stack">
        {notice ? (
          <p role="status" className="prototype-feedback">
            {notice}
          </p>
        ) : null}
        <div className="analysis-layout">
          {/* Supporting profile, navigation, or filter content beside the main panel. */}
          <aside>
            {/* Group related content and controls in this screen section. */}
            <section className="analysis-profile">
              <img src="/design/profile-19-2.png" alt="" />
              <h1>{name}</h1>
              <p>Senior Backend Engineer</p>
              <div className="analysis-match">
                <strong>
                  91<small>%</small>
                </strong>
                <span>MATCH</span>
              </div>
              <p className="analysis-notice">
                <Info size={14} />
                AI-assisted screening. Final hiring decision remains with HR.
              </p>
            </section>
            {/* Group related content and controls in this screen section. */}
            <section className="analysis-decisions">
              <h2>HR Decision</h2>
              <Button
                onClick={() =>
                  setNotice(
                    name + " has been shortlisted locally in this prototype.",
                  )
                }
              >
                <UserCheck />
                Shortlist Candidate
              </Button>
              <Button asChild variant="outline">
                <Link to="/interviews">
                  <CalendarDays />
                  Schedule Interview
                </Link>
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  setNotice(name + " was marked for rejection review locally.")
                }
              >
                <X />
                Reject
              </Button>
            </section>
          </aside>
          <div className="analysis-details">
            {/* Group related content and controls in this screen section. */}
            <section className="analysis-breakdown">
              <h2>
                <ScanSearch size={19} />
                AI Score Breakdown
              </h2>
              {[
                ["Python Architecture", 5, 100],
                ["Object-Oriented Programming (OOP)", 5, 100],
                ["PostgreSQL Optimization", 4, 85],
              ].map(([label, weight, score]) => (
                <div className="analysis-score-row" key={label}>
                  <div>
                    <strong>{label}</strong>
                    <span>Weight: {weight}</span>
                  </div>
                  <div className="analysis-score-track">
                    <div style={{ width: score + "%" }} />
                  </div>
                </div>
              ))}
            </section>
            <div className="analysis-skills">
              {/* Group related content and controls in this screen section. */}
              <section>
                <h2>
                  <CheckCircle2 size={19} />
                  Matched Profile
                </h2>
                <div>
                  {["Python", "OOP", "PostgreSQL", "REST API", "CI/CD"].map(
                    (v) => (
                      <Badge key={v} variant="success">
                        <Check size={11} />
                        {v}
                      </Badge>
                    ),
                  )}
                </div>
              </section>
              {/* Group related content and controls in this screen section. */}
              <section>
                <h2>
                  <XCircle size={19} />
                  Missing/Weak
                </h2>
                <div>
                  {["Docker", "Kubernetes"].map((v) => (
                    <Badge key={v} variant="neutral">
                      <X size={11} />
                      {v}
                    </Badge>
                  ))}
                </div>
                <p>
                  Candidate has no explicit mention of container orchestration
                  tools in recent roles.
                </p>
              </section>
            </div>
            {/* Group related content and controls in this screen section. */}
            <section className="analysis-highlights">
              <h2>
                <FileText size={19} />
                AI Extraction Highlights
              </h2>
              <blockquote>
                <small>Context: Python & Architecture</small>“...architected and
                deployed a microservices-based financial processing engine using
                Python and FastAPI, resulting in a 40% reduction in latency for
                high-volume transactions...”
              </blockquote>
              <blockquote>
                <small>Context: Database Management</small>“...led the migration
                from legacy NoSQL stores to highly optimized PostgreSQL
                clusters, writing complex queries and establishing robust
                indexing strategies...”
              </blockquote>
            </section>
          </div>
        </div>
        <p className="demo-note">
          Illustrative scores and CV evidence. Live screening data is not
          connected.
        </p>
      </div>
    </div>
  );
}
// Render the small confirmation icon used by the candidate-review action.
function UserCheck() {
  return <CheckCircle2 aria-hidden="true" />;
}
