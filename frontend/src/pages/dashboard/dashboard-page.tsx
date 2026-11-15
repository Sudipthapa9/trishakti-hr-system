import { lazy, Suspense, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Person } from "@/components/shared/data-display/person";
import { StatusBadge } from "@/components/shared/data-display/status-badge";
import { PaginationControls } from "@/components/shared/navigation/pagination-controls";
import { DataState } from "@/components/shared/feedback/data-state";
import { PageHeader } from "@/components/Layout/page-header";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { FeedbackMessage } from "@/components/shared/feedback/feedback-message";
import { NativeSelect } from "@/components/ui/native-select";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SummaryCard } from "@/components/HR/summary-card";
import { hrRequest } from "@/data/hr-api";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  ScanSearch,
  UserRoundCheck,
  Users,
  ChevronRight,
} from "lucide-react";
import "./dashboard-page.css";

const ApplicationVolumeChart = lazy(() =>
  import("./application-volume-chart").then((module) => ({
    default: module.ApplicationVolumeChart,
  })),
);

// Reuse static actions and Nepal-time formatters across renders.
const quickActions = [
  { label: "Create Job", to: "/jobs/new", icon: BriefcaseBusiness },
  { label: "Review Candidates", to: "/candidates", icon: Users },
  { label: "Screening", to: "/screening", icon: ScanSearch },
  { label: "Schedule Interviews", to: "/interviews", icon: CalendarDays },
];
const dashboardDate = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kathmandu",
  dateStyle: "full",
});
const interviewTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kathmandu",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});
const interviewDate = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kathmandu",
  day: "numeric",
  month: "short",
});
const recentPageSize = 4;

type Dashboard = {
  totalApplications: number;
  openJobs: number;
  upcomingInterviews: number;
  pendingOnboarding: number;
  employees: number;
  recent: {
    id: string;
    candidateId: string;
    name: string;
    stage: string;
    jobTitle: string;
  }[];
  upcoming: { id: string; name: string; jobTitle: string; startsAt: string }[];
  volume: { day: string; count: number }[];
};
export function DashboardPage() {
  const [days, setDays] = useState(30);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    void hrRequest("dashboard?days=" + days, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [days, revision]);
  const [recentPage, setRecentPage] = useState(0);
  const currentRecentPage = Math.min(
    recentPage,
    Math.max(0, Math.ceil((data?.recent.length ?? 0) / recentPageSize) - 1),
  );
  return (
    <div className="page-dashboard-dashboard-page">
      <div className="page-stack">
        <PageHeader
          className="page-heading"
          title="Dashboard Overview"
          description={`${dashboardDate.format(new Date())} · Nepal time`}
          action={
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setLoading(true);
                  setError("");
                  setRevision((v) => v + 1);
                }}
              >
                Refresh
              </Button>
              <Button asChild>
                <Link to="/careers">Public careers</Link>
              </Button>
            </div>
          }
        />
        {loading && (
          <FeedbackMessage role="status">Loading dashboard…</FeedbackMessage>
        )}
        {error && <FeedbackMessage role="alert">{error}</FeedbackMessage>}
        {!loading && !error && data && (
          <>
            <section className="metric-grid" aria-label="Saved HR totals">
              {[
                {
                  label: "Total Applications",
                  value: data.totalApplications,
                  icon: FileText,
                  badgeLabel: "All time",
                  badgeTone: "neutral" as const,
                },
                {
                  label: "Open Jobs",
                  value: data.openJobs,
                  icon: BriefcaseBusiness,
                  badgeLabel: data.openJobs > 0 ? "Active" : "None open",
                  badgeTone: "neutral" as const,
                },
                {
                  label: "Upcoming Interviews",
                  value: data.upcomingInterviews,
                  icon: CalendarDays,
                  badgeLabel:
                    data.upcomingInterviews > 0
                      ? "Action needed"
                      : "None scheduled",
                  badgeTone:
                    data.upcomingInterviews > 0
                      ? ("danger" as const)
                      : ("neutral" as const),
                },
                {
                  label: "Pending Onboarding",
                  value: data.pendingOnboarding,
                  icon: UserRoundCheck,
                  badgeLabel:
                    data.pendingOnboarding > 0 ? "Pending" : "Up to date",
                  badgeTone:
                    data.pendingOnboarding > 0
                      ? ("warning" as const)
                      : ("neutral" as const),
                },
              ].map((card) => (
                <SummaryCard
                  key={card.label}
                  {...card}
                  value={String(card.value)}
                />
              ))}
            </section>
            <div className="dashboard-columns">
              <div className="dashboard-primary">
                <Card asChild className="ring-0">
                  <section className="dashboard-panel pipeline-panel">
                    <CardHeader className="pipeline-panel-header">
                      <div>
                        <h2>Application overview</h2>
                        <p className="pipeline-subtitle">
                          Application volume over the last {days} days
                        </p>
                      </div>

                      <NativeSelect
                        className="form-select"
                        aria-label="Application volume range"
                        value={days}
                        onChange={(event) => {
                          setLoading(true);
                          setError("");
                          setDays(Number(event.target.value));
                        }}
                      >
                        <option value={30}>Last 30 days</option>
                        <option value={7}>Last 7 days</option>
                      </NativeSelect>
                    </CardHeader>

                    <CardContent>
                      <Suspense
                        fallback={
                          <Skeleton
                            className="h-64 w-full"
                            aria-label="Loading application chart"
                          />
                        }
                      >
                        <ApplicationVolumeChart
                          data={data.volume}
                          days={days}
                        />
                      </Suspense>
                      <details className="dashboard-daily-counts">
                        <summary>View daily counts</summary>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date (Nepal)</TableHead>
                              <TableHead>Applications</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.volume.map(({ day, count }) => (
                              <TableRow key={day}>
                                <TableCell>{day}</TableCell>
                                <TableCell>{count}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </details>
                    </CardContent>
                  </section>
                </Card>
                <Card asChild className="ring-0">
                  <section className="dashboard-panel recent-applications">
                    <CardHeader className="recent-applications-header">
                      <h2>Recent Candidates</h2>
                      <Link to="/applications">View All</Link>
                    </CardHeader>
                    <CardContent>
                      {!data.recent.length ? (
                        <DataState kind="empty">No applications yet.</DataState>
                      ) : (
                        <div className="table-scroll">
                          <Table className="dashboard-applications-table">
                            <TableHeader>
                              <TableRow>
                                <TableHead>Candidate</TableHead>
                                <TableHead>Position</TableHead>
                                <TableHead>AI MATCH</TableHead>
                                <TableHead>Stage</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {data.recent
                                .slice(
                                  currentRecentPage * recentPageSize,
                                  currentRecentPage * recentPageSize +
                                    recentPageSize,
                                )
                                .map((a) => (
                                  <TableRow key={a.id}>
                                    <TableCell>
                                      <Link to={"/candidates/" + a.candidateId}>
                                        <Person name={a.name} />
                                      </Link>
                                    </TableCell>
                                    <TableCell>{a.jobTitle}</TableCell>
                                    <TableCell>
                                      <span title="Screening has not been run">
                                        —
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      <StatusBadge
                                        domain="application"
                                        status={a.stage}
                                      />
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                    <div className="recent-applications-pagination">
                      {data.recent.length > recentPageSize && (
                        <PaginationControls
                          label="Recent applications preview pages"
                          previousDisabled={currentRecentPage === 0}
                          nextDisabled={
                            (currentRecentPage + 1) * recentPageSize >=
                            data.recent.length
                          }
                          onPrevious={() =>
                            setRecentPage(currentRecentPage - 1)
                          }
                          onNext={() => setRecentPage(currentRecentPage + 1)}
                        >
                          <span className="text-xs">
                            Preview page {currentRecentPage + 1}
                          </span>
                        </PaginationControls>
                      )}
                    </div>
                  </section>
                </Card>
              </div>
              <aside className="dashboard-secondary">
                <Card asChild className="ring-0">
                  <section className="dashboard-panel quick-actions">
                    <CardHeader>
                      <h2>Quick actions</h2>
                    </CardHeader>
                    <CardContent>
                      <div className="quick-action-grid">
                        {quickActions.map(({ label, to, icon: Icon }) => (
                          <Button key={to} asChild variant="outline">
                            <Link to={to}>
                              <Icon aria-hidden="true" />
                              <span>{label}</span>
                            </Link>
                          </Button>
                        ))}
                      </div>

                      <Button asChild className="w-full">
                        <Link to="/onboarding">
                          <UserRoundCheck aria-hidden="true" />
                          Continue Onboarding ({data.pendingOnboarding})
                        </Link>
                      </Button>

                      <Link className="quick-actions-employees" to="/employees">
                        Employee records ({data.employees})
                      </Link>
                    </CardContent>
                  </section>
                </Card>
                <Card asChild className="ring-0">
                  <section className="dashboard-panel upcoming-interviews">
                    <CardHeader>
                      <h2>Upcoming interviews</h2>
                    </CardHeader>
                    <CardContent className="upcoming-interview-content">
                      {!data.upcoming.length ? (
                        <DataState kind="empty">
                          No upcoming interviews.
                        </DataState>
                      ) : (
                        <div className="upcoming-interview-list">
                          {data.upcoming.map((interview) => (
                            <Link
                              key={interview.id}
                              to="/interviews"
                              className="upcoming-interview"
                            >
                              <time dateTime={interview.startsAt}>
                                <strong>
                                  {interviewTime.format(
                                    new Date(interview.startsAt),
                                  )}
                                </strong>

                                <small>
                                  {interviewDate.format(
                                    new Date(interview.startsAt),
                                  )}
                                </small>
                              </time>

                              <div className="upcoming-interview-person">
                                <strong>{interview.name}</strong>
                                <p>{interview.jobTitle}</p>
                              </div>

                              <ChevronRight aria-hidden="true" size={16} />
                            </Link>
                          ))}
                        </div>
                      )}
                      <Link className="view-schedule" to="/interviews">
                        View Full Schedule
                      </Link>
                    </CardContent>
                  </section>
                </Card>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
