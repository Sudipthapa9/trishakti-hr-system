/**
 * Composes summary metrics, an illustrative time-range chart, recent candidates, and workflow shortcuts.
 */
import { CandidateTable } from "@/components/HR/candidate-table";
import { SummaryCard } from "@/components/HR/summary-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Candidate, Job } from "@/types/hr";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  MoreVertical,
  ScanSearch,
  UserRoundCheck,
  Video,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import "./dashboard-page.css";
// Define DashboardPageProps so callers and implementations agree on the required data shape.
type DashboardPageProps = { jobs: Job[]; candidates: Candidate[] };
// Composes summary metrics, an illustrative time-range chart, recent candidates, and workflow shortcuts.
export function DashboardPage({ jobs, candidates }: DashboardPageProps) {
  // Keep range in component state; updates trigger a render.
  const [range, setRange] = useState("Last 30 Days");
  // Keep page in component state; updates trigger a render.
  const [page, setPage] = useState(0);
  const visible = candidates.slice(page * 4, page * 4 + 4);
  const path =
    range === "Last 30 Days"
      ? "M0 148 C45 132 70 138 110 150 S165 168 205 135 S275 70 325 78 S405 127 450 102 S480 85 500 82"
      : "M0 160 C60 170 90 110 145 120 S220 140 260 82 S330 110 390 60 S460 40 500 25";
  return (
    <div className="page-dashboard-dashboard-page">
      <div className="page-stack">
        <div className="page-heading">
          <div>
            <h1>Dashboard Overview</h1>
            <p>Here is what's happening with your hiring pipeline today.</p>
          </div>
          <span className="dashboard-date">
            <CalendarDays size={13} />
            Today, Oct 24
          </span>
        </div>
        {/* Group related content and controls in this screen section. */}
        <section className="metric-grid" aria-label="HR summary">
          <SummaryCard
            label="Total Applications"
            value="124"
            change=""
            badgeLabel="↗ +12%"
            badgeTone="neutral"
            icon={FileText}
          />
          <SummaryCard
            label="Open Jobs"
            value={String(jobs.filter((j) => j.status === "Open").length)}
            change=""
            badgeLabel="— 0%"
            badgeTone="neutral"
            icon={BriefcaseBusiness}
          />
          <SummaryCard
            label="Upcoming Interviews"
            value="8"
            change=""
            badgeLabel="Action needed"
            badgeTone="danger"
            icon={CalendarDays}
          />
          <SummaryCard
            label="Pending Onboarding"
            value="5"
            change=""
            icon={UserRoundCheck}
          />
        </section>
        <div className="dashboard-columns">
          <div className="dashboard-primary">
            {/* Compose a reusable surface around this group of content. */}
            <Card className="pipeline-panel">
              {/* Separate the panel heading and actions from its content. */}
              <CardHeader>
                <div>
                  <CardTitle>Hiring Pipeline Velocity</CardTitle>
                  <p>
                    Application volume over the last{" "}
                    {range === "Last 30 Days" ? 30 : 7} days
                  </p>
                </div>
                <select
                  className="form-select"
                  aria-label="Pipeline time range"
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                >
                  <option>Last 30 Days</option>
                  <option>Last 7 Days</option>
                </select>
              </CardHeader>
              {/* Render the panel body using the shared spacing convention. */}
              <CardContent>
                <svg
                  className="pipeline-chart"
                  viewBox="0 0 500 220"
                  role="img"
                  aria-label={range + " application volume illustration"}
                >
                  <defs>
                    <linearGradient
                      id="pipeline-fill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop stopColor="#6e92a3" stopOpacity=".3" />
                      <stop offset="1" stopColor="#6e92a3" stopOpacity=".03" />
                    </linearGradient>
                  </defs>
                  {[35, 90, 145, 200].map((y) => (
                    <line
                      key={y}
                      x1="0"
                      x2="500"
                      y1={y}
                      y2={y}
                      stroke="#eef0ed"
                    />
                  ))}
                  <path
                    d={path + " L500 200 L0 200Z"}
                    fill="url(#pipeline-fill)"
                  />
                  <path
                    d={path}
                    stroke="#52798c"
                    strokeWidth="2.4"
                    fill="none"
                  />
                  {range === "Last 30 Days"
                    ? [
                        [50, 140],
                        [185, 148],
                        [320, 78],
                        [455, 100],
                      ].map(([x, y]) => (
                        <circle
                          key={x}
                          cx={x}
                          cy={y}
                          r="3.5"
                          fill="white"
                          stroke="#52798c"
                          strokeWidth="2"
                        />
                      ))
                    : null}
                  {["Oct 5", "Oct 10", "Oct 15", "Oct 20"].map((v, i) => (
                    <text
                      key={v}
                      x={50 + i * 135}
                      y="218"
                      textAnchor="middle"
                      fill="#929891"
                      fontSize="10"
                    >
                      {v}
                    </text>
                  ))}
                </svg>
              </CardContent>
            </Card>
            {/* Compose a reusable surface around this group of content. */}
            <Card className="recent-candidates">
              {/* Separate the panel heading and actions from its content. */}
              <CardHeader>
                <CardTitle>Recent Candidates</CardTitle>
                <Link to="/candidates">View All</Link>
              </CardHeader>
              {/* Render the panel body using the shared spacing convention. */}
              <CardContent>
                <CandidateTable candidates={visible} />
              </CardContent>
            </Card>
            <div className="table-pagination">
              <span>
                Showing {candidates.length ? page * 4 + 1 : 0} to{" "}
                {Math.min((page + 1) * 4, candidates.length)} of{" "}
                {candidates.length} entries
              </span>
              <div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={(page + 1) * 4 >= candidates.length}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
          {/* Supporting profile, navigation, or filter content beside the main panel. */}
          <aside className="dashboard-secondary">
            {/* Compose a reusable surface around this group of content. */}
            <Card className="quick-actions">
              {/* Separate the panel heading and actions from its content. */}
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              {/* Render the panel body using the shared spacing convention. */}
              <CardContent>
                <div className="quick-action-grid">
                  {[
                    ["Create Job", "/jobs/new", BriefcaseBusiness],
                    ["Review Candidates", "/candidates", UserRoundCheck],
                    ["AI Screening", "/screening", ScanSearch],
                    ["Schedule Interview", "/interviews", CalendarDays],
                  ].map(([label, to, Icon]) => {
                    const I = Icon as typeof BriefcaseBusiness;
                    return (
                      <Link key={String(to)} to={String(to)}>
                        <I aria-hidden="true" />
                        {String(label)}
                      </Link>
                    );
                  })}
                </div>
                <Button asChild>
                  <Link to="/onboarding/eleanor-shellstrop">
                    <ArrowRight size={14} />
                    Continue Onboarding (5)
                  </Link>
                </Button>
              </CardContent>
            </Card>
            {/* Compose a reusable surface around this group of content. */}
            <Card className="upcoming-interviews">
              {/* Separate the panel heading and actions from its content. */}
              <CardHeader>
                <CardTitle>Upcoming Interviews</CardTitle>
                <MoreVertical size={17} />
              </CardHeader>
              {/* Render the panel body using the shared spacing convention. */}
              <CardContent>
                <div className="upcoming-interview-list">
                  {[
                    ["10:00", "AM", "Sarah Jenkins", "Product Manager"],
                    ["01:30", "PM", "Marcus Chen", "Senior Developer"],
                    ["03:00", "PM", "Elena Rodriguez", "UX Researcher"],
                  ].map(([time, period, name, role]) => (
                    <Link
                      to="/interviews"
                      className="upcoming-interview"
                      key={name}
                    >
                      <strong>
                        {time}
                        <small>{period}</small>
                      </strong>
                      <span>
                        <b>{name}</b>
                        <small>
                          <BriefcaseBusiness size={11} />
                          {role}
                        </small>
                      </span>
                      <Video size={15} />
                    </Link>
                  ))}
                </div>
                <Link to="/interviews" className="view-schedule">
                  View Full Schedule
                </Link>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
