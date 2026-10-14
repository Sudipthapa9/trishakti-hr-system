export type JobStatus = "Open" | "Draft" | "Archived";

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
  previousStatus?: Exclude<JobStatus, "Archived">;
};

export type CandidateStage = "Review" | "Shortlisted" | "Interview" | "Offer";

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
