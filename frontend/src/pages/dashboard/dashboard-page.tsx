import { ArrowRight, BriefcaseBusiness, CalendarDays, FileText, UserRoundCheck } from "lucide-react";
import { Link } from "react-router-dom";

import { CandidateTable } from "@/components/HR/candidate-table";
import { SummaryCard } from "@/components/HR/summary-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
          <p className="section-label">Today, Oct 24</p>
          <h1>Dashboard Overview</h1>
          <p>Here is what's happening with your hiring pipeline today.</p>
        </div>
        <Button asChild variant="outline"><Link to="/dashboard"><CalendarDays aria-hidden="true" /> Today, Oct 24</Link></Button>
      </div>

      <section className="metric-grid" aria-label="HR summary">
        <SummaryCard label="Total Applications" value="124" change="+12% from last month" badgeLabel="↗ +12%" badgeTone="success" icon={FileText} />
        <SummaryCard label="Open Jobs" value={String(openJobs)} change="Active requisitions" badgeLabel="0%" badgeTone="neutral" icon={BriefcaseBusiness} />
        <SummaryCard label="Upcoming Interviews" value="8" change="Action needed" badgeLabel="Action needed" badgeTone="danger" icon={CalendarDays} />
        <SummaryCard label="Pending Onboarding" value="5" change="Candidates in progress" badgeLabel="In progress" badgeTone="default" icon={UserRoundCheck} />
      </section>

      <section className="dashboard-grid">
        <Card className="pipeline-panel">
          <CardHeader className="panel-heading">
            <div><CardTitle>Hiring Pipeline Velocity</CardTitle><p>Application volume over the last 30 days</p></div>
            <select className="form-select" defaultValue="Last 30 Days" aria-label="Pipeline time range"><option>Last 30 Days</option><option>Last 7 Days</option></select>
          </CardHeader>
          <CardContent><div className="pipeline-chart" aria-label="Hiring pipeline chart"><div className="chart-grid-lines" /><div className="chart-curve"><span /><span /><span /><span /><span /></div><div className="chart-labels"><span>Oct 5</span><span>Oct 10</span><span>Oct 15</span><span>Oct 20</span></div></div></CardContent>
        </Card>
        <QuickActions />
      </section>

      <section className="content-grid">
        <Card>
          <CardHeader className="panel-heading"><div><p className="section-label">Pipeline</p><CardTitle>Recent Candidates</CardTitle></div><Button asChild variant="ghost" size="sm"><Link to="/candidates">View all <ArrowRight aria-hidden="true" /></Link></Button></CardHeader>
          <CardContent><CandidateTable candidates={candidates.slice(0, 4)} /></CardContent>
        </Card>
        <UpcomingInterviews />
      </section>
    </div>
  );
}
function QuickActions() {
  return <Card className="quick-actions"><CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader><CardContent><div className="quick-action-grid"><Link to="/jobs/new"><BriefcaseBusiness aria-hidden="true" />Create Job</Link><Link to="/candidates"><UserRoundCheck aria-hidden="true" />Review Candidates</Link><Link to="/screening"><FileText aria-hidden="true" />AI Screening</Link><Link to="/interviews"><CalendarDays aria-hidden="true" />Schedule Interview</Link></div><Button asChild className="w-full"><Link to="/onboarding/eleanor-shellstrop">Continue Onboarding (5)</Link></Button></CardContent></Card>;
}
function UpcomingInterviews() {
  return <Card className="upcoming-interviews"><CardHeader><CardTitle>Upcoming Interviews</CardTitle></CardHeader><CardContent><div className="upcoming-interview-list">{[["10:00", "Sarah Jenkins", "Product Manager"], ["01:30", "Marcus Chen", "Senior Developer"], ["03:00", "Elena Rodriguez", "UX Researcher"]].map(([time, name, role]) => <div key={name} className="upcoming-interview"><strong>{time}<small>PM</small></strong><span><b>{name}</b><small>{role}</small></span><CalendarDays aria-hidden="true" size={17} /></div>)}</div><Button asChild variant="ghost" size="sm"><Link to="/interviews">View full schedule <ArrowRight aria-hidden="true" /></Link></Button></CardContent></Card>;
}

