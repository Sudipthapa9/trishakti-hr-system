import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Download,
  FileCheck2,
  FileText,
  Mail,
  MapPin,
  Plus,
  Search,
  Send,
  Sparkles,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { PageHeader } from "@/components/Layout/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Candidate, CandidateStage, Job } from "@/types/hr";

type WorkflowPageProps = {
  candidates: Candidate[];
  jobs: Job[];
  onStageChange: (candidateId: string, stage: CandidateStage) => void;
};

const rankedCandidates = [
  { name: "Marcus Reed", role: "Senior Backend Engineer", score: 91, applied: "2 days ago", skills: ["Python", "OOP", "PostgreSQL"], initials: "MR" },
  { name: "David Chen", role: "Senior Backend Engineer", score: 88, applied: "3 days ago", skills: ["Python", "AWS", "REST API"], initials: "DC" },
  { name: "Elena Rostova", role: "Senior Backend Engineer", score: 82, applied: "1 week ago", skills: ["Architecture", "CI/CD"], initials: "ER" },
  { name: "Priya Nair", role: "Senior Backend Engineer", score: 76, applied: "1 week ago", skills: ["Python", "Docker"], initials: "PN" },
  { name: "Alex Morgan", role: "Senior Backend Engineer", score: 68, applied: "2 weeks ago", skills: ["REST API"], initials: "AM" },
];

const interviewSeed = [
  { id: 1, name: "Jane Cooper", role: "Product Designer", date: "Oct 24", time: "10:00 AM", interviewer: "Alex Mercer", type: "Video call", status: "Scheduled" },
  { id: 2, name: "Michael Chen", role: "Backend Engineer", date: "Oct 24", time: "11:30 AM", interviewer: "Sam Wilson", type: "Technical", status: "Scheduled" },
  { id: 3, name: "Aisha Khan", role: "Marketing Manager", date: "Oct 25", time: "1:00 PM", interviewer: "Alex Mercer", type: "In person", status: "Confirmed" },
  { id: 4, name: "Owen Harris", role: "Operations Lead", date: "Oct 26", time: "9:30 AM", interviewer: "Jamie Lee", type: "Video call", status: "Rescheduled" },
];

const onboardingDocuments = [
  { name: "Offer Letter", detail: "Signed Jul 15, 2024", status: "Complete" },
  { name: "Employment Contract", detail: "Signed Jul 18, 2024", status: "Complete" },
  { name: "Government ID", detail: "Verification required", status: "Complete" },
  { name: "Bank Account Details", detail: "Awaiting upload", status: "Pending" },
  { name: "Tax and Payroll Forms", detail: "Awaiting approval", status: "Review" },
];

function Person({ name, detail, initials, className = "" }: { name: string; detail?: string; initials?: string; className?: string }) {
  const fallback = initials ?? name.split(" ").map((part) => part[0]).slice(0, 2).join("");
  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      <Avatar className="size-10 shrink-0">
        <AvatarFallback className="bg-accent text-sm font-semibold text-accent-foreground">{fallback}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{name}</p>
        {detail ? <p className="truncate text-xs text-muted-foreground">{detail}</p> : null}
      </div>
    </div>
  );
}

function Metric({ label, value, caption, icon: Icon }: { label: string; value: string; caption: string; icon: typeof UserRound }) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
        </div>
        <span className="rounded-lg bg-accent p-2 text-accent-foreground"><Icon aria-hidden="true" className="size-5" /></span>
      </CardContent>
    </Card>
  );
}

function PanelTitle({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</p> : null}
        <h2 className="mt-1 text-lg font-semibold">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function Score({ value, large = false }: { value: number; large?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-primary/10 font-semibold text-primary ${large ? "px-4 py-2 text-2xl" : "px-2.5 py-1 text-xs"}`}>
      {value}%{large ? <span className="text-xs font-medium">MATCH</span> : null}
    </span>
  );
}

function DemoNotice() {
  return <p className="text-xs text-muted-foreground">Sample data for this prototype. Updates are kept in memory and are not sent to the HR API.</p>;
}

export function ScreeningPage({ candidates, jobs, onStageChange }: WorkflowPageProps) {
  const [jobId, setJobId] = useState(jobs[0]?.id ?? "");
  const [minimumScore, setMinimumScore] = useState("All scores");
  const ranked = useMemo(() => rankedCandidates.filter((candidate) => minimumScore === "All scores" || candidate.score >= Number(minimumScore)), [minimumScore]);
  const jobName = jobs.find((job) => job.id === jobId)?.title ?? "Senior Packaging Engineer";

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Recruitment" title="AI screening & ranking" description="Compare candidate experience with the role requirements. AI scores support review; they do not make hiring decisions." />
      <DemoNotice />
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Candidates reviewed" value="24" caption="Across active positions" icon={UserRound} />
        <Metric label="Strong matches" value="8" caption="Score above 80%" icon={Sparkles} />
        <Metric label="Awaiting review" value="6" caption="HR review recommended" icon={Clock3} />
      </div>
      <Card>
        <CardHeader>
          <PanelTitle
            eyebrow="Role comparison"
            title={jobName}
            action={<div className="flex flex-wrap gap-2">
              <label className="sr-only" htmlFor="screening-job">Select job</label>
              <select id="screening-job" className="form-select" value={jobId} onChange={(event) => setJobId(event.target.value)}>
                {jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
              </select>
              <label className="sr-only" htmlFor="score-filter">Minimum match score</label>
              <select id="score-filter" className="form-select" value={minimumScore} onChange={(event) => setMinimumScore(event.target.value)}>
                <option>All scores</option><option value="80">80% and above</option><option value="70">70% and above</option>
              </select>
            </div>}
          />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b text-xs uppercase tracking-wide text-muted-foreground"><tr>{["Rank", "Candidate", "Applied", "Matched skills", "AI match", "HR stage", "Analysis"].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr></thead>
              <tbody>
                {ranked.map((candidate, index) => {
                  const record = candidates.find((item) => item.name.toLowerCase().includes(candidate.name.split(" ")[0].toLowerCase()));
                  return <tr key={candidate.name} className="border-b last:border-0">
                    <td className="px-3 py-4 font-semibold text-muted-foreground">#{index + 1}</td>
                    <td className="px-3 py-4"><Person name={candidate.name} detail={candidate.role} initials={candidate.initials} /></td>
                    <td className="px-3 py-4 text-muted-foreground">{candidate.applied}</td>
                    <td className="px-3 py-4"><div className="flex max-w-52 flex-wrap gap-1">{candidate.skills.map((skill) => <Badge key={skill} variant="neutral">{skill}</Badge>)}</div></td>
                    <td className="px-3 py-4"><Score value={candidate.score} /></td>
                    <td className="px-3 py-4">
                      {record ? <select aria-label={`Update ${record.name} stage`} className="form-select min-h-8" value={record.stage} onChange={(event) => onStageChange(record.id, event.target.value as CandidateStage)}>
                        {["Review", "Shortlisted", "Interview", "Offer"].map((stage) => <option key={stage}>{stage}</option>)}
                      </select> : <Badge variant="warning">Needs review</Badge>}
                    </td>
                    <td className="px-3 py-4"><Button asChild size="sm" variant="outline"><Link to={`/screening/${encodeURIComponent(candidate.name.toLowerCase().replaceAll(" ", "-"))}`}>View</Link></Button></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
          {ranked.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No candidates meet this score threshold.</p> : null}
        </CardContent>
      </Card>
      <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        <Sparkles aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>Screening compares role criteria and candidate-provided information. Review the evidence and make all hiring decisions with human judgment.</p>
      </div>
    </div>
  );
}

export function CandidateAnalysisPage() {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const candidateName = candidateId?.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ") || "Marcus Reed";
  const [stage, setStage] = useState<"Review" | "Shortlisted" | "Rejected">("Review");
  const [notice, setNotice] = useState("");
  const matched = ["Python", "Object-oriented programming", "PostgreSQL", "REST API", "System design"];
  const missing = ["Docker", "Kubernetes"];

  return (
    <div className="page-stack">
      <Button variant="ghost" className="w-fit" onClick={() => navigate("/screening")}><ArrowLeft aria-hidden="true" /> Back to rankings</Button>
      <PageHeader eyebrow="Candidate analysis" title={candidateName} description="Senior Backend Engineer · Applied 2 days ago" action={<Score value={91} large />} />
      <DemoNotice />
      {notice ? <p role="status" className="rounded-lg bg-accent p-3 text-sm text-accent-foreground">{notice}</p> : null}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Card><CardHeader><PanelTitle title="AI score breakdown" action={<Badge variant="neutral">Decision support only</Badge>} /></CardHeader><CardContent className="space-y-4">
            {[["Python architecture", 94], ["Object-oriented programming", 91], ["Database optimization", 85], ["Cloud deployment", 63]].map(([label, score]) => <div key={label} className="grid grid-cols-[minmax(130px,1fr)_2fr_40px] items-center gap-3 text-sm"><span>{label}</span><div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${score}%` }} /></div><span className="text-right text-muted-foreground">{score}%</span></div>)}
          </CardContent></Card>
          <div className="grid gap-4 md:grid-cols-2">
            <Card><CardHeader><PanelTitle title="Matched profile" /></CardHeader><CardContent className="flex flex-wrap gap-2">{matched.map((skill) => <Badge key={skill} variant="success"><Check aria-hidden="true" />{skill}</Badge>)}</CardContent></Card>
            <Card><CardHeader><PanelTitle title="Missing or unverified" /></CardHeader><CardContent className="flex flex-wrap gap-2">{missing.map((skill) => <Badge key={skill} variant="warning">{skill}</Badge>)}</CardContent></Card>
          </div>
          <Card><CardHeader><PanelTitle title="Experience highlights" /></CardHeader><CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p className="border-l-2 border-primary pl-4">Built and maintained high-availability APIs serving over 2 million requests per day using Python and PostgreSQL.</p>
            <p className="border-l-2 border-primary pl-4">Led backend architecture improvements that reduced average response time by 35% while improving reliability.</p>
            <p className="border-l-2 border-primary pl-4">Collaborated with product and infrastructure teams to deliver secure, well-documented services.</p>
          </CardContent></Card>
        </div>
        <Card className="h-fit"><CardHeader><Person name={candidateName} detail="Senior Backend Engineer" initials="MR" /><div className="mt-5"><Badge variant={stage === "Shortlisted" ? "success" : stage === "Rejected" ? "danger" : "warning"}>{stage}</Badge></div></CardHeader><CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Application details</p>
          <div className="flex items-center gap-2 text-sm"><MapPin className="size-4 text-muted-foreground" /> Kathmandu, Nepal</div>
          <div className="flex items-center gap-2 text-sm"><Mail className="size-4 text-muted-foreground" /> marcus.reed@example.com</div>
          <div className="flex items-center gap-2 text-sm"><FileText className="size-4 text-muted-foreground" /> Resume_Marcus_Reed.pdf</div>
          <Button variant="outline" className="w-full"><Download aria-hidden="true" /> Download CV</Button>
          <div className="border-t pt-4">
            <p className="mb-3 text-sm font-semibold">HR decision</p>
            <Button className="mb-2 w-full" onClick={() => { setStage("Shortlisted"); setNotice(`${candidateName} has been shortlisted.`); }}><CheckCircle2 aria-hidden="true" /> Shortlist candidate</Button>
            <Button variant="outline" className="mb-2 w-full" onClick={() => navigate("/interviews")}><CalendarDays aria-hidden="true" /> Schedule interview</Button>
            <Button variant="destructive" className="w-full" onClick={() => { setStage("Rejected"); setNotice(`${candidateName} was marked for rejection review.`); }}><X aria-hidden="true" /> Reject candidate</Button>
          </div>
        </CardContent></Card>
      </div>
    </div>
  );
}

export function InterviewsPage() {
  const [interviews, setInterviews] = useState(interviewSeed);
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const visible = interviews.filter((interview) =>
    (filter === "All" || interview.status === filter) &&
    `${interview.name} ${interview.role} ${interview.interviewer}`.toLowerCase().includes(search.toLowerCase())
  );
  function addInterview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setInterviews((current) => [{ id: Date.now(), name: String(data.get("candidate")), role: String(data.get("role")), date: String(data.get("date")), time: String(data.get("time")), interviewer: String(data.get("interviewer")), type: "Video call", status: "Scheduled" }, ...current]);
    setShowForm(false);
    setNotice("Interview scheduled in this demo.");
  }

  return <div className="page-stack">
    <PageHeader eyebrow="People operations" title="Interview management" description="Plan, coordinate, and track candidate interviews." action={<Button onClick={() => setShowForm((value) => !value)}><Plus aria-hidden="true" /> Schedule interview</Button>} />
    <DemoNotice />
    {notice ? <p role="status" className="rounded-lg bg-accent p-3 text-sm text-accent-foreground">{notice}</p> : null}
    {showForm ? <Card><CardHeader><PanelTitle title="Schedule an interview" /></CardHeader><CardContent><form className="grid gap-4 sm:grid-cols-2" onSubmit={addInterview}>
      <div className="form-field"><Label htmlFor="interview-candidate">Candidate</Label><Input id="interview-candidate" name="candidate" required placeholder="Candidate name" /></div>
      <div className="form-field"><Label htmlFor="interview-role">Position</Label><Input id="interview-role" name="role" required placeholder="Job title" /></div>
      <div className="form-field"><Label htmlFor="interview-date">Date</Label><Input id="interview-date" name="date" type="date" required /></div>
      <div className="form-field"><Label htmlFor="interview-time">Time</Label><Input id="interview-time" name="time" type="time" required /></div>
      <div className="form-field sm:col-span-2"><Label htmlFor="interviewer">Interviewer</Label><Input id="interviewer" name="interviewer" required placeholder="Interviewer name" /></div>
      <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button type="submit"><Check aria-hidden="true" /> Confirm schedule</Button></div>
    </form></CardContent></Card> : null}
    <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
      <Card><CardHeader><PanelTitle title="October 2026" action={<CalendarDays className="size-5 text-primary" />} /></CardHeader><CardContent>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">{["S", "M", "T", "W", "T", "F", "S"].map((day, i) => <span key={`${day}-${i}`} className="py-2">{day}</span>)}{Array.from({ length: 35 }, (_, index) => { const day = index - 2; return <button key={index} type="button" className={`rounded-full p-2 text-sm ${day > 0 && day <= 31 ? "hover:bg-accent" : "text-transparent"} ${day === 24 ? "bg-primary font-semibold text-primary-foreground hover:bg-primary" : ""}`}>{day > 0 && day <= 31 ? day : "·"}</button>; })}</div>
        <div className="mt-5 space-y-2 border-t pt-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quick filters</p>{["All", "Scheduled", "Confirmed", "Rescheduled"].map((item) => <button type="button" key={item} onClick={() => setFilter(item)} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm ${filter === item ? "bg-accent font-semibold text-accent-foreground" : "hover:bg-muted"}`}>{item}<span className="text-muted-foreground">{item === "All" ? interviews.length : interviews.filter((i) => i.status === item).length}</span></button>)}</div>
      </CardContent></Card>
      <Card><CardHeader><PanelTitle eyebrow="Upcoming interviews" title={`${visible.length} interviews`} action={<div className="search-field"><Search aria-hidden="true" size={16} /><Input aria-label="Search interviews" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search interviews" /></div>} /></CardHeader><CardContent>
        <div className="space-y-3">{visible.map((item) => <div key={item.id} className="flex flex-col justify-between gap-4 rounded-xl border p-4 md:flex-row md:items-center">
          <Person name={item.name} detail={item.role} />
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted-foreground md:grid-cols-3"><span className="flex items-center gap-1"><CalendarDays className="size-3.5" />{item.date}</span><span className="flex items-center gap-1"><Clock3 className="size-3.5" />{item.time}</span><span>{item.interviewer}</span></div>
          <div className="flex items-center justify-between gap-2"><Badge variant={item.status === "Confirmed" ? "success" : item.status === "Rescheduled" ? "warning" : "neutral"}>{item.status}</Badge><Button variant="ghost" size="sm" onClick={() => setNotice(`Reminder prepared for ${item.name}.`)}>Send reminder</Button></div>
        </div>)}
        {visible.length === 0 ? <p className="empty-message">No interviews match these filters.</p> : null}</div>
      </CardContent></Card>
    </div>
  </div>;
}

export function CommunicationPage({ candidates }: { candidates: Candidate[] }) {
  const [selectedTemplate, setSelectedTemplate] = useState("Interview invitation");
  const [recipient, setRecipient] = useState(candidates[0]?.email ?? "");
  const [subject, setSubject] = useState("Interview invitation — Trishakti Poly Packs");
  const [message, setMessage] = useState("Hi {{candidate_name}},\n\nThank you for your interest in {{job_title}} at Trishakti Poly Packs. We would like to invite you to an interview with our team.\n\nPlease reply with a few times that work for you.\n\nBest regards,\nPeople Team");
  const [notice, setNotice] = useState("");
  const templates = ["Application acknowledgement", "Interview invitation", "Selection notification", "Rejection notice", "Offer communication"];
  function chooseTemplate(template: string) {
    setSelectedTemplate(template);
    setSubject(`${template} — Trishakti Poly Packs`);
    setNotice("");
  }
  return <div className="page-stack">
    <PageHeader eyebrow="Recruitment" title="Communication hub" description="Use consistent, thoughtful messages throughout the candidate journey." action={<Button variant="outline"><Mail aria-hidden="true" /> Email templates</Button>} />
    <DemoNotice />
    {notice ? <p role="status" className="rounded-lg bg-accent p-3 text-sm text-accent-foreground">{notice}</p> : null}
    <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
      <div className="space-y-4">
        <Card><CardHeader><PanelTitle title="Email templates" /></CardHeader><CardContent className="space-y-1">{templates.map((template) => <button type="button" key={template} onClick={() => chooseTemplate(template)} className={`w-full rounded-lg px-3 py-2.5 text-left text-sm ${selectedTemplate === template ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{template}</button>)}</CardContent></Card>
        <Card><CardHeader><PanelTitle title="Recent history" /></CardHeader><CardContent className="space-y-4 text-sm"><div><Person name="Alex Johnson" detail="Interview schedule · 2h ago" initials="AJ" /><Badge className="mt-2" variant="success">Sent</Badge></div><div><Person name="Sarah Miller" detail="Application received · 1d ago" initials="SM" /><Badge className="mt-2" variant="neutral">Auto reply</Badge></div></CardContent></Card>
      </div>
      <Card><CardHeader><PanelTitle title="Compose message" action={<Button size="sm" variant="outline" onClick={() => setNotice("Draft saved in this demo.")}>Save draft</Button>} /></CardHeader><CardContent>
        <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); setNotice(`Message prepared for ${recipient}. Sending is not connected in this demo.`); }}>
          <div className="form-field"><Label htmlFor="message-to">To</Label><select id="message-to" className="form-select w-full" value={recipient} onChange={(event) => setRecipient(event.target.value)}>{candidates.map((candidate) => <option key={candidate.id} value={candidate.email}>{candidate.name} · {candidate.email}</option>)}</select></div>
          <div className="form-field"><Label htmlFor="message-subject">Subject</Label><Input id="message-subject" value={subject} onChange={(event) => setSubject(event.target.value)} required /></div>
          <div className="flex flex-wrap gap-2 border-y py-3">{["{{candidate_name}}", "{{job_title}}", "{{interview_date}}"].map((variable) => <Button key={variable} type="button" size="sm" variant="outline" onClick={() => setMessage((current) => `${current}\n${variable}`)}>{variable}</Button>)}</div>
          <div className="form-field"><Label htmlFor="message-body">Message</Label><Textarea id="message-body" value={message} onChange={(event) => setMessage(event.target.value)} className="min-h-72 leading-6" required /></div>
          <div className="flex justify-end"><Button type="submit"><Send aria-hidden="true" /> Prepare message</Button></div>
        </form>
      </CardContent></Card>
    </div>
  </div>;
}

export function OfferGenerationPage({ candidates }: { candidates: Candidate[] }) {
  const [step, setStep] = useState(1);
  const [notice, setNotice] = useState("");
  const candidate = candidates.find((item) => item.stage === "Shortlisted") ?? candidates[0];
  return <div className="page-stack">
    <PageHeader eyebrow="Recruitment" title="Generate offer" description="Prepare an offer for review and share the next step with your candidate." />
    <DemoNotice />
    {notice ? <p role="status" className="rounded-lg bg-accent p-3 text-sm text-accent-foreground">{notice}</p> : null}
    <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)]">
      <Card><CardHeader><PanelTitle title="Offer details" /></CardHeader><CardContent>
        <div className="mb-6 grid grid-cols-3 gap-2">{["Candidate", "Offer details", "Review"].map((label, index) => <button type="button" key={label} onClick={() => setStep(index + 1)} className={`border-b-2 pb-3 text-xs font-semibold sm:text-sm ${step === index + 1 ? "border-primary text-primary" : "border-border text-muted-foreground"}`}><span className="mr-2 inline-grid size-6 place-items-center rounded-full bg-muted">{index + 1}</span>{label}</button>)}</div>
        <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); setNotice("Offer preview is ready. Review the details before sending."); setStep(3); }}>
          <div className="form-field"><Label htmlFor="offer-candidate">Candidate</Label><select id="offer-candidate" className="form-select w-full" defaultValue={candidate?.id}>{candidates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
          <div className="form-field"><Label htmlFor="offer-position">Position</Label><Input id="offer-position" defaultValue={candidate?.role ?? "Senior Product Designer"} required /></div>
          <div className="grid gap-4 sm:grid-cols-2"><div className="form-field"><Label htmlFor="offer-salary">Annual salary</Label><Input id="offer-salary" type="number" min="0" defaultValue="85000" required /></div><div className="form-field"><Label htmlFor="offer-bonus">Sign-on bonus</Label><Input id="offer-bonus" type="number" min="0" defaultValue="5000" /></div></div>
          <div className="grid gap-4 sm:grid-cols-2"><div className="form-field"><Label htmlFor="offer-start">Joining date</Label><Input id="offer-start" type="date" required /></div><div className="form-field"><Label htmlFor="offer-expiry">Offer expiry</Label><Input id="offer-expiry" type="date" required /></div></div>
          <div className="form-field"><Label htmlFor="offer-benefits">Key benefits</Label><Textarea id="offer-benefits" defaultValue="Health coverage, paid leave, professional development" /></div>
          <div className="flex flex-wrap justify-between gap-2 border-t pt-4"><Button type="button" variant="outline" onClick={() => setStep(Math.max(1, step - 1))}><ArrowLeft aria-hidden="true" /> Previous</Button><Button type="submit">{step === 3 ? "Update preview" : "Continue"}<ArrowRight aria-hidden="true" /></Button></div>
        </form>
      </CardContent></Card>
      <Card className="h-fit"><CardHeader><PanelTitle title="Offer document preview" action={<Button size="sm" variant="outline" onClick={() => setNotice("Offer draft downloaded in this demo.")}><Download aria-hidden="true" /> Export</Button>} /></CardHeader><CardContent>
        <div className="mx-auto max-w-xl border bg-background p-6 shadow-sm sm:p-10">
          <div className="border-b pb-5"><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Trishakti Poly Packs</p><p className="mt-5 text-xs text-muted-foreground">OFFER OF EMPLOYMENT</p><h2 className="mt-2 text-2xl font-bold">Welcome to the team, {candidate?.name ?? "Eleanor Shellstrop"}</h2></div>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">We are pleased to offer you the position of <strong className="text-foreground">{candidate?.role ?? "Senior Product Designer"}</strong>. We look forward to the experience and perspective you will bring to our team.</p>
          <div className="my-6 space-y-3 rounded-lg bg-muted/50 p-4 text-sm"><p className="flex justify-between gap-4"><span className="text-muted-foreground">Annual salary</span><strong> NPR 8,500,000</strong></p><p className="flex justify-between gap-4"><span className="text-muted-foreground">Sign-on bonus</span><strong>NPR 500,000</strong></p><p className="flex justify-between gap-4"><span className="text-muted-foreground">Start date</span><strong>To be confirmed</strong></p></div>
          <p className="text-sm leading-6 text-muted-foreground">This offer is subject to completion of standard employment checks and signing the employment agreement. Please contact the People team with any questions.</p>
          <div className="mt-8 flex justify-between border-t pt-5 text-xs text-muted-foreground"><span>People Operations</span><span>Candidate acceptance</span></div>
        </div>
        <Button className="mt-4 w-full" onClick={() => setNotice(`Offer prepared for ${candidate?.name ?? "the selected candidate"}. Sending is not connected in this demo.`)}><Send aria-hidden="true" /> Send offer</Button>
      </CardContent></Card>
    </div>
  </div>;
}

export function OnboardingPage() {
  const { candidateId } = useParams();
  const [documents, setDocuments] = useState(onboardingDocuments);
  const [notice, setNotice] = useState("");
  const completed = documents.filter((item) => item.status === "Complete").length;
  const name = candidateId?.toLowerCase().includes("eleanor") ? "Eleanor Shellstrop" : "Eleanor Shellstrop";
  function toggle(index: number) {
    setDocuments((current) => current.map((item, i) => i === index ? { ...item, status: item.status === "Complete" ? "Pending" : "Complete" } : item));
  }
  return <div className="page-stack">
    <PageHeader eyebrow="People operations" title={`Onboarding: ${name}`} description="Coordinate documents, tasks, and first-day readiness." action={<Button onClick={() => setNotice("Onboarding marked as complete in this demo.")}><CheckCircle2 aria-hidden="true" /> Approve & complete</Button>} />
    <DemoNotice />
    {notice ? <p role="status" className="rounded-lg bg-accent p-3 text-sm text-accent-foreground">{notice}</p> : null}
    <Card><CardContent className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-center">
      <Person name={name} detail="Senior Product Designer · Start date: Aug 1, 2026" initials="ES" />
      <div className="min-w-56"><div className="mb-2 flex justify-between text-sm"><span>Onboarding progress</span><strong>{Math.round(completed / documents.length * 100)}%</strong></div><div className="h-2.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completed / documents.length * 100}%` }} /></div><p className="mt-1 text-xs text-muted-foreground">{completed} of {documents.length} checklist items completed</p></div>
    </CardContent></Card>
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card><CardHeader><PanelTitle title="Required actions checklist" action={<Badge variant="neutral">{documents.length - completed} remaining</Badge>} /></CardHeader><CardContent className="space-y-2">
        {documents.map((item, index) => <div key={item.name} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
          <div className="flex items-center gap-3"><span className={`grid size-9 place-items-center rounded-full ${item.status === "Complete" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{item.status === "Complete" ? <Check aria-hidden="true" className="size-4" /> : <FileText aria-hidden="true" className="size-4" />}</span><div><p className="text-sm font-semibold">{item.name}</p><p className="text-xs text-muted-foreground">{item.detail}</p></div></div>
          <div className="flex items-center gap-2"><Badge variant={item.status === "Complete" ? "success" : item.status === "Review" ? "warning" : "neutral"}>{item.status}</Badge><Button size="sm" variant="outline" onClick={() => toggle(index)}>{item.status === "Complete" ? "Mark pending" : "Approve"}</Button></div>
        </div>)}
      </CardContent></Card>
      <div className="space-y-4">
        <Card><CardHeader><PanelTitle title="Upcoming milestones" /></CardHeader><CardContent className="space-y-4 text-sm"><p><strong>Aug 1</strong><span className="block text-muted-foreground">First day and orientation</span></p><p><strong>Aug 5</strong><span className="block text-muted-foreground">Meet the team</span></p><p><strong>Aug 15</strong><span className="block text-muted-foreground">30-day check-in</span></p></CardContent></Card>
        <Card><CardHeader><PanelTitle title="Additional documents" action={<Button size="icon" variant="ghost" aria-label="Upload document"><Upload aria-hidden="true" /></Button>} /></CardHeader><CardContent className="space-y-2 text-sm"><button className="flex w-full items-center justify-between rounded-lg border p-3 text-left" onClick={() => setNotice("Employment contract is available in this demo.")}><span><FileCheck2 className="mr-2 inline size-4 text-primary" /> Employment contract</span><Download className="size-4" /></button><button className="flex w-full items-center justify-between rounded-lg border p-3 text-left" onClick={() => setNotice("Offer letter is available in this demo.")}><span><FileText className="mr-2 inline size-4 text-primary" /> Offer letter</span><Download className="size-4" /></button></CardContent></Card>
      </div>
    </div>
  </div>;
}

export function EmployeeRecordPage() {
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState("");
  const employee = { name: "Eleanor Shellstrop", title: "Senior Product Designer", id: "EMP-2024-089", department: "Product & Design", manager: "Alex Mercer", location: "Hetauda, Nepal", email: "eleanor.s@trishakti.com", phone: "+977 980-555-0184", startDate: "July 15, 2024", status: "Active" };
  return <div className="page-stack">
    <PageHeader eyebrow="Employees · Employee record" title={employee.name} description={`${employee.title} · ${employee.id}`} action={<div className="flex gap-2"><Button variant="outline" onClick={() => setNotice("Profile export prepared in this demo.")}><Download aria-hidden="true" /> Export profile</Button><Button onClick={() => setEditing((value) => !value)}>{editing ? "Cancel edit" : "Edit record"}</Button></div>} />
    <DemoNotice />
    {notice ? <p role="status" className="rounded-lg bg-accent p-3 text-sm text-accent-foreground">{notice}</p> : null}
    <div className="grid gap-4 lg:grid-cols-[minmax(240px,0.7fr)_minmax(0,1.8fr)]">
      <Card className="h-fit"><CardContent className="flex flex-col items-center p-6 text-center"><Avatar className="size-24"><AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">ES</AvatarFallback></Avatar><h2 className="mt-4 text-xl font-semibold">{employee.name}</h2><p className="mt-1 text-sm text-muted-foreground">{employee.title}</p><Badge className="mt-3" variant="success">{employee.status}</Badge><div className="mt-5 w-full border-t pt-4 text-left text-sm"><p className="mb-3 font-semibold">Employment details</p><p className="py-1 text-muted-foreground">Employee ID <strong className="float-right text-foreground">{employee.id}</strong></p><p className="py-1 text-muted-foreground">Department <strong className="float-right text-foreground">{employee.department}</strong></p><p className="py-1 text-muted-foreground">Start date <strong className="float-right text-foreground">{employee.startDate}</strong></p></div></CardContent></Card>
      <div className="space-y-4">
        <Card><CardHeader><PanelTitle title="Personal details" action={<UserRound className="size-5 text-primary" />} /></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
          {[["Full name", employee.name], ["Date of birth", "May 14, 1990"], ["Work email", employee.email], ["Phone number", employee.phone], ["Department", employee.department], ["Manager", employee.manager], ["Work location", employee.location], ["Employment type", "Full-time"]].map(([label, value]) => <div key={label} className="border-b pb-3"><p className="text-xs text-muted-foreground">{label}</p>{editing ? <Input className="mt-1" defaultValue={value} aria-label={label} /> : <p className="mt-1 text-sm font-medium">{value}</p>}</div>)}
        </CardContent>{editing ? <div className="flex justify-end p-4 pt-0"><Button onClick={() => { setEditing(false); setNotice("Employee record saved in this demo."); }}>Save changes</Button></div> : null}</Card>
        <div className="grid gap-4 md:grid-cols-2">
          <Card><CardHeader><PanelTitle title="Documents" /></CardHeader><CardContent className="space-y-3 text-sm">{["Signed offer letter", "Employment agreement", "Identity document"].map((item) => <button key={item} className="flex w-full items-center justify-between border-b pb-3 text-left" onClick={() => setNotice(`${item} preview is not connected in this demo.`)}>{item}<Download className="size-4 text-muted-foreground" /></button>)}</CardContent></Card>
          <Card><CardHeader><PanelTitle title="Recruitment journey" /></CardHeader><CardContent className="space-y-4 text-sm"><p><Badge variant="success">Completed</Badge><span className="ml-2">Offer accepted</span><small className="mt-1 block text-muted-foreground">June 28, 2024</small></p><p><Badge variant="success">Completed</Badge><span className="ml-2">Onboarding complete</span><small className="mt-1 block text-muted-foreground">July 15, 2024</small></p><Link className="inline-flex items-center gap-1 text-primary hover:underline" to="/onboarding/eleanor-shellstrop">View onboarding <ArrowRight className="size-4" /></Link></CardContent></Card>
        </div>
      </div>
    </div>
  </div>;
}
