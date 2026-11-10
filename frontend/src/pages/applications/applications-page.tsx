import { useEffect, useState } from "react";
import keycloak from "@/keycloak";
import { Button } from "@/components/ui/button";

type Application = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  jobTitle: string;
  stage: string;
  coverLetter: string;
  createdAt: string;
  hasResume: boolean;
  resumeName: string | null;
};

async function applicationRequest(path: string, signal?: AbortSignal) {
  if (!keycloak.authenticated) throw new Error("Please sign in again.");
  await keycloak.updateToken(30);
  const base = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const response = await fetch(base.replace(/\/$/, "") + "/api/applications" + path, {
    signal,
    headers: { Authorization: `Bearer ${keycloak.token}` },
  });
  if (response.status === 403) throw new Error("An HR role is required to view applications.");
  if (response.status === 401) throw new Error("Please sign in again.");
  if (!response.ok) throw new Error("Could not load application data. Please try again.");
  return response;
}

export function ApplicationsPage() {
  const [page, setPage] = useState(1);
  const [applications, setApplications] = useState<Application[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await applicationRequest("?page=" + page, controller.signal);
        const data = await response.json();
        if (!controller.signal.aborted) {
          setApplications(data.applications);
          setHasMore(data.hasMore);
          setError(null);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(error instanceof Error ? error.message : "Could not load applications.");
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [page]);

  async function download(application: Application) {
    if (downloadId) return;
    setDownloadId(application.id);
    setDownloadError(null);
    try {
      const response = await applicationRequest("/" + application.id + "/resume");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = application.resumeName || "resume";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "Could not download the CV.");
    } finally {
      setDownloadId(null);
    }
  }

  function changePage(next: number) {
    setIsLoading(true);
    setPage(next);
  }

  return (
    <div className="page-stack">
      <header className="page-heading">
        <div><h1>Applications</h1><p>Review submitted applications and CVs.</p></div>
      </header>
      {downloadError && <p role="alert">{downloadError}</p>}
      {isLoading ? <p role="status">Loading applications…</p> : error ? (
        <p role="alert">{error}</p>
      ) : !applications.length ? (
        <p>No applications received yet.</p>
      ) : (
        <div className="grid gap-4">
          {applications.map((application) => (
            <article className="rounded-lg border bg-white p-5" key={application.id}>
              <h2>{application.fullName}</h2>
              <p>{application.jobTitle} · {application.stage}</p>
              <p>{application.email} · {application.phone}</p>
              <p>Submitted {new Date(application.createdAt).toLocaleString()}</p>
              <details className="my-3">
                <summary>Application details</summary>
                <p>Reference TSH-{application.id}</p>
                <p className="whitespace-pre-line">{application.coverLetter || "No cover letter provided."}</p>
              </details>
              <Button variant="outline" disabled={!application.hasResume || downloadId !== null}
                onClick={() => void download(application)}>
                {downloadId === application.id ? "Downloading…" : "Download CV"}
              </Button>
            </article>
          ))}
        </div>
      )}
      <div className="flex items-center gap-3">
        <Button variant="outline" disabled={isLoading || page === 1} onClick={() => changePage(page - 1)}>Previous</Button>
        <span>Page {page}</span>
        <Button variant="outline" disabled={isLoading || error !== null || !hasMore} onClick={() => changePage(page + 1)}>Next</Button>
      </div>
    </div>
  );
}
