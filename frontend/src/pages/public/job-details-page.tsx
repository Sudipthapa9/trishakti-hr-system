/**
 * Shows a published sample job, validates the selected CV file, and opens a prototype confirmation without uploading it.
 */
import { JobSummary, PublicShell } from "@/components/Layout/public-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Job } from "@/types/hr";
import {
  BriefcaseBusiness,
  FileUp,
  GraduationCap,
  ListChecks,
  Send,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./job-details-page.css";
// Shows a published sample job, validates the selected CV file, and opens a prototype confirmation without uploading it.
export function JobDetailsPage({ jobs }: { jobs: Job[] }) {
  const { jobId } = useParams();
  const job = jobs.find((j) => j.id === jobId && j.status === "Open");
  const navigate = useNavigate();
  // Keep fileName in component state; updates trigger a render.
  const [fileName, setFileName] = useState("");
  // Keep error in component state; updates trigger a render.
  const [error, setError] = useState("");
  // Validate CV file metadata before navigating to a browser-local prototype confirmation.
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    // Inspect the selected file metadata before the prototype confirmation is shown.
    const file = d.get("resume") as File;
    if (
      !file ||
      file.size > 10 * 1024 * 1024 ||
      !/[.](pdf|docx)$/i.test(file.name)
    ) {
      setError("Choose a PDF or DOCX file up to 10MB.");
      return;
    }
    navigate("/careers/" + jobId + "/application/confirmation", {
      state: {
        candidateName: d.get("fullName"),
        jobTitle: job?.title,
        reference:
          "TSH-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
      },
    });
  }
  return (
    <div className="page-public-job-details-page">
      <PublicShell>
        {!job ? (
          <main className="public-job-unavailable">
            <h1>Position unavailable</h1>
            <p>This position is closed or no longer available.</p>
            <Button asChild>
              <Link to="/careers">Return to Job Board</Link>
            </Button>
          </main>
        ) : (
          <main className="public-job-layout">
            <div>
              {/* Page or panel heading and contextual actions. */}
              <header className="public-job-intro">
                <JobSummary job={job} />
                <h1>{job.title}</h1>
                <p>
                  {job.description ??
                    "Lead the design, development, and implementation of innovative and sustainable packaging solutions for Trikshati Poly Packs. Join a team dedicated to engineering excellence."}
                </p>
              </header>
              {/* Group related content and controls in this screen section. */}
              <section className="public-job-section">
                <h2>
                  <BriefcaseBusiness />
                  Job Summary
                </h2>
                <p>
                  As a {job.title} at Trikshati Poly Packs, you will be the
                  cornerstone of our product development cycle, ensuring that
                  our flexible packaging solutions meet stringent quality,
                  sustainability, and performance metrics.
                </p>
                <p>
                  You will collaborate cross-functionally with R&D,
                  manufacturing, and quality assurance to optimize existing
                  materials and pioneer new eco-friendly alternatives.
                </p>
              </section>
              {/* Group related content and controls in this screen section. */}
              <section className="public-job-section">
                <h2>
                  <ListChecks />
                  Key Responsibilities
                </h2>
                <ul>
                  {(job.responsibilities
                    ? job.responsibilities.split("\n").filter(Boolean)
                    : [
                        "Design and develop robust flexible packaging structures tailored to specific client needs.",
                        "Lead root-cause analysis for packaging-related issues in production and implement corrective actions.",
                        "Conduct rigorous material testing, ensuring compliance with ASTM/ISO standards.",
                        "Drive sustainability initiatives, focusing on down-gauging and recyclable structures.",
                        "Mentor junior engineering staff and foster a culture of continuous technical improvement.",
                      ]
                  ).map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ul>
              </section>
              {/* Group related content and controls in this screen section. */}
              <section className="public-job-section">
                <h2>
                  <GraduationCap />
                  Required Qualifications
                </h2>
                <ul>
                  <li>
                    Bachelor's or Master's degree in a relevant engineering or
                    professional field.
                  </li>
                  <li>
                    Relevant hands-on experience in{" "}
                    {job.department.toLowerCase()}.
                  </li>
                  <li>
                    Strong technical knowledge and practical problem-solving
                    skills.
                  </li>
                  <li>
                    Proven track record of managing projects from
                    conceptualization to delivery.
                  </li>
                  <li>
                    Clear communication and commitment to sustainable ways of
                    working.
                  </li>
                </ul>
              </section>
            </div>
            {/* Supporting profile, navigation, or filter content beside the main panel. */}
            <aside className="public-application">
              <h2>Apply Now</h2>
              <p>Submit your application for the {job.title} position.</p>
              {/* Collect inputs; the submit handler controls validation and the resulting local action. */}
              <form onSubmit={submit}>
                <div className="form-field">
                  <Label htmlFor="fullName">
                    Full Name <span>*</span>
                  </Label>
                  <Input
                    name="fullName"
                    id="fullName"
                    autoComplete="name"
                    required
                  />
                </div>
                <div className="form-field">
                  <Label htmlFor="email">
                    Email Address <span>*</span>
                  </Label>
                  <Input
                    type="email"
                    name="email"
                    id="email"
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="form-field">
                  <Label htmlFor="phone">
                    Phone Number <span>*</span>
                  </Label>
                  <Input
                    type="tel"
                    name="phone"
                    id="phone"
                    autoComplete="tel"
                    required
                  />
                </div>
                <div className="form-field">
                  <Label htmlFor="resume">
                    Resume / CV <span>*</span>
                  </Label>
                  <label className="public-resume-upload">
                    <FileUp size={24} />
                    <strong>{fileName || "Upload a file"}</strong>
                    <small>PDF or DOCX up to 10MB</small>
                    <input
                      type="file"
                      name="resume"
                      id="resume"
                      accept=".pdf,.docx"
                      required
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? "resume-error" : undefined}
                      onChange={(e) => {
                        setFileName(e.target.files?.[0]?.name ?? "");
                        setError("");
                      }}
                    />
                  </label>
                </div>
                <div className="form-field">
                  <Label htmlFor="cover-letter">Cover Letter (Optional)</Label>
                  <Textarea name="coverLetter" id="cover-letter" />
                </div>
                {error ? (
                  <p id="resume-error" role="alert">
                    {error}
                  </p>
                ) : null}
                <Button type="submit">
                  Submit Application
                  <Send size={14} />
                </Button>
                <p className="application-preview-note">
                  Preview only. Applications are not submitted to HR yet.
                </p>
              </form>
            </aside>
          </main>
        )}
      </PublicShell>
    </div>
  );
}
