/**
 * Collects job details and weighted skill settings, then saves a draft through the jobs API.
 */
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Job } from "@/types/hr";
import {
  BriefcaseBusiness,
  FileText,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import "./new-job-page.css";
// Define Skill so callers and implementations agree on the required data shape.
type Skill = { name: string; weight: number };
// Manage one weighted skill list through parent callbacks, rejecting empty and duplicate additions.
function SkillEditor({
  preferred = false,
  value,
  onChange,
}: {
  preferred?: boolean;
  value: Skill[];
  onChange: (v: Skill[]) => void;
}) {
  // Keep name in component state; updates trigger a render.
  const [name, setName] = useState("");
  // Keep weight in component state; updates trigger a render.
  const [weight, setWeight] = useState(preferred ? 1 : 5);
  return (
    <section className="job-skill-box">
      {/* Page or panel heading and contextual actions. */}
      <header>
        <h3>{preferred ? "Preferred Skills" : "Required Skills"}</h3>
        <Badge variant={preferred ? "success" : "danger"}>
          {preferred ? "Nice to Have" : "Must Have"}
        </Badge>
      </header>
      <div className="job-skill-input">
        <Input
          aria-label={preferred ? "Preferred skill" : "Required skill"}
          placeholder={preferred ? "e.g. AWS Certification" : "e.g. Python"}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select
          aria-label={
            preferred ? "Preferred skill weight" : "Required skill weight"
          }
          className="form-select"
          value={weight}
          onChange={(e) => setWeight(Number(e.target.value))}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              Wt: {n}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={preferred ? "Add preferred skill" : "Add required skill"}
          onClick={() => {
            if (
              name.trim() &&
              !value.some(
                (s) => s.name.toLowerCase() === name.trim().toLowerCase(),
              )
            ) {
              onChange([...value, { name: name.trim(), weight }]);
              setName("");
            }
          }}
        >
          <Plus />
        </Button>
      </div>
      <div className="job-skill-tags">
        {value.map((s, i) => (
          <Badge key={s.name} variant={preferred ? "neutral" : "default"}>
            {s.name}
            <span>W: {s.weight}</span>
            <button
              type="button"
              aria-label={"Remove " + s.name}
              onClick={() => onChange(value.filter((_, n) => n !== i))}
            >
              <X size={11} />
            </button>
          </Badge>
        ))}
      </div>
    </section>
  );
}
// Collects job details and weighted skill settings, then saves a draft through the jobs API.
export function NewJobPage({
  onCreate,
  initialJob,
}: {
  initialJob?: Job;
  onCreate: (job: Omit<Job, "id" | "applicants">) => Promise<void>;
}) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Keep required in component state; updates trigger a render.
  const [required, setRequired] = useState<Skill[]>(initialJob?.requiredSkills ?? [
    { name: "Python Development", weight: 5 },
    { name: "System Architecture", weight: 4 },
  ]);
  // Keep preferred in component state; updates trigger a render.
  const [preferred, setPreferred] = useState<Skill[]>(initialJob?.preferredSkills ?? [
    { name: "Docker/Kubernetes", weight: 2 },
  ]);
  // Await the saved draft before navigating; keep entered values on failure.
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;
    const d = new FormData(e.currentTarget);
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onCreate({
        title: String(d.get("title") ?? "").trim(),
        department: String(d.get("department") ?? ""),
        location: String(d.get("location") ?? "").trim(),
        employmentType: String(d.get("employmentType") ?? ""),
        description: String(d.get("description") ?? ""),
        closingDate: String(d.get("closingDate") ?? ""),
        responsibilities: String(d.get("responsibilities") ?? ""),
        requiredSkills: required,
        preferredSkills: preferred,
        vacancies: Number(d.get("vacancies")),
        shortlistMultiplier: Number(d.get("shortlistMultiplier")),
        status: "Draft",
    });
      navigate("/jobs");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not save the draft.");
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <div className="page-recruitment-new-job-page">
      <div className="page-stack">
        <div className="page-heading">
          <div>
            <h1>{initialJob ? "Edit Job" : "Create New Job"}</h1>
            <p>
              Define the role parameters and configure AI screening criteria.
            </p>
          </div>
        </div>
        {/* Collect inputs; the submit handler controls validation and the resulting local action. */}
        <form className="new-job-form" onSubmit={submit} aria-busy={isSubmitting}>
          {submitError && <p role="alert">{submitError}</p>}
          <fieldset disabled={isSubmitting} className="contents">
          {/* Group related content and controls in this screen section. */}
          <section>
            <h2>
              <BriefcaseBusiness size={17} />
              Job Information
            </h2>
            <div className="job-information">
              <div className="form-field job-title">
                <Label htmlFor="job-title">Job Title</Label>
                <Input
                  name="title" defaultValue={initialJob?.title ?? ""}
                  id="job-title"
                  placeholder="e.g. Senior Machine Learning Engineer"
                  required
                />
              </div>
              <div className="form-field">
                <Label htmlFor="job-department">Department</Label>
                <select
                  id="job-department"
                  name="department"
                  className="form-select"
                  defaultValue={initialJob?.department ?? ""}
                  required
                >
                  <option value="" disabled>
                    Select department
                  </option>
                  {initialJob?.department && <option value={initialJob.department}>{initialJob.department}</option>}
                  {[
                    "Human Resources",
                    "Manufacturing",
                    "Quality Assurance",
                    "Sales",
                    "Supply Chain",
                    "Operations",
                    "R&D",
                    "Maintenance",
                    "Technology",
                  ].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <Label htmlFor="job-type">Employment Type</Label>
                <select
                  name="employmentType" defaultValue={initialJob?.employmentType ?? "Full-Time"}
                  id="job-type"
                  className="form-select"
                >
                  {initialJob?.employmentType && <option value={initialJob.employmentType}>{initialJob.employmentType}</option>}
                  <option>Full-Time</option>
                  <option>Part-Time</option>
                  <option>Contract</option>
                  <option>Internship</option>
                </select>
              </div>
              <div className="form-field">
                <Label htmlFor="job-location">Location</Label>
                <Input
                  name="location" defaultValue={initialJob?.location ?? ""}
                  id="job-location"
                  placeholder="e.g. San Francisco, CA (or Remote)"
                  required
                />
              </div>
              <div className="form-field">
                <Label htmlFor="job-closing">Closing Date</Label>
                <Input
                  type="date"
                  name="closingDate" defaultValue={initialJob?.closingDate ?? ""}
                  id="job-closing"
                />
              </div>
            </div>
          </section>
          {/* Group related content and controls in this screen section. */}
          <section className="job-role-details">
            <h2>
              <FileText size={17} />
              Role Details
            </h2>
            <div className="form-field">
              <Label htmlFor="job-description">Job Description</Label>
              <Textarea
                name="description" defaultValue={initialJob?.description ?? ""}
                id="job-description"
                placeholder="Describe the overarching purpose of the role..."
                className="job-description"
                required
              />
            </div>
            <div className="form-field">
              <Label htmlFor="job-responsibilities">Key Responsibilities</Label>
              <Textarea
                name="responsibilities" defaultValue={initialJob?.responsibilities ?? ""}
                id="job-responsibilities"
                placeholder="Enter responsibilities as a bulleted list..."
                className="job-description"
              />
            </div>
          </section>
          {/* Additional settings will be enabled when database persistence is available. */}
          <section className="job-ai-section">
            {/* Page or panel heading and contextual actions. */}
            <header className="job-ai-heading">
              <div>
                <h2>
                  <Sparkles size={17} />
                  AI Screening Configuration
                </h2>
                <p>
                  Define the specific parameters the AI engine will use to score
                  and rank applicants. Assign higher weights to critical
                  requirements.
                </p>
              </div>
              <Badge variant="neutral">Active Engine</Badge>
            </header>
            <div className="job-skill-grid">
              <SkillEditor value={required} onChange={setRequired} />
              <SkillEditor
                preferred
                value={preferred}
                onChange={setPreferred}
              />
            </div>
            <div className="job-ai-footer">
              <div className="form-field">
                <Label htmlFor="job-vacancies">Vacancy Count</Label>
                <Input
                  name="vacancies"
                  id="job-vacancies"
                  type="number"
                  min="1"
                  max="10000"
                  defaultValue={initialJob?.vacancies ?? 1}
                  required
                />
                <small>Number of open positions for this role.</small>
              </div>
              <div className="form-field">
                <Label htmlFor="job-multiplier">Shortlist Multiplier</Label>
                <Input
                  name="shortlistMultiplier"
                  id="job-multiplier"
                  type="number"
                  min="1"
                  max="100"
                  defaultValue={initialJob?.shortlistMultiplier ?? 5}
                  required
                />
                <small>
                  Target number of candidates to shortlist per vacancy (e.g.
                  5×).
                </small>
              </div>
            </div>
          </section>
          <div className="form-actions">
            <Button type="submit" name="action" value="draft" variant="outline">
              {isSubmitting ? "Saving…" : initialJob ? "Save Changes" : "Save Draft"}
            </Button>

          </div>
          </fieldset>
        </form>
        <p className="demo-note">
          New jobs are saved as drafts. Publish them from the Jobs list when ready. Screening settings are stored for later use by the screening service.
        </p>
      </div>
    </div>
  );
}
