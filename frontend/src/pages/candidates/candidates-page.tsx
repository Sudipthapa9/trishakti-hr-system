import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { DataState } from "@/components/shared/feedback/data-state";
import { FeedbackMessage } from "@/components/shared/feedback/feedback-message";
import { useWorkspace } from "@/data/workspace-context";
import {
  requestPipelineApplications,
  type PipelineApplication,
} from "@/data/candidate-pipeline-api";
import { CandidatePipelineBoard } from "./candidate-pipeline-board";
import { AddCandidateForm } from "./add-candidate-form";
import { Plus } from "lucide-react";
import "./candidates-page.css";

export function CandidatesPage() {
  const { jobs, jobsLoading, jobsError } = useWorkspace();
  const [selectedJobId, setSelectedJobId] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [revision, setRevision] = useState(0);
  const [notice, setNotice] = useState("");
  const [eligibilityTime, setEligibilityTime] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(
      () => setEligibilityTime(Date.now()),
      60_000,
    );
    return () => window.clearInterval(timer);
  }, []);
  const selectedJob = jobs.find((job) => job.id === selectedJobId);
  const canAdd =
    selectedJob?.status === "Open" &&
    (!selectedJob.closingDate ||
      Date.parse(selectedJob.closingDate + "T23:59:59.999+05:45") >=
        eligibilityTime);

  return (
    <div className="page-candidates-candidates-page">
      <div className="page-stack">
        <div className="candidate-pipeline-toolbar">
          <div className="candidate-job-field">
            <Label htmlFor="pipeline-job">Job Title</Label>

            <NativeSelect
              id="pipeline-job"
              value={selectedJobId}
              disabled={creating || jobsLoading || Boolean(jobsError)}
              onChange={(event) => {
                setSelectedJobId(event.target.value);
                setShowAddForm(false);
                setNotice("");
              }}
            >
              <option value="">
                {jobsLoading ? "Loading jobs…" : "Select a job"}
              </option>

              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </NativeSelect>
          </div>
          <Button
            type="button"
            disabled={!canAdd || creating || jobsLoading || Boolean(jobsError)}
            aria-expanded={showAddForm}
            aria-controls="add-candidate-panel"
            onClick={() => {
              setShowAddForm((value) => !value);
              setNotice("");
            }}
          >
            <Plus aria-hidden="true" /> Add Candidate
          </Button>
        </div>
        {selectedJob && !canAdd && (
          <p className="pipeline-help">
            Applications can only be added to open jobs whose closing date has
            not passed.
          </p>
        )}
        {notice && <FeedbackMessage role="status">{notice}</FeedbackMessage>}
        {showAddForm && selectedJob && (
          <AddCandidateForm
            key={selectedJobId}
            jobId={selectedJobId}
            jobTitle={selectedJob.title}
            onBusyChange={setCreating}
            onCancel={() => setShowAddForm(false)}
            onCreated={() => {
              setShowAddForm(false);
              setNotice("Candidate application added to Applied.");
              setRevision((value) => value + 1);
            }}
          />
        )}

        {jobsError ? (
          <FeedbackMessage role="alert">{jobsError}</FeedbackMessage>
        ) : selectedJobId ? (
          <PipelineResults
            key={`${selectedJobId}:${revision}`}
            jobId={selectedJobId}
          />
        ) : (
          <DataState kind="empty">
            {jobsLoading
              ? "Loading jobs…"
              : jobs.length
                ? "Select a job to view its candidate pipeline."
                : "Create a job first to start its candidate pipeline."}
          </DataState>
        )}
      </div>
    </div>
  );
}

function PipelineResults({ jobId }: { jobId: string }) {
  const [applications, setApplications] = useState<PipelineApplication[]>([]);
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    requestPipelineApplications(jobId, page, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;

        setApplications((current) =>
          page === 1
            ? result.applications
            : [
                ...new Map(
                  [...current, ...result.applications].map((record) => [
                    record.id,
                    record,
                  ]),
                ).values(),
              ],
        );
        setHasMore(result.hasMore);
        setError("");
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            error instanceof Error
              ? error.message
              : "Could not load the pipeline.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [jobId, page, attempt]);

  return (
    <>
      {loading && (
        <FeedbackMessage role="status">Loading applications…</FeedbackMessage>
      )}

      {error && (
        <div>
          <FeedbackMessage role="alert">{error}</FeedbackMessage>
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => {
              setLoading(true);
              setError("");
              setAttempt((value) => value + 1);
            }}
          >
            Try again
          </Button>
        </div>
      )}

      {applications.length > 0 && (
        <>
          <p className="pipeline-loaded-count" role="status">
            {applications.length} applications loaded.
            {hasMore && " Load more to include additional applications."}
          </p>
          <CandidatePipelineBoard applications={applications} />
        </>
      )}

      {!loading && !error && applications.length === 0 && (
        <DataState kind="empty">No applications for this job yet.</DataState>
      )}

      {hasMore && (
        <Button
          variant="outline"
          disabled={loading || Boolean(error)}
          onClick={() => {
            setLoading(true);
            setPage((value) => value + 1);
          }}
        >
          {loading ? "Loading…" : "Load more applications"}
        </Button>
      )}
    </>
  );
}
