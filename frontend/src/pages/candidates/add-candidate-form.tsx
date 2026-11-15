import { useRef, useState, type FormEvent } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/shared/forms/form-field";
import { FileUploadField } from "@/components/shared/forms/file-upload-field";
import { FeedbackMessage } from "@/components/shared/feedback/feedback-message";
import { addPipelineCandidate } from "@/data/candidate-pipeline-api";

export function AddCandidateForm({
  jobId,
  jobTitle,
  onCreated,
  onCancel,
  onBusyChange,
}: {
  jobId: string;
  jobTitle: string;
  onCreated: () => void;
  onCancel: () => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  const requestId = useRef<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    const data = new FormData(event.currentTarget);
    const resume = data.get("resume");
    if (
      !(resume instanceof File) ||
      !resume.size ||
      resume.size > 10 * 1024 * 1024 ||
      !/\.(pdf|docx)$/i.test(resume.name)
    ) {
      setError("Choose a PDF or DOCX file up to 10MB.");
      return;
    }
    requestId.current ??= crypto.randomUUID();
    data.set("requestId", requestId.current);
    data.set("jobId", jobId);
    busy.current = true;
    setSaving(true);
    onBusyChange(true);
    setError("");
    let created = false;
    try {
      await addPipelineCandidate(data);
      created = true;
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not add the candidate. Please try again.",
      );
    } finally {
      busy.current = false;
      setSaving(false);
      onBusyChange(false);
    }
    if (created) onCreated();
  }

  return (
    <Card id="add-candidate-panel" className="add-candidate-panel">
      <CardHeader>
        <h2>Add Candidate</h2>
        <p>Application for {jobTitle}. Starts in Applied.</p>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={submit}
          aria-busy={saving}
          onChange={() => {
            // A changed payload needs a new reference; an unchanged network retry keeps it.
            if (!busy.current) {
              requestId.current = null;
              setError("");
            }
          }}
        >
          <fieldset disabled={saving} className="add-candidate-fields">
            <FormField htmlFor="pipeline-full-name" label="Full name">
              <Input
                id="pipeline-full-name"
                name="fullName"
                autoComplete="name"
                maxLength={200}
                required
              />
            </FormField>
            <FormField htmlFor="pipeline-email" label="Email">
              <Input
                id="pipeline-email"
                name="email"
                type="email"
                autoComplete="email"
                maxLength={254}
                required
              />
            </FormField>
            <FormField htmlFor="pipeline-phone" label="Phone">
              <Input
                id="pipeline-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                minLength={5}
                maxLength={50}
                required
              />
            </FormField>
            <FormField htmlFor="pipeline-resume" label="CV / Resume">
              <FileUploadField
                id="pipeline-resume"
                name="resume"
                accept=".pdf,.docx"
                aria-describedby="pipeline-resume-hint"
                required
              />
              <small id="pipeline-resume-hint">PDF or DOCX, up to 10MB.</small>
            </FormField>
            <FormField
              htmlFor="pipeline-cover-letter"
              label="Cover letter (optional)"
            >
              <Textarea
                id="pipeline-cover-letter"
                name="coverLetter"
                maxLength={10000}
              />
            </FormField>
            {error && <FeedbackMessage role="alert">{error}</FeedbackMessage>}
            <div className="add-candidate-actions">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">
                {saving ? "Adding candidate…" : "Add Candidate"}
              </Button>
            </div>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  );
}
