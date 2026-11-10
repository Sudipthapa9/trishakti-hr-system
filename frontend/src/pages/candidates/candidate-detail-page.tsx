import "./candidates-page.css";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requestCandidate, type CandidateDetail } from "@/data/candidates-api";

export function CandidateDetailPage() {
  const { candidateId } = useParams();
  return <CandidateDetails key={candidateId} candidateId={candidateId ?? ""} />;
}

function CandidateDetails({ candidateId }: { candidateId: string }) {
  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const data = await requestCandidate(candidateId ?? "", controller.signal);
        if (!controller.signal.aborted) {
          setCandidate(data.candidate);
          setLoadError(null);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(error instanceof Error ? error.message : "Could not load candidate.");
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [candidateId, attempt]);

  return (
    <div className="page-stack">
      <Link className="underline" to="/candidates">Back to candidates</Link>
      {isLoading ? <p role="status">Loading candidate…</p> : loadError ? (
        <div role="alert">
          <p>{loadError}</p>
          <Button variant="outline" onClick={() => {
            setIsLoading(true);
            setAttempt((value) => value + 1);
          }}>Try again</Button>
        </div>
      ) : candidate ? (
        <>
          <header className="page-heading">
            <div>
              <h1>{candidate.fullName}</h1>
              <p>{candidate.email} · {candidate.phone}</p>
            </div>
          </header>
          <h2>Applications ({candidate.applications.length})</h2>
          {!candidate.applications.length ? <p>This candidate has no applications.</p> : (
            <div className="grid gap-4">
              {candidate.applications.map((application) => (
                <article className="rounded-lg border bg-white p-5" key={application.id}>
                  <h3>{application.jobTitle}</h3>
                  <p>Job status: {application.jobStatus}</p>
                  <Badge variant="neutral">{application.stage}</Badge>
                  <p>Submitted {new Date(application.createdAt).toLocaleString()}</p>
                  <p>Reference TSH-{application.id}</p>
                  <details className="my-3">
                    <summary>Submitted contact details and cover letter</summary>
                    <p>{application.fullName} · {application.email} · {application.phone}</p>
                    <p className="whitespace-pre-line">{application.coverLetter || "No cover letter provided."}</p>
                  </details>
                  <p>{application.hasResume ? "CV received." : "No CV available."}</p>
                </article>
              ))}
            </div>
          )}
          <Button asChild variant="outline"><Link to="/applications">Review applications and CVs</Link></Button>
        </>
      ) : null}
    </div>
  );
}
