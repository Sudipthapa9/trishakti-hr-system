import type { Candidate, Job } from "@/types/hr";

export const initialJobs: Job[] = [
  {
    id: "job-1",
    title: "Frontend Engineer",
    department: "Technology",
    location: "Hetauda",
    employmentType: "Full-time",
    applicants: 42,
    status: "Open",
    closingDate: "2026-11-15",
  },
  {
    id: "job-2",
    title: "Operations Manager",
    department: "Operations",
    location: "Hetauda",
    employmentType: "Full-time",
    applicants: 27,
    status: "Open",
    closingDate: "2026-11-20",
  },
  {
    id: "job-3",
    title: "HR Associate",
    department: "People",
    location: "Kathmandu",
    employmentType: "Full-time",
    applicants: 18,
    status: "Open",
    closingDate: "2026-11-28",
  },
  {
    id: "job-4",
    title: "Account Manager",
    department: "Finance",
    location: "Hetauda",
    employmentType: "Contract",
    applicants: 12,
    status: "Draft",
    closingDate: "2026-12-01",
  },
];

export const initialCandidates: Candidate[] = [
  {
    id: "candidate-1",
    name: "Aarati Gurung",
    email: "aarati.gurung@example.com",
    role: "Frontend Engineer",
    location: "Hetauda",
    score: 96,
    stage: "Shortlisted",
    updated: "2 hours ago",
  },
  {
    id: "candidate-2",
    name: "Nishan Khatri",
    email: "nishan.khatri@example.com",
    role: "Operations Manager",
    location: "Kathmandu",
    score: 89,
    stage: "Interview",
    updated: "Yesterday",
  },
  {
    id: "candidate-3",
    name: "Sabin Sharma",
    email: "sabin.sharma@example.com",
    role: "HR Associate",
    location: "Hetauda",
    score: 94,
    stage: "Offer",
    updated: "Yesterday",
  },
  {
    id: "candidate-4",
    name: "Pragya Shrestha",
    email: "pragya.shrestha@example.com",
    role: "Account Manager",
    location: "Kathmandu",
    score: 81,
    stage: "Review",
    updated: "2 days ago",
  },
];

export const demoActivity = [
  { title: "New application received", detail: "Frontend Engineer · Aarati Gurung", time: "10 min ago" },
  { title: "Interview scheduled", detail: "Operations Manager · Nishan Khatri", time: "1 hour ago" },
  { title: "Offer ready for review", detail: "HR Associate · Sabin Sharma", time: "Yesterday" },
];
