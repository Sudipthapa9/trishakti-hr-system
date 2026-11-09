/**
 * Lists database jobs and saves edits and status changes through the workspace.
 */
import "./jobs-page.css";
import { Fragment, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { Job, JobStatus } from "@/types/hr";
// Lists database jobs and saves edits and status changes through the workspace.
export function JobsPage({
  jobs,
  onStatusChange,
}: {
  jobs: Job[];
  onStatusChange: (id: string, status: JobStatus) => Promise<void>;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const busy = useRef(false);

  async function runAction(action: () => Promise<void>) {
    if (busy.current) return;
    busy.current = true;
    setIsSaving(true);
    setActionError(null);
    setFeedback(null);
    try {
      await action();
      setFeedback("Job saved.");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not save this job.");
    } finally {
      busy.current = false;
      setIsSaving(false);
    }
  }

  // Keep search in component state; updates trigger a render.
  const [search, setSearch] = useState("");
  // Keep department in component state; updates trigger a render.
  const [department, setDepartment] = useState("All Departments");
  // Keep status in component state; updates trigger a render.
  const [status, setStatus] = useState("All Statuses");
  // Keep expanded in component state; updates trigger a render.
  const [expanded, setExpanded] = useState<string | null>(null);
  // Keep page in component state; updates trigger a render.
  const [page, setPage] = useState(0);
  // Recompute this derived view only when its declared inputs change.
  const filtered = useMemo(
    () =>
      jobs.filter(
        (j) =>
          (j.title + " " + j.department + " " + j.location)
            .toLowerCase()
            .includes(search.toLowerCase()) &&
          (department === "All Departments" || j.department === department) &&
          (status === "All Statuses" || j.status === status),
      ),
    [jobs, search, department, status],
  );
  const visible = filtered.slice(page * 8, page * 8 + 8);
  return (
    <div className="page-recruitment-jobs-page">
      {actionError && <p role="alert">{actionError}</p>}
      {feedback && <p role="status">{feedback}</p>}
      <div className="page-stack">
        <div className="page-heading">
          <div>
            <h1>Job Management</h1>
            <p>Overview of open requisitions, drafts, and closed positions.</p>
          </div>
          <Button asChild>
            <Link to="/jobs/new">
              <Plus />
              Post New Job
            </Link>
          </Button>
        </div>
        <div className="jobs-toolbar">
          <label>
            <Search size={17} />
            <Input
              aria-label="Search jobs"
              placeholder="Search by job title or keyword..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
            />
          </label>
          <select
            className="form-select"
            aria-label="Filter departments"
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setPage(0);
            }}
          >
            <option>All Departments</option>
            {[...new Set(jobs.map((j) => j.department))].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <select
            className="form-select"
            aria-label="Filter job status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
          >
            <option>All Statuses</option>
            <option value="Open">Active</option>
            <option value="Draft">Draft</option>
            <option value="Archived">Closed</option>
          </select>
        </div>
        <div className="jobs-table-wrap">
          {/* Use semantic rows and columns for the tabular records. */}
          <table className="jobs-table">
            <thead>
              <tr>
                {[
                  "Job Title",
                  "Department",
                  "Location",
                  "Status",
                  "Applicants",
                  "Actions",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((j) => (
                <Fragment key={j.id}>
                  <tr>
                    <td>
                      <strong>{j.title}</strong>
                      <small>
                        {j.id.startsWith("job-")
                          ? "REQ-2023-" +
                            String(41 + jobs.indexOf(j)).padStart(3, "0")
                          : j.id}
                      </small>
                    </td>
                    <td>{j.department}</td>
                    <td>{j.location}</td>
                    <td>
                      <Badge
                        variant={
                          j.status === "Open"
                            ? "success"
                            : j.status === "Draft"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {j.status === "Open"
                          ? "Active"
                          : j.status === "Archived"
                            ? "Closed"
                            : "Draft"}
                      </Badge>
                    </td>
                    <td>{j.status === "Draft" ? "—" : j.applicants}</td>
                    <td>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={"Manage " + j.title}
                        aria-expanded={expanded === j.id}
                        onClick={() =>
                          setExpanded(expanded === j.id ? null : j.id)
                        }
                      >
                        <Pencil size={16} />
                      </Button>
                    </td>
                  </tr>
                  {expanded === j.id ? (
                    <tr className="job-expanded">
                      <td colSpan={6}>
                        <h2>{j.title}</h2>
                        <p>
                          {j.description || "No description has been added."}
                        </p>
                        <p>Closing date: {j.closingDate}</p>
                        <fieldset disabled={isSaving}>
                            <div className="flex flex-wrap gap-2">
                              <Button asChild size="sm" variant="outline">
                                <Link to={"/jobs/" + j.id + "/edit"}>Edit job details</Link>
                              </Button>

                              {j.status === "Draft" && (
                                <Button type="button" size="sm" onClick={() => void runAction(() => onStatusChange(j.id, "Open"))}>
                                  Publish
                                </Button>
                              )}
                              {j.status === "Open" && (
                                <Button type="button" size="sm" variant="outline" onClick={() => void runAction(() => onStatusChange(j.id, "Draft"))}>
                                  Unpublish
                                </Button>
                              )}
                              <Button type="button" variant="outline" size="sm"
                                onClick={() => void runAction(() => onStatusChange(j.id, j.status === "Archived" ? "Draft" : "Archived"))}>
                                {j.status === "Archived" ? "Restore as draft" : "Archive"}
                              </Button>
                            </div>
                        </fieldset>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
          {!filtered.length ? (
            <p className="empty-message">
              No jobs match your search. Try changing the filters.
            </p>
          ) : null}
        </div>
        {/* Supporting links, pagination, or secondary screen actions. */}
        <footer className="table-pagination">
          <span>
            Showing {filtered.length ? page * 8 + 1 : 0} to{" "}
            {Math.min((page + 1) * 8, filtered.length)} of {filtered.length}{" "}
            entries
          </span>
          <div>
            <Button
              size="sm"
              variant="outline"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={(page + 1) * 8 >= filtered.length}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
