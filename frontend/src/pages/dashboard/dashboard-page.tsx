import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { CandidateTable } from "@/components/HR/candidate-table";
import { SummaryCard } from "@/components/HR/summary-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { demoActivity } from "@/data/demo-data";
import type { Candidate, Job } from "@/types/hr";

import "../pages.css";

type DashboardPageProps = {
  jobs: Job[];
  candidates: Candidate[];
};

export function DashboardPage({ jobs, candidates }: DashboardPageProps) {
  const openJobs = jobs.filter((job) => job.status === "Open").length;

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <p className="section-label">Dashboard</p>
          <h1>Talent overview</h1>
          <p>Here is a snapshot of your hiring activity.</p>
        </div>
        <Button asChild>
          <Link to="/jobs/new">Create a job</Link>
        </Button>
      </div>

      <p className="demo-note">Demo data only. This frontend is not connected to the HR API yet.</p>

      <section className="metric-grid" aria-label="HR summary">
        <SummaryCard label="Open positions" value={String(openJobs)} change="Current sample jobs" badgeLabel="Hiring" badgeTone="success" />
        <SummaryCard label="Candidates" value={String(candidates.length)} change="Sample candidate records" badgeLabel="Pipeline" badgeTone="default" />
        <SummaryCard label="Interviews" value="3" change="Scheduled this week" badgeLabel="Upcoming" badgeTone="warning" />
        <SummaryCard label="Employees" value="132" change="Sample employee total" badgeLabel="Team" badgeTone="neutral" />
      </section>

      <section className="content-grid">
        <Card>
          <CardHeader className="panel-heading">
            <div>
              <p className="section-label">Pipeline</p>
              <CardTitle>Recent candidates</CardTitle>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/candidates">
                View all <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <CandidateTable candidates={candidates.slice(0, 4)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <p className="section-label">Latest updates</p>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="activity-list">
              {demoActivity.map((activity) => (
                <li key={activity.title}>
                  <span className="activity-dot" aria-hidden="true" />
                  <span>
                    <strong>{activity.title}</strong>
                    <small>{activity.detail}</small>
                    <small>{activity.time}</small>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
