/**
 * Describes recruitment records and allowed status values checked by TypeScript during development.
 */
// Define JobStatus so callers and implementations agree on the required data shape.
export type JobStatus = "Open" | "Draft" | "Archived";

// Define Job so callers and implementations agree on the required data shape.
export type Job = {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  applicants: number;
  status: JobStatus;
  closingDate: string;
  description?: string;
  responsibilities?: string;
  requiredSkills?: { name: string; weight: number }[];
  preferredSkills?: { name: string; weight: number }[];
  vacancies?: number;
  shortlistMultiplier?: number;
  previousStatus?: Exclude<JobStatus, "Archived">;
};

// Define CandidateStage so callers and implementations agree on the required data shape.
export type CandidateStage =
  "Review" | "Screening" | "Shortlisted" | "Interview" | "Offer";

// Define Candidate so callers and implementations agree on the required data shape.
export type Candidate = {
  id: string;
  name: string;
  email: string;
  role: string;
  location: string;
  score: number;
  stage: CandidateStage;
  updated: string;
};
