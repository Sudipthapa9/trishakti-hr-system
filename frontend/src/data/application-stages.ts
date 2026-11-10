export const applicationStages = [
  "Review", "Screening", "Shortlisted", "Interview", "Offer",
  "Hired", "Rejected", "Withdrawn",
] as const;

export type ApplicationStage = typeof applicationStages[number];
