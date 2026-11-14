import { FilterToolbar } from "@/components/HR/filter-toolbar";
import { StatusBadge } from "@/components/HR/status-badge";
import { PageHeader } from "@/components/Layout/page-header";
import { FeedbackMessage } from "@/components/HR/feedback-message";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

import { PaginationControls } from "@/components/HR/pagination-controls";
/**
 * Lists database jobs and saves edits and status changes through the workspace.
 */
import "./jobs-page.css";
import { Fragment, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      setActionError(
        error instanceof Error ? error.message : "Could not save this job.",
      );
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
      {actionError && (
        <FeedbackMessage role="alert">{actionError}</FeedbackMessage>
      )}
      {feedback && <FeedbackMessage role="status">{feedback}</FeedbackMessage>}
      <div className="page-stack">
        <PageHeader
          className="page-heading"
          title={<>Job Management</>}
          description={
            <>Overview of open requisitions, drafts, and closed positions.</>
          }
          action={
            <>
              <Button asChild>
                <Link to="/jobs/new">
                  <Plus />
                  Post New Job
                </Link>
              </Button>
            </>
          }
        />
        <FilterToolbar className="jobs-toolbar">
          <Label>
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
          </Label>
          <NativeSelect
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
          </NativeSelect>
          <NativeSelect
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
          </NativeSelect>
        </FilterToolbar>
        <div className="jobs-table-wrap">
          {/* Use semantic rows and columns for the tabular records. */}
          <Table className="jobs-table">
            <TableHeader>
              <TableRow>
                {[
                  "Job Title",
                  "Department",
                  "Location",
                  "Status",
                  "Applicants",
                  "Actions",
                ].map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((j) => (
                <Fragment key={j.id}>
                  <TableRow>
                    <TableCell>
                      <strong>{j.title}</strong>
                      <small>
                        {j.id.startsWith("job-")
                          ? "REQ-2023-" +
                            String(41 + jobs.indexOf(j)).padStart(3, "0")
                          : j.id}
                      </small>
                    </TableCell>
                    <TableCell>{j.department}</TableCell>
                    <TableCell>{j.location}</TableCell>
                    <TableCell>
                      <StatusBadge domain="job" status={j.status}>
                        {j.status === "Open"
                          ? "Active"
                          : j.status === "Archived"
                            ? "Closed"
                            : "Draft"}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>
                      {j.status === "Draft" ? "—" : j.applicants}
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                  </TableRow>
                  {expanded === j.id ? (
                    <TableRow className="job-expanded">
                      <TableCell colSpan={6}>
                        <h2>{j.title}</h2>
                        <p>
                          {j.description || "No description has been added."}
                        </p>
                        <p>Closing date: {j.closingDate}</p>
                        <fieldset disabled={isSaving}>
                          <div className="flex flex-wrap gap-2">
                            <Button asChild size="sm" variant="outline">
                              <Link to={"/jobs/" + j.id + "/edit"}>
                                Edit job details
                              </Link>
                            </Button>

                            {j.status === "Draft" && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() =>
                                  void runAction(() =>
                                    onStatusChange(j.id, "Open"),
                                  )
                                }
                              >
                                Publish
                              </Button>
                            )}
                            {j.status === "Open" && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  void runAction(() =>
                                    onStatusChange(j.id, "Draft"),
                                  )
                                }
                              >
                                Unpublish
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                void runAction(() =>
                                  onStatusChange(
                                    j.id,
                                    j.status === "Archived"
                                      ? "Draft"
                                      : "Archived",
                                  ),
                                )
                              }
                            >
                              {j.status === "Archived"
                                ? "Restore as draft"
                                : "Archive"}
                            </Button>
                          </div>
                        </fieldset>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              ))}
            </TableBody>
          </Table>
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
            <PaginationControls
              previousDisabled={page === 0}
              nextDisabled={(page + 1) * 8 >= filtered.length}
              onPrevious={() => setPage((p) => p - 1)}
              onNext={() => setPage((p) => p + 1)}
            ></PaginationControls>
          </div>
        </footer>
      </div>
    </div>
  );
}
