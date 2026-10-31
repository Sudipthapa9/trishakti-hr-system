/**
 * Combines a date selector, interview filters, and local scheduling; no calendar invitations are transmitted.
 */
import { Person } from "@/components/HR/workflow-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import "./interviews-page.css";
// Provide the fixed prototype records or display configuration consumed by this module.
const seed = [
  {
    id: 1,
    name: "Jane Doe",
    email: "jane.d@example.com",
    role: "Senior Frontend Dev",
    time: "09:00 AM - 10:00 AM",
    interviewer: "Alex Smith",
    title: "Tech Lead",
    status: "Scheduled",
    date: "2023-10-12",
  },
  {
    id: 2,
    name: "Michael Chen",
    email: "m.chen@email.com",
    role: "Product Manager",
    time: "11:30 AM - 12:30 PM",
    interviewer: "Sarah Connor",
    title: "Director of Product",
    status: "Scheduled",
    date: "2023-10-12",
  },
  {
    id: 3,
    name: "Emily Rose",
    email: "erose@domain.com",
    role: "UX Designer",
    time: "02:00 PM - 03:00 PM",
    interviewer: "David Kim",
    title: "Design Lead",
    status: "Completed",
    date: "2023-10-12",
  },
  {
    id: 4,
    name: "Nina Patel",
    email: "nina.p@example.com",
    role: "Backend Engineer",
    time: "03:30 PM - 04:30 PM",
    interviewer: "Priya Shah",
    title: "Engineering Manager",
    status: "Scheduled",
    date: "2023-10-12",
  },
  {
    id: 5,
    name: "Omar Hassan",
    email: "omar.h@example.com",
    role: "Data Analyst",
    time: "04:00 PM - 05:00 PM",
    interviewer: "Maya Gupta",
    title: "Analytics Lead",
    status: "Completed",
    date: "2023-10-12",
  },
  {
    id: 6,
    name: "Sofia Lee",
    email: "sofia.l@example.com",
    role: "Customer Support",
    time: "05:30 PM - 06:30 PM",
    interviewer: "Chris Nguyen",
    title: "Support Manager",
    status: "Scheduled",
    date: "2023-10-12",
  },
];
// Combines a date selector, interview filters, and local scheduling; no calendar invitations are transmitted.
export function InterviewsPage() {
  // Keep interviews in component state; updates trigger a render.
  const [interviews, setInterviews] = useState(seed);
  // Keep filter in component state; updates trigger a render.
  const [filter, setFilter] = useState("All");
  // Keep search in component state; updates trigger a render.
  const [search, setSearch] = useState("");
  // Keep showForm in component state; updates trigger a render.
  const [showForm, setShowForm] = useState(false);
  // Keep notice in component state; updates trigger a render.
  const [notice, setNotice] = useState("");
  // Keep date in component state; updates trigger a render.
  const [date, setDate] = useState("2023-10-12");
  // Keep month in component state; updates trigger a render.
  const [month, setMonth] = useState(new Date(2023, 9, 1));
  const count = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const offset = month.getDay();
  const visible = interviews.filter(
    (i) =>
      (filter === "All" || i.status === filter) &&
      i.date === date &&
      (i.name + " " + i.role + " " + i.interviewer)
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  // Read the schedule form, add the interview locally, and select its date without sending invitations.
  function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const day = String(d.get("date"));
    setInterviews((v) => [
      {
        id: Date.now(),
        name: String(d.get("name")),
        email: "",
        role: String(d.get("role")),
        time: String(d.get("time")),
        interviewer: String(d.get("interviewer")),
        title: "Interviewer",
        status: "Scheduled",
        date: day,
      },
      ...v,
    ]);
    setDate(day);
    const selected = new Date(day + "T00:00:00");
    setMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
    setShowForm(false);
    setNotice(
      "Interview added locally. Invitations are not sent in this prototype.",
    );
  }
  return (
    <div className="page-interviews-interviews-page">
      <div className="page-stack">
        <div className="page-heading">
          <div>
            <h1>Interview Management</h1>
            <p>Manage and track candidate interviews across all positions.</p>
          </div>
          <Button onClick={() => setShowForm((v) => !v)}>
            <Plus />
            Schedule Interview
          </Button>
        </div>
        {notice ? <p role="status">{notice}</p> : null}
        {showForm ? (
          <form className="interview-schedule" onSubmit={add}>
            <h2>Schedule Interview</h2>
            {[
              ["name", "Candidate", "text"],
              ["role", "Position", "text"],
              ["date", "Date", "date"],
              ["time", "Time", "time"],
              ["interviewer", "Interviewer", "text"],
            ].map(([name, label, type]) => (
              <div className="form-field" key={name}>
                <Label htmlFor={"schedule-" + name}>{label}</Label>
                <Input
                  id={"schedule-" + name}
                  name={name}
                  type={type}
                  required
                />
              </div>
            ))}
            <div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Confirm Schedule</Button>
            </div>
          </form>
        ) : null}
        <div className="interview-layout">
          {/* Supporting profile, navigation, or filter content beside the main panel. */}
          <aside>
            <div className="interview-calendar">
              {/* Page or panel heading and contextual actions. */}
              <header>
                <strong>
                  {month.toLocaleString("en", { month: "long" })}
                  <br />
                  {month.getFullYear()}
                </strong>
                <div>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    aria-label="Previous month"
                    onClick={() =>
                      setMonth(
                        new Date(month.getFullYear(), month.getMonth() - 1, 1),
                      )
                    }
                  >
                    <ChevronLeft />
                  </Button>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    aria-label="Next month"
                    onClick={() =>
                      setMonth(
                        new Date(month.getFullYear(), month.getMonth() + 1, 1),
                      )
                    }
                  >
                    <ChevronRight />
                  </Button>
                </div>
              </header>
              <div className="calendar-days">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <small key={i}>{d}</small>
                ))}
                {Array.from({ length: offset }, (_, i) => (
                  <span key={"blank" + i} />
                ))}
                {Array.from({ length: count }, (_, i) => {
                  const day =
                    month.getFullYear() +
                    "-" +
                    String(month.getMonth() + 1).padStart(2, "0") +
                    "-" +
                    String(i + 1).padStart(2, "0");
                  return (
                    <button
                      key={day}
                      aria-pressed={date === day}
                      onClick={() => setDate(day)}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="interview-filters">
              <h2>Quick Filters</h2>
              {["All", "Scheduled", "Completed", "Rescheduled"].map((v) => (
                <label key={v}>
                  <input
                    type="radio"
                    name="interview-status"
                    checked={filter === v}
                    onChange={() => setFilter(v)}
                  />
                  {v}
                </label>
              ))}
            </div>
          </aside>
          {/* Group related content and controls in this screen section. */}
          <section className="interview-table">
            {/* Page or panel heading and contextual actions. */}
            <header>
              <h2>
                Upcoming Interviews (
                {new Date(date + "T00:00:00").toLocaleDateString("en", {
                  month: "short",
                  day: "numeric",
                })}
                )
              </h2>
              <label>
                <Search size={15} />
                <Input
                  aria-label="Search interviews"
                  placeholder="Search interviews"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
            </header>
            <div className="table-scroll">
              {/* Use semantic rows and columns for the tabular records. */}
              <table>
                <thead>
                  <tr>
                    {[
                      "Candidate",
                      "Position",
                      "Time",
                      "Interviewer",
                      "Status",
                    ].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((i) => (
                    <tr key={i.id}>
                      <td>
                        <Person name={i.name} detail={i.email} />
                      </td>
                      <td>{i.role}</td>
                      <td>{i.time}</td>
                      <td>
                        {i.interviewer}
                        <small>{i.title}</small>
                      </td>
                      <td>
                        <Badge
                          variant={
                            i.status === "Completed" ? "success" : "neutral"
                          }
                        >
                          {i.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!visible.length ? (
                <p className="empty-message">
                  No interviews match this date and filter.
                </p>
              ) : null}
            </div>
            {/* Supporting links, pagination, or secondary screen actions. */}
            <footer className="table-pagination">
              <span>
                Showing {visible.length ? 1 : 0} to {visible.length} of{" "}
                {visible.length} entries
              </span>
              <div>
                <Button size="xs" variant="outline" disabled>
                  Prev
                </Button>
                <Button size="xs" variant="outline" disabled>
                  Next
                </Button>
              </div>
            </footer>
          </section>
        </div>
      </div>
    </div>
  );
}
