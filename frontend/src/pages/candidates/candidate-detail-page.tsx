import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { FeedbackMessage } from "@/components/shared/feedback/feedback-message";
import { Button } from "@/components/ui/button";
import { requestCandidate, type CandidateDetail } from "@/data/candidates-api";
import { CandidateProfileView } from "./candidate-profile-view";
import "./candidate-detail-page.css";

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
        const data = await requestCandidate(candidateId, controller.signal);
        if (!controller.signal.aborted) {
          setCandidate(data.candidate);
          setLoadError(null);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Could not load candidate.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [candidateId, attempt]);

  return (
    <div className="candidate-detail-page page-stack">
      {isLoading ? (
        <FeedbackMessage role="status">Loading candidate…</FeedbackMessage>
      ) : loadError ? (
        <div role="alert">
          <Link className="candidate-back-link" to="/candidates">
            <ArrowLeft aria-hidden="true" />
            Back to Candidates
          </Link>
          <p>{loadError}</p>
          <Button
            variant="outline"
            onClick={() => {
              setIsLoading(true);
              setAttempt((value) => value + 1);
            }}
          >
            Try again
          </Button>
        </div>
      ) : candidate ? (
        <CandidateProfileView
          candidate={candidate}
          onProfileSaved={(profile) =>
            setCandidate((current) => current && { ...current, ...profile })
          }
          onStageSaved={(id, stage) =>
            setCandidate(
              (current) =>
                current && {
                  ...current,
                  applications: current.applications.map((record) =>
                    record.id === id ? { ...record, stage } : record,
                  ),
                },
            )
          }
        />
      ) : null}
    </div>
  );
}
