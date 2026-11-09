import { useEffect, useState } from "react";

type PublicJob = {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  description: string | null;
  responsibilities: string;
  closingDate: string | null;
};

type JobsResult =
  | { status: "loading" }
  | { status: "error" }
  | { status: "success"; jobs: PublicJob[] };

export function usePublicJobs() {
  const [result, setResult] = useState<JobsResult>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    async function loadJobs() {
      try {
        const base = import.meta.env.VITE_API_URL || "http://localhost:4000";
        const response = await fetch(base.replace(/\/$/, "") + "/api/jobs/public", {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Could not load jobs");

        const data: { jobs: PublicJob[] } = await response.json();
        if (!Array.isArray(data.jobs)) throw new Error("Invalid jobs response");
        if (!controller.signal.aborted) {
          setResult({ status: "success", jobs: data.jobs });
        }
      } catch {
        if (!controller.signal.aborted) setResult({ status: "error" });
      }
    }

    void loadJobs();
    return () => controller.abort();
  }, []);

  return result;
}
