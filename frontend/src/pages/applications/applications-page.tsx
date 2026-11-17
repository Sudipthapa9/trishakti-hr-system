import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  FileText,
  Inbox,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { PageHeader } from "@/components/Layout/page-header";
import { DataState } from "@/components/shared/feedback/data-state";
import { FeedbackMessage } from "@/components/shared/feedback/feedback-message";
import { PaginationControls } from "@/components/shared/navigation/pagination-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useWorkspace } from "@/data/workspace-context";
import { applicationStages } from "@/data/application-stages";
import {
  requestApplications,
  downloadApplicationResume,
  type ApplicationRecord,
} from "@/data/applications-api";
import { ApplicationDetails } from "./application-details";
import { ApplicationsTable } from "./applications-table";
import "./applications-page.css";

export function ApplicationsPage() {
  const { jobs, jobsLoading, jobsError } = useWorkspace();
  const [query, setQuery] = useState({
    page: 1,
    jobId: "",
    stage: "",
    q: "",
    revision: 0,
  });
  const [search, setSearch] = useState("");
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ApplicationRecord | null>(null);
  const downloadBusy = useRef(false);
  const lastFocus = useRef<HTMLElement | null>(null);
  const filtered = Boolean(query.jobId || query.stage || query.q);
  useEffect(() => {
    const controller = new AbortController();
    requestApplications(query, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setApplications(result.applications);
        setHasMore(result.hasMore);
        setError(null);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error
              ? error.message
              : "Could not load applications.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [query]);
  function updateQuery(changes: Partial<typeof query>) {
    setIsLoading(true);
    setError(null);
    setSelected(null);
    setDownloadError(null);
    setQuery((current) => ({ ...current, ...changes }));
  }
  function clearFilters() {
    setSearch("");
    updateQuery({ page: 1, jobId: "", stage: "", q: "" });
  }
  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateQuery({ q: search.trim(), page: 1 });
  }
  async function download(application: ApplicationRecord) {
    if (downloadBusy.current || !application.hasResume) return;
    downloadBusy.current = true;
    setDownloadId(application.id);
    setDownloadError(null);
    try {
      const blob = await downloadApplicationResume(application.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = application.resumeName || "resume";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setDownloadError(
        error instanceof Error ? error.message : "Could not download the CV.",
      );
    } finally {
      downloadBusy.current = false;
      setDownloadId(null);
    }
  }
  function view(application: ApplicationRecord) {
    lastFocus.current = document.activeElement as HTMLElement | null;
    setDownloadError(null);
    setSelected(application);
  }
  return (
    <Sheet
      open={selected !== null}
      onOpenChange={(open) => {
        if (!open) setSelected(null);
      }}
    >
      <div className="page-applications page-stack">
        <PageHeader
          className="applications-heading"
          eyebrow="Recruitment workspace"
          title="Applications"
          description="Every application, one place. Review candidates and their submitted documents."
          action={
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
                onClick={() => updateQuery({ revision: query.revision + 1 })}
              >
                <RotateCcw aria-hidden="true" />
                Reload
              </Button>
              <Button asChild size="sm">
                <Link to="/candidates">
                  Candidate Pipeline <ArrowUpRight aria-hidden="true" />
                </Link>
              </Button>
            </>
          }
        />
        <form className="applications-filters" onSubmit={submitSearch}>
          <div className="applications-search">
            <Label className="sr-only" htmlFor="applications-search">
              Search applicants or positions
            </Label>
            <Search aria-hidden="true" />
            <Input
              id="applications-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email or position..."
              maxLength={200}
            />
          </div>
          <div className="applications-filter-field">
            <Label htmlFor="applications-job">Job</Label>
            <NativeSelect
              id="applications-job"
              value={query.jobId}
              disabled={jobsLoading || Boolean(jobsError)}
              onChange={(event) =>
                updateQuery({ jobId: event.target.value, page: 1 })
              }
            >
              <option value="">All jobs</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="applications-filter-field">
            <Label htmlFor="applications-stage">Stage</Label>
            <NativeSelect
              id="applications-stage"
              value={query.stage}
              onChange={(event) =>
                updateQuery({ stage: event.target.value, page: 1 })
              }
            >
              <option value="">All stages</option>
              {applicationStages.map((stage) => (
                <option key={stage} value={stage}>
                  {stage === "Review" ? "Applied" : stage}
                </option>
              ))}
            </NativeSelect>
          </div>
          <Button type="submit" size="sm">
            <Search aria-hidden="true" />
            Search
          </Button>
          {filtered && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearFilters}
            >
              Clear
            </Button>
          )}
        </form>
        {jobsError && (
          <FeedbackMessage role="alert">
            Job filter unavailable: {jobsError}
          </FeedbackMessage>
        )}
        {downloadError && (
          <FeedbackMessage role="alert">{downloadError}</FeedbackMessage>
        )}
        {downloadId && (
          <FeedbackMessage role="status">Downloading CV...</FeedbackMessage>
        )}
        <section className="applications-panel" aria-busy={isLoading}>
          <header>
            <div className="applications-panel-title">
              <span className="applications-panel-icon">
                <FileText aria-hidden="true" />
              </span>
              <div>
                <h2>Submitted Applications</h2>
                <p>Newest submissions first</p>
              </div>
            </div>
            <span className="applications-result-label">
              <SlidersHorizontal aria-hidden="true" />
              {isLoading
                ? "Loading..."
                : error
                  ? "Unavailable"
                  : `${applications.length} on this page`}
            </span>
          </header>
          {isLoading ? (
            <div className="applications-state">
              <DataState kind="loading">Loading applications...</DataState>
            </div>
          ) : error ? (
            <div className="applications-state">
              <DataState
                kind="error"
                onRetry={() => updateQuery({ revision: query.revision + 1 })}
              >
                {error}
              </DataState>
            </div>
          ) : !applications.length ? (
            <div className="applications-empty">
              <Inbox aria-hidden="true" />
              <h3>
                {filtered
                  ? "No matching applications"
                  : "No applications received yet"}
              </h3>
              <p>
                {filtered
                  ? "Try a different search, job or stage."
                  : "Applications will appear here when candidates apply to your open jobs."}
              </p>
              {filtered ? (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              ) : (
                <Button asChild variant="outline">
                  <Link to="/jobs">View Jobs</Link>
                </Button>
              )}
            </div>
          ) : (
            <ApplicationsTable
              applications={applications}
              downloadId={downloadId}
              onDownload={(application) => void download(application)}
              onView={view}
            />
          )}
          <footer>
            <p>
              {!isLoading && !error && applications.length
                ? `Showing ${(query.page - 1) * 20 + 1} to ${(query.page - 1) * 20 + applications.length}`
                : "Application records"}
            </p>
            <PaginationControls
              label="Application pages"
              previousDisabled={isLoading || query.page === 1}
              nextDisabled={isLoading || Boolean(error) || !hasMore}
              onPrevious={() => updateQuery({ page: query.page - 1 })}
              onNext={() => updateQuery({ page: query.page + 1 })}
            >
              <span>Page {query.page}</span>
            </PaginationControls>
          </footer>
        </section>
        <p className="applications-privacy-note">
          CVs are private. Application stages are managed from the candidate
          profile.
        </p>
      </div>
      <SheetContent
        className="applications-detail-sheet"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          lastFocus.current?.focus();
        }}
      >
        <SheetHeader>
          <SheetTitle>Application Details</SheetTitle>
          <SheetDescription>
            Review the submitted information and private CV.
          </SheetDescription>
        </SheetHeader>
        {selected && (
          <ApplicationDetails
            application={selected}
            downloadId={downloadId}
            downloadError={downloadError}
            onDownload={(application) => void download(application)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
