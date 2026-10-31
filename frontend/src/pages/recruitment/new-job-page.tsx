/**
 * Collects job details and weighted skill settings, then creates a draft or published job in local state.
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
  Send,
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
// Collects job details and weighted skill settings, then creates a draft or published job in local state.
export function NewJobPage({
  onCreate,
}: {
  onCreate: (job: Omit<Job, "id" | "applicants">) => void;
}) {
  const navigate = useNavigate();
  // Keep required in component state; updates trigger a render.
  const [required, setRequired] = useState<Skill[]>([
    { name: "Python Development", weight: 5 },
    { name: "System Architecture", weight: 4 },
  ]);
  // Keep preferred in component state; updates trigger a render.
  const [preferred, setPreferred] = useState<Skill[]>([
    { name: "Docker/Kubernetes", weight: 2 },
  ]);
  // Read the job form and submit its draft/published status through the workspace callback.
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const submitter = (e.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null;
    onCreate({
      title: String(d.get("title")).trim(),
      department: String(d.get("department")),
      location: String(d.get("location")).trim(),
      employmentType: String(d.get("employmentType")),
      closingDate: String(d.get("closingDate")),
      description: String(d.get("description")),
      responsibilities: String(d.get("responsibilities")),
      requiredSkills: required,
      preferredSkills: preferred,
      vacancies: Number(d.get("vacancies")),
      shortlistMultiplier: Number(d.get("shortlistMultiplier")),
      status: submitter?.value === "publish" ? "Open" : "Draft",
    });
    navigate("/jobs");
  }
  return (
    <div className="page-recruitment-new-job-page">
      <div className="page-stack">
        <div className="page-heading">
          <div>
            <h1>Create New Job</h1>
            <p>
              Define the role parameters and configure AI screening criteria.
            </p>
          </div>
        </div>
        {/* Collect inputs; the submit handler controls validation and the resulting local action. */}
        <form className="new-job-form" onSubmit={submit}>
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
                  name="title"
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
                  defaultValue=""
                  required
                >
                  <option value="" disabled>
                    Select department
                  </option>
                  {[
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
                  name="employmentType"
                  id="job-type"
                  className="form-select"
                >
                  <option>Full-Time</option>
                  <option>Part-Time</option>
                  <option>Contract</option>
                  <option>Internship</option>
                </select>
              </div>
              <div className="form-field">
                <Label htmlFor="job-location">Location</Label>
                <Input
                  name="location"
                  id="job-location"
                  placeholder="e.g. San Francisco, CA (or Remote)"
                  required
                />
              </div>
              <div className="form-field">
                <Label htmlFor="job-closing">Closing Date</Label>
                <Input
                  type="date"
                  name="closingDate"
                  id="job-closing"
                  required
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
                name="description"
                id="job-description"
                placeholder="Describe the overarching purpose of the role..."
                className="job-description"
                required
              />
            </div>
            <div className="form-field">
              <Label htmlFor="job-responsibilities">Key Responsibilities</Label>
              <Textarea
                name="responsibilities"
                id="job-responsibilities"
                placeholder="Enter responsibilities as a bulleted list..."
                className="job-description"
              />
            </div>
          </section>
          {/* Group related content and controls in this screen section. */}
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
                  defaultValue="2"
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
                  defaultValue="5"
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
              Save Draft
            </Button>
            <Button type="submit" name="action" value="publish">
              <Send />
              Publish Job
            </Button>
          </div>
        </form>
        <p className="demo-note">
          Jobs and screening settings are saved in local React state only.
        </p>
      </div>
    </div>
  );
}
