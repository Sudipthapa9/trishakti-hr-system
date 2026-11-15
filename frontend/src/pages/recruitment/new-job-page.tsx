import { PageHeader } from "@/components/Layout/page-header";
import { FormField } from "@/components/shared/forms/form-field";
import { NativeSelect } from "@/components/ui/native-select";
import { FeedbackMessage } from "@/components/shared/feedback/feedback-message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import "./new-job-page.css";
type Skill = { name: string; weight: number };

const departments = [
  "Human Resources",
  "Manufacturing",
  "Quality Assurance",
  "Sales",
  "Supply Chain",
  "Operations",
  "R&D",
  "Maintenance",
  "Technology",
];
const employmentTypes = ["Full-Time", "Part-Time", "Contract", "Internship"];

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
  const [name, setName] = useState("");
  const [weight, setWeight] = useState(preferred ? 1 : 5);
  return (
    <section className="job-skill-box">
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
        <NativeSelect
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
        </NativeSelect>
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
export function NewJobPage({
  onCreate,
  initialJob,
}: {
  initialJob?: Job;
  onCreate: (job: Omit<Job, "id" | "applicants">) => Promise<void>;
}) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAction, setSubmitAction] = useState<"draft" | "publish">(
    "draft",
  );
  const busy = useRef(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [required, setRequired] = useState<Skill[]>(
    initialJob?.requiredSkills ?? [
      { name: "Python Development", weight: 5 },
      { name: "System Architecture", weight: 4 },
    ],
  );
  const [preferred, setPreferred] = useState<Skill[]>(
    initialJob?.preferredSkills ?? [{ name: "Docker/Kubernetes", weight: 2 }],
  );
  // Use the clicked submit button; pressing Enter defaults to saving a draft.
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy.current) return;
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    const action =
      !initialJob &&
      submitter instanceof HTMLButtonElement &&
      submitter.value === "publish"
        ? "publish"
        : "draft";
    const d = new FormData(e.currentTarget);
    busy.current = true;
    setSubmitAction(action);
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
        status: action === "publish" ? "Open" : "Draft",
      });
      navigate("/jobs");
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : action === "publish"
            ? "Could not publish the job."
            : "Could not save the job.",
      );
    } finally {
      busy.current = false;
      setIsSubmitting(false);
    }
  }
  return (
    <div className="page-recruitment-new-job-page">
      <div className="page-stack">
        <PageHeader
          title={initialJob ? "Edit Job" : "Create New Job"}
          description="Define the role parameters and configure AI screening criteria."
        />
        <form
          className="new-job-form"
          onSubmit={submit}
          aria-busy={isSubmitting}
        >
          {submitError && (
            <FeedbackMessage role="alert">{submitError}</FeedbackMessage>
          )}
          <fieldset disabled={isSubmitting} className="contents">
            <section>
              <h2>
                <BriefcaseBusiness size={17} />
                Job Information
              </h2>
              <div className="job-information">
                <FormField
                  className="job-title"
                  htmlFor="job-title"
                  label="Job Title"
                >
                  <Input
                    name="title"
                    defaultValue={initialJob?.title ?? ""}
                    id="job-title"
                    placeholder="e.g. Senior Machine Learning Engineer"
                    required
                  />
                </FormField>
                <FormField htmlFor="job-department" label="Department">
                  <NativeSelect
                    id="job-department"
                    name="department"
                    className="form-select"
                    defaultValue={initialJob?.department ?? ""}
                    required
                  >
                    <option value="" disabled>
                      Select department
                    </option>
                    {initialJob?.department &&
                      !departments.includes(initialJob.department) && (
                        <option value={initialJob.department}>
                          {initialJob.department}
                        </option>
                      )}
                    {departments.map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </NativeSelect>
                </FormField>
                <FormField htmlFor="job-type" label="Employment Type">
                  <NativeSelect
                    name="employmentType"
                    defaultValue={initialJob?.employmentType ?? "Full-Time"}
                    id="job-type"
                    className="form-select"
                  >
                    {initialJob?.employmentType &&
                      !employmentTypes.includes(initialJob.employmentType) && (
                        <option value={initialJob.employmentType}>
                          {initialJob.employmentType}
                        </option>
                      )}
                    {employmentTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </NativeSelect>
                </FormField>
                <FormField htmlFor="job-location" label="Location">
                  <Input
                    name="location"
                    defaultValue={initialJob?.location ?? ""}
                    id="job-location"
                    placeholder="e.g. San Francisco, CA (or Remote)"
                    required
                  />
                </FormField>
                <FormField htmlFor="job-closing" label="Closing Date">
                  <Input
                    type="date"
                    name="closingDate"
                    defaultValue={initialJob?.closingDate ?? ""}
                    id="job-closing"
                  />
                </FormField>
              </div>
            </section>
            <section className="job-role-details">
              <h2>
                <FileText size={17} />
                Role Details
              </h2>
              <FormField htmlFor="job-description" label="Job Description">
                <Textarea
                  name="description"
                  defaultValue={initialJob?.description ?? ""}
                  id="job-description"
                  placeholder="Describe the overarching purpose of the role..."
                  className="job-description"
                  required
                />
              </FormField>
              <FormField
                htmlFor="job-responsibilities"
                label="Key Responsibilities"
              >
                <Textarea
                  name="responsibilities"
                  defaultValue={initialJob?.responsibilities ?? ""}
                  id="job-responsibilities"
                  placeholder="Enter responsibilities as a bulleted list..."
                  className="job-description"
                />
              </FormField>
            </section>
            <section className="job-ai-section">
              <header className="job-ai-heading">
                <div>
                  <h2>
                    <Sparkles size={17} />
                    AI Screening Configuration
                  </h2>
                  <p>
                    Define the specific parameters the AI engine will use to
                    score and rank applicants. Assign higher weights to critical
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
                <FormField htmlFor="job-vacancies" label="Vacancy Count">
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
                </FormField>
                <FormField
                  htmlFor="job-multiplier"
                  label="Shortlist Multiplier"
                >
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
                </FormField>
              </div>
            </section>
            <div className="form-actions">
              <Button
                type="submit"
                name="action"
                value="draft"
                variant="outline"
              >
                {isSubmitting && submitAction === "draft"
                  ? "Saving…"
                  : initialJob
                    ? "Save Changes"
                    : "Save Draft"}
              </Button>
              {!initialJob && (
                <Button
                  type="submit"
                  name="action"
                  value="publish"
                  className="publish-job-button"
                >
                  <Send aria-hidden="true" size={18} />
                  {isSubmitting && submitAction === "publish"
                    ? "Publishing…"
                    : "Publish Job"}
                </Button>
              )}
            </div>
          </fieldset>
        </form>
        <p className="demo-note">
          {initialJob
            ? "Saving changes preserves this job's current status."
            : "Save a draft to finish later, or publish the job to make it available on Careers."}{" "}
          Screening settings are stored for later use by the screening service.
        </p>
      </div>
    </div>
  );
}
