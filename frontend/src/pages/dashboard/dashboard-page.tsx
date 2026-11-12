import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SummaryCard } from "@/components/HR/summary-card";
import { hrRequest } from "@/data/hr-api";
import {
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  UserRoundCheck,
} from "lucide-react";
import "./dashboard-page.css";

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
  const max = Math.max(1, ...(data?.volume.map((day) => day.count) || []));
  return (
    <div className="page-dashboard-dashboard-page">
      <div className="page-stack">
        <header className="page-heading">
          <div>
            <h1>Dashboard Overview</h1>
            <p>
              {new Intl.DateTimeFormat("en-GB", {
                timeZone: "Asia/Kathmandu",
                dateStyle: "full",
              }).format(new Date())}{" "}
              · Nepal time
            </p>
          </div>
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
        </header>
        {loading && <p role="status">Loading dashboard…</p>}
        {error && <p role="alert">{error}</p>}
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
                <section className="rounded-lg border bg-white p-5">
                  <header className="flex justify-between gap-3">
                    <h2>Application volume</h2>
                    <select
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
                    </select>
                  </header>
                  <svg
                    viewBox="0 0 600 220"
                    role="img"
                    aria-label={`Daily application counts for the last ${days} days in Nepal time`}
                    className="w-full"
                  >
                    <title>Daily application counts</title>
                    {data.volume.map((day, index) => (
                      <g key={day.day}>
                        <title>{day.day + ": " + day.count}</title>
                        <rect
                          x={index * (560 / days) + 25}
                          y={185 - (day.count / max) * 155}
                          width={Math.max(3, 560 / days - 3)}
                          height={(day.count / max) * 155}
                          fill="#52798c"
                        />
                        {(index === 0 ||
                          index === days - 1 ||
                          index === Math.floor(days / 2)) && (
                          <text
                            x={index * (560 / days) + 25}
                            y={210}
                            fontSize="10"
                          >
                            {day.day.slice(5)}
                          </text>
                        )}
                      </g>
                    ))}
                    <text x="0" y="20" fontSize="12">
                      {max}
                    </text>
                  </svg>
                  <details>
                    <summary>View daily counts</summary>
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Applications</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.volume.map((day) => (
                          <tr key={day.day}>
                            <td>{day.day}</td>
                            <td>{day.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </details>
                </section>
                <section className="rounded-lg border bg-white p-5">
                  <h2>Recent applications</h2>
                  {!data.recent.length ? (
                    <p>No applications yet.</p>
                  ) : (
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>Candidate</th>
                            <th>Position</th>
                            <th>Stage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.recent.map((a) => (
                            <tr key={a.id}>
                              <td>
                                <Link to={"/candidates/" + a.candidateId}>
                                  {a.name}
                                </Link>
                              </td>
                              <td>{a.jobTitle}</td>
                              <td>{a.stage}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <Link to="/applications">All applications</Link>
                </section>
              </div>
              <aside className="dashboard-secondary">
                <section className="rounded-lg border bg-white p-5">
                  <h2>Quick actions</h2>
                  <div className="grid gap-3">
                    {[
                      ["Create job", "/jobs/new"],
                      ["Review candidates", "/candidates"],
                      ["Schedule interviews", "/interviews"],
                      ["Continue onboarding", "/onboarding"],
                      [`Employee records (${data.employees})`, "/employees"],
                    ].map(([label, to]) => (
                      <Link className="underline" key={to} to={to}>
                        {label}
                      </Link>
                    ))}
                  </div>
                </section>
                <section className="rounded-lg border bg-white p-5">
                  <h2>Upcoming interviews</h2>
                  {!data.upcoming.length ? (
                    <p>No upcoming interviews.</p>
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
                </section>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
