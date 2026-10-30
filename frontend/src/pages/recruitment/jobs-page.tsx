import { Fragment, useMemo, useState, type FormEvent } from "react";
import { Plus, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { PageHeader } from "@/components/Layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { Job, JobStatus } from "@/types/hr";

import "../pages.css";

type JobsPageProps = {
  jobs: Job[];
  onStatusChange: (jobId: string, status: JobStatus) => void;
};

function getStatusVariant(status: JobStatus) {
  if (status === "Open") return "success";
  if (status === "Draft") return "warning";
  return "neutral";
}

export function JobsPage({ jobs, onStatusChange }: JobsPageProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  const filteredJobs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [job.title, job.department, job.location, job.employmentType]
          .some((value) => value.toLowerCase().includes(normalizedSearch));
      const matchesStatus = statusFilter === "All statuses" || job.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [jobs, search, statusFilter]);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Recruitment"
        title="Job Management"
        description="Overview of open requisitions, drafts, and closed positions."
        className="page-heading"
        action={
          <Button asChild>
            <Link to="/jobs/new">Post New Job</Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="search-row">
            <div className="search-field">
              <Search aria-hidden="true" size={16} />
              <Input
                aria-label="Search jobs"
                placeholder="Search title, department, or location"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <label>
              <span className="sr-only">Filter by job status</span>
              <select className="form-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option>All statuses</option>
                <option>Open</option>
                <option>Draft</option>
                <option>Archived</option>
              </select>
            </label>
          </div>

          {filteredJobs.length === 0 ? (
            <p className="empty-message">No jobs match your search. Try changing the search or status filter.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Applicants</TableHead>
                  <TableHead>Closing date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.map((job) => (
                  <Fragment key={job.id}>
                    <TableRow>
                      <TableCell>
                        <strong>{job.title}</strong>
                        <div className="text-sm text-[var(--color-text-secondary)]">{job.department} · {job.employmentType}</div>
                      </TableCell>
                      <TableCell>{job.location}</TableCell>
                      <TableCell>{job.applicants}</TableCell>
                      <TableCell>{job.closingDate}</TableCell>
                      <TableCell><Badge variant={getStatusVariant(job.status)}>{job.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            aria-expanded={expandedJobId === job.id}
                            onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
                          >
                            {expandedJobId === job.id ? "Hide details" : "Details"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onStatusChange(job.id, job.status === "Archived" ? job.previousStatus ?? "Draft" : "Archived")}
                          >
                            {job.status === "Archived" ? "Restore" : "Archive"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedJobId === job.id ? (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <strong>Job description</strong>
                          <p className="mb-0 mt-2 text-sm text-[var(--color-text-secondary)]">
                            {job.description || "No description has been added."}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          )}
          <p className="demo-note">{filteredJobs.length} job{filteredJobs.length === 1 ? "" : "s"} shown</p>
        </CardContent>
      </Card>
    </div>
  );
}

type NewJobPageProps = {
  onCreate: (job: Omit<Job, "id" | "applicants">) => void;
};

export function NewJobPage({ onCreate }: NewJobPageProps) {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const department = String(form.get("department") ?? "").trim();
    const location = String(form.get("location") ?? "").trim();
    const employmentType = String(form.get("employmentType") ?? "");
    const closingDate = String(form.get("closingDate") ?? "");
    const description = String(form.get("description") ?? "").trim();

    if (!title || !department || !location || !employmentType || !closingDate) {
      setError("Please complete all required fields.");
      return;
    }

    onCreate({
      title,
      department,
      location,
      employmentType,
      closingDate,
      description,
      status: "Draft",
    });
    navigate("/jobs");
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Recruitment"
        title="Create New Job"
        description="Define the role parameters and configure AI screening criteria."
        className="page-heading"
      />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-field">
                <Label htmlFor="job-title">Job title *</Label>
                <Input id="job-title" name="title" required placeholder="e.g. Frontend Engineer" />
              </div>

              <div className="form-field">
                <Label htmlFor="job-department">Department *</Label>
                <Input id="job-department" name="department" required placeholder="e.g. Technology" />
              </div>

              <div className="form-field">
                <Label htmlFor="job-location">Location *</Label>
                <Input id="job-location" name="location" required placeholder="e.g. Hetauda" />
              </div>

              <div className="form-field">
                <Label htmlFor="job-type">Employment type *</Label>
                <select id="job-type" name="employmentType" className="form-select" required defaultValue="">
                  <option value="" disabled>Select a type</option>
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                  <option>Internship</option>
                </select>
              </div>

              <div className="form-field">
                <Label htmlFor="job-closing-date">Closing date *</Label>
                <Input id="job-closing-date" name="closingDate" type="date" required />
              </div>

              <div className="form-field form-field-wide">
                <Label htmlFor="job-description">Description</Label>
                <Textarea id="job-description" name="description" placeholder="Describe the role and its responsibilities." />
              </div>
            </div>

            <section className="job-ai-section">
              <div className="job-ai-heading"><div><p className="section-label">AI Screening Configuration</p><p>Define the parameters used to score and rank applicants.</p></div><Badge variant="success">Active engine</Badge></div>
              <div className="job-skill-grid">
                <div className="job-skill-box"><div><strong>Required Skills</strong><Badge variant="danger">Must have</Badge></div><div className="job-skill-input"><Input placeholder="e.g. Python" /><select className="form-select" defaultValue="5"><option value="5">Wt: 5</option><option value="4">Wt: 4</option></select><Button type="button" variant="outline" size="icon" aria-label="Add required skill"><Plus aria-hidden="true" /></Button></div><Badge variant="default">Python Development · W: 5</Badge><Badge variant="default">System Architecture · W: 4</Badge></div>
                <div className="job-skill-box"><div><strong>Preferred Skills</strong><Badge variant="success">Nice to have</Badge></div><div className="job-skill-input"><Input placeholder="e.g. AWS Certification" /><select className="form-select" defaultValue="2"><option value="2">Wt: 2</option><option value="1">Wt: 1</option></select><Button type="button" variant="outline" size="icon" aria-label="Add preferred skill"><Plus aria-hidden="true" /></Button></div><Badge variant="neutral">Docker/Kubernetes · W: 2</Badge></div>
              </div>
              <div className="job-ai-footer"><div className="form-field"><Label htmlFor="vacancy-count">Vacancy count</Label><Input id="vacancy-count" name="vacancyCount" type="number" min="1" defaultValue="1" /></div><div className="form-field"><Label htmlFor="shortlist-multiplier">Shortlist multiplier</Label><Input id="shortlist-multiplier" name="shortlistMultiplier" type="number" min="1" defaultValue="5" /></div></div>
            </section>

            {error ? <p role="alert" className="mt-4 text-sm text-[var(--color-status-danger)]">{error}</p> : null}

            <div className="form-actions">
              <Button type="button" variant="outline" onClick={() => navigate("/jobs")}>Cancel</Button>
              <Button type="submit">Save as draft</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <p className="demo-note">Frontend demo only. This draft is kept in memory and will reset when the app reloads.</p>
    </div>
  );
}
