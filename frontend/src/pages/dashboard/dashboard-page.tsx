import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Person } from "@/components/shared/data-display/person";
import { StatusBadge } from "@/components/shared/data-display/status-badge";
import { PaginationControls } from "@/components/shared/navigation/pagination-controls";
import { DataState } from "@/components/shared/feedback/data-state";
import { PageHeader } from "@/components/Layout/page-header";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { FeedbackMessage } from "@/components/shared/feedback/feedback-message";
import { NativeSelect } from "@/components/ui/native-select";
import { useEffect, useState } from "react";
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
  UserRoundCheck,
} from "lucide-react";
import "./dashboard-page.css";

const ApplicationVolumeChart = lazy(() =>
  import("./application-volume-chart").then((module) => ({
    default: module.ApplicationVolumeChart,
  })),
);

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
    Math.max(0, Math.ceil((data?.recent.length ?? 0) / 4) - 1),
  );
  return (
    <div className="page-dashboard-dashboard-page">
      <div className="page-stack">
        <PageHeader
          className="page-heading"
          title={<>Dashboard Overview</>}
          description={
            <>
              {new Intl.DateTimeFormat("en-GB", {
                timeZone: "Asia/Kathmandu",
                dateStyle: "full",
              }).format(new Date())}{" "}
              · Nepal time
            </>
          }
          action={
            <>
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
            </>
          }
        />
        {loading && (
          <FeedbackMessage role="status">Loading dashboard…</FeedbackMessage>
        )}
        {error && <FeedbackMessage role="alert">{error}</FeedbackMessage>}
        {!loading && !error && data && (
          <>
            <section className="metric-grid" aria-label="Saved HR totals">
              {(
                [
                  ["Total Applications", data.totalApplications, FileText],
                  ["Open Jobs", data.openJobs, BriefcaseBusiness],
                  [
                    "Upcoming Interviews",
                    data.upcomingInterviews,
                    CalendarDays,
                  ],
                  [
                    "Pending Onboarding",
                    data.pendingOnboarding,
                    UserRoundCheck,
                  ],
                ] as const
              ).map(([label, value, icon]) => (
                <SummaryCard
                  key={label}
                  label={label}
                  value={String(value)}
                  change=""
                  icon={icon}
                  showTrend={false}
                />
              ))}
            </section>
            <div className="dashboard-columns">
              <div className="dashboard-primary">
                <Card asChild className="gap-4 py-0 ring-0">
                  <section className="dashboard-panel pipeline-panel rounded-lg border bg-white">
                    <CardHeader className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
                      <h2>Application volume</h2>
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
                    <CardContent className="p-5">
                      <Suspense
                        fallback={
                          <Skeleton
                            className="h-64 w-full"
                            aria-label="Loading chart"
                          />
                        }
                      >
                        <ApplicationVolumeChart
                          data={data.volume}
                          days={days}
                        />
                      </Suspense>
                      <details>
                        <summary>View daily counts</summary>
                        <Table className="dashboard-applications-table">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Applications</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.volume.map((day) => (
                              <TableRow key={day.day}>
                                <TableCell>{day.day}</TableCell>
                                <TableCell>{day.count}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </details>
                    </CardContent>
                  </section>
                </Card>
                <Card asChild className="gap-4 py-0 ring-0">
                  <section className="dashboard-panel recent-candidates rounded-lg border bg-white">
                    <CardHeader className="border-b p-5">
                      <h2>Recent applications</h2>
                      <p className="text-xs text-muted-foreground">
                        Latest {data.recent.length} applications · preview
                      </p>
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
                                <TableHead>Stage</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {data.recent
                                .slice(
                                  currentRecentPage * 4,
                                  currentRecentPage * 4 + 4,
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
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3">
                      {data.recent.length > 4 && (
                        <PaginationControls
                          label="Recent applications preview pages"
                          previousDisabled={currentRecentPage === 0}
                          nextDisabled={
                            (currentRecentPage + 1) * 4 >= data.recent.length
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
                      <Button asChild variant="link">
                        <Link to="/applications">All applications</Link>
                      </Button>
                    </div>
                  </section>
                </Card>
              </div>
              <aside className="dashboard-secondary">
                <Card asChild className="gap-4 py-0 ring-0">
                  <section className="dashboard-panel quick-actions rounded-lg border bg-white">
                    <CardHeader className="border-b p-5">
                      <h2>Quick actions</h2>
                    </CardHeader>
                    <CardContent className="p-5">
                      <div className="quick-action-grid">
                        {[
                          ["Create job", "/jobs/new"],
                          ["Review candidates", "/candidates"],
                          ["Schedule interviews", "/interviews"],
                          ["Continue onboarding", "/onboarding"],
                          [
                            `Employee records (${data.employees})`,
                            "/employees",
                          ],
                        ].map(([label, to]) => (
                          <Link key={to} to={to}>
                            {label}
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </section>
                </Card>
                <Card asChild className="gap-4 py-0 ring-0">
                  <section className="dashboard-panel upcoming-interviews rounded-lg border bg-white">
                    <CardHeader className="border-b p-5">
                      <h2>Upcoming interviews</h2>
                    </CardHeader>
                    <CardContent className="grid gap-4 p-5">
                      {!data.upcoming.length ? (
                        <DataState kind="empty">
                          No upcoming interviews.
                        </DataState>
                      ) : (
                        data.upcoming.map((i) => (
                          <p key={i.id}>
                            <Link to="/interviews">
                              {i.name} · {i.jobTitle}
                              <br />
                              {new Intl.DateTimeFormat("en-GB", {
                                timeZone: "Asia/Kathmandu",
                                dateStyle: "medium",
                                timeStyle: "short",
                              }).format(new Date(i.startsAt))}
                            </Link>
                          </p>
                        ))
                      )}
                      <Link to="/interviews">Full schedule</Link>
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
