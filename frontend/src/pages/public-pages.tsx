import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, CheckCircle2, Clock3, MapPin, Search } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Job } from "@/types/hr";

function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas)]">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <Link to="/careers" className="flex items-center gap-3 text-foreground no-underline">
            <span className="grid size-10 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">T</span>
            <span><span className="block text-xs font-bold uppercase tracking-[0.14em] text-primary">Trishakti</span><span className="block text-sm font-semibold">Poly Packs</span></span>
          </Link>
          <nav aria-label="Public navigation" className="flex items-center gap-3 text-sm md:gap-7">
            <Link className="text-muted-foreground hover:text-foreground" to="/careers">Careers</Link>
            <a className="hidden text-muted-foreground hover:text-foreground sm:inline" href="/careers#about">About us</a>
            <a className="hidden text-muted-foreground hover:text-foreground sm:inline" href="/careers#values">Our culture</a>
            <Button asChild size="sm" variant="outline"><Link to="/careers">Open roles</Link></Button>
          </nav>
        </div>
      </header>
      {children}
      <footer className="mt-16 border-t border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-5 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center md:px-8">
          <span className="font-semibold text-foreground">Trishakti Poly Packs</span>
          <div className="flex flex-wrap gap-4"><a href="#privacy">Privacy policy</a><a href="#terms">Terms of service</a><a href="mailto:careers@trishakti.example">Contact us</a></div>
          <span>© 2026 Trishakti Poly Packs. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

function JobSummary({ job }: { job: Job }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1"><MapPin aria-hidden="true" className="size-3.5" />{job.location}</span>
      <span className="inline-flex items-center gap-1"><BriefcaseBusiness aria-hidden="true" className="size-3.5" />{job.employmentType}</span>
      <span className="inline-flex items-center gap-1"><Clock3 aria-hidden="true" className="size-3.5" />{job.department}</span>
    </div>
  );
}

export function CareersPage({ jobs }: { jobs: Job[] }) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("All locations");
  const openJobs = jobs.filter((job) => job.status === "Open");
  const locations = ["All locations", ...new Set(openJobs.map((job) => job.location))];
  const filteredJobs = useMemo(() => jobs.filter((job) => job.status === "Open" &&
    `${job.title} ${job.department} ${job.location}`.toLowerCase().includes(query.trim().toLowerCase()) &&
    (location === "All locations" || job.location === location)
  ), [jobs, location, query]);

  return <PublicShell>
    <main>
      <section className="border-b border-border bg-[linear-gradient(120deg,#f4eee2_0%,#fbf8f1_55%,#edf3ee_100%)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-[1.2fr_0.8fr] md:items-center md:px-8 md:py-24">
          <div><Badge variant="success">Careers at Trishakti</Badge><h1 className="mt-5 max-w-2xl text-4xl font-bold tracking-tight text-foreground md:text-6xl">Build a more sustainable future with us.</h1><p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">Bring your ideas and experience to a team creating the next generation of responsible packaging solutions.</p><a href="#open-positions" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Explore open roles <ArrowRight className="size-4" /></a></div>
          <div className="grid grid-cols-2 gap-3"><div className="min-h-36 rounded-2xl bg-primary/10 p-5"><p className="text-3xl font-bold text-primary">01</p><p className="mt-8 text-sm font-medium">Purpose-led work</p></div><div className="mt-8 min-h-36 rounded-2xl bg-white/80 p-5"><p className="text-3xl font-bold text-primary">02</p><p className="mt-8 text-sm font-medium">Room to grow</p></div><div className="min-h-36 rounded-2xl bg-white/80 p-5"><p className="text-3xl font-bold text-primary">03</p><p className="mt-8 text-sm font-medium">People-first culture</p></div><div className="mt-8 min-h-36 rounded-2xl bg-primary/10 p-5"><p className="text-3xl font-bold text-primary">04</p><p className="mt-8 text-sm font-medium">Teams that collaborate</p></div></div>
        </div>
      </section>
      <section id="open-positions" className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
        <div className="mx-auto max-w-2xl text-center"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Find your next role</p><h2 className="mt-3 text-3xl font-bold tracking-tight">Join our team</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">We are looking for thoughtful people who want to make a lasting difference.</p></div>
        <div className="mt-8 grid gap-3 rounded-xl border bg-card p-3 md:grid-cols-[1fr_220px_auto]">
          <div className="search-field"><Search aria-hidden="true" size={16} /><Input aria-label="Search jobs" placeholder="Job title, keyword, or department" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
          <label><span className="sr-only">Filter by location</span><select className="form-select w-full" value={location} onChange={(event) => setLocation(event.target.value)}>{locations.map((item) => <option key={item}>{item}</option>)}</select></label>
          <Button onClick={() => document.getElementById("jobs-list")?.scrollIntoView({ behavior: "smooth" })}>Search jobs</Button>
        </div>
        <div id="jobs-list" className="mt-6 space-y-3">
          {filteredJobs.map((job) => <Card key={job.id}><CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"><div><h3 className="text-lg font-semibold">{job.title}</h3><div className="mt-2"><JobSummary job={job} /></div></div><Button asChild variant="outline"><Link to={`/careers/${job.id}`}>View position <ArrowRight aria-hidden="true" /></Link></Button></CardContent></Card>)}
          {filteredJobs.length === 0 ? <div className="rounded-xl border border-dashed p-12 text-center"><BriefcaseBusiness className="mx-auto size-8 text-muted-foreground" /><h3 className="mt-3 font-semibold">No positions found</h3><p className="mt-1 text-sm text-muted-foreground">Try another search or check back soon.</p></div> : null}
        </div>
      </section>
      <section id="values" className="border-y border-border bg-card"><div className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-16"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Culture & values</p><h2 className="mt-3 text-3xl font-bold">The principles that guide us</h2><div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["Innovation", "We keep exploring smarter materials and better ways to make."], ["Collaboration", "We solve meaningful challenges together across teams."], ["Sustainability", "We build with the long-term health of our communities in mind."], ["Growth", "We make space for people to learn, contribute, and lead."]].map(([title, description], index) => <div key={title} className="rounded-xl border bg-background p-5"><span className="grid size-9 place-items-center rounded-full bg-accent font-semibold text-accent-foreground">0{index + 1}</span><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></div>)}</div></div></section>
    </main>
  </PublicShell>;
}

export function CareerJobPage({ jobs }: { jobs: Job[] }) {
  const { jobId } = useParams();
  const job = jobs.find((item) => item.id === jobId && item.status === "Open");
  const navigate = useNavigate();

  function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const reference = `TSH-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    navigate(`/careers/${job?.id ?? jobId}/application/confirmation`, { state: { reference, candidateName: form.get("fullName"), jobTitle: job?.title } });
  }

  if (!job) return <PublicShell><main className="mx-auto max-w-3xl px-5 py-20 text-center"><h1 className="text-3xl font-bold">Position unavailable</h1><p className="mt-3 text-muted-foreground">This job may have closed or is no longer available.</p><Button asChild className="mt-6"><Link to="/careers">Browse open positions</Link></Button></main></PublicShell>;

  return <PublicShell>
    <main className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-12">
      <Button asChild variant="ghost" className="mb-6"><Link to="/careers"><ArrowLeft aria-hidden="true" /> All positions</Link></Button>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <Card><CardContent className="p-6 md:p-8"><Badge variant="success">{job.status}</Badge><h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">{job.title}</h1><div className="mt-4"><JobSummary job={job} /></div><p className="mt-6 max-w-3xl leading-7 text-muted-foreground">{job.description ?? `Join the ${job.department} team at Trishakti Poly Packs. Help us deliver high-quality, sustainable solutions and grow your career with a collaborative team.`}</p><Button className="mt-6" onClick={() => document.getElementById("application-form")?.scrollIntoView({ behavior: "smooth" })}>Apply for this role <ArrowRight aria-hidden="true" /></Button></CardContent></Card>
          <Card><CardContent className="space-y-7 p-6 md:p-8"><section><h2 className="text-xl font-semibold">Job summary</h2><p className="mt-3 leading-7 text-muted-foreground">{job.description ?? "We are looking for a talented professional to join our growing team. In this role, you will own meaningful projects, collaborate with colleagues across the organization, and help create products that make a positive impact."}</p></section><section><h2 className="text-xl font-semibold">Key responsibilities</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground"><li>Lead projects from planning through delivery and continuous improvement.</li><li>Collaborate with cross-functional partners to meet quality and business goals.</li><li>Share expertise and contribute to a supportive, learning-focused team.</li></ul></section><section><h2 className="text-xl font-semibold">Required qualifications</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground"><li>Relevant experience in {job.department.toLowerCase()} or a related field.</li><li>Clear communication and strong problem-solving skills.</li><li>Commitment to safe, thoughtful, and sustainable ways of working.</li></ul></section></CardContent></Card>
        </div>
        <Card id="application-form" className="scroll-mt-6"><CardContent className="p-5 md:p-6"><h2 className="text-xl font-semibold">Apply now</h2><p className="mt-1 text-sm text-muted-foreground">Submit your application for {job.title}.</p><form className="mt-5 space-y-4" onSubmit={submitApplication}>
          <div className="form-field"><Label htmlFor="fullName">Full name *</Label><Input id="fullName" name="fullName" autoComplete="name" required /></div>
          <div className="form-field"><Label htmlFor="email">Email address *</Label><Input id="email" name="email" type="email" autoComplete="email" required /></div>
          <div className="form-field"><Label htmlFor="phone">Phone number</Label><Input id="phone" name="phone" type="tel" autoComplete="tel" /></div>
          <div className="form-field"><Label htmlFor="resume">Resume / CV *</Label><Input id="resume" name="resume" type="file" accept=".pdf,.doc,.docx" required /></div>
          <div className="form-field"><Label htmlFor="coverLetter">Cover letter</Label><Textarea id="coverLetter" name="coverLetter" className="min-h-24" placeholder="Tell us why you're interested in this position" /></div>
          <p className="text-xs leading-5 text-muted-foreground">By submitting, you agree that Trishakti Poly Packs may review the information provided for recruitment purposes.</p>
          <Button type="submit" className="w-full">Submit application <ArrowRight aria-hidden="true" /></Button>
        </form></CardContent></Card>
      </div>
    </main>
  </PublicShell>;
}

export function ApplicationConfirmationPage() {
  const location = useLocation();
  const state = location.state as { reference?: string; candidateName?: string; jobTitle?: string } | null;
  return <PublicShell><main className="grid min-h-[68vh] place-items-center px-5 py-12"><Card className="w-full max-w-2xl"><CardContent className="p-7 text-center sm:p-12"><span className="mx-auto grid size-14 place-items-center rounded-full bg-primary/10 text-primary"><CheckCircle2 aria-hidden="true" className="size-7" /></span><p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Application submitted</p><h1 className="mt-3 text-3xl font-bold">Thank you{state?.candidateName ? `, ${state.candidateName}` : ""}!</h1><p className="mx-auto mt-3 max-w-lg leading-6 text-muted-foreground">We have received your application{state?.jobTitle ? ` for ${state.jobTitle}` : ""}. Our People team will review your information and follow up.</p>{state?.reference ? <p className="mt-4 text-sm text-muted-foreground">Reference number: <strong className="text-foreground">{state.reference}</strong></p> : null}<div className="mt-8 rounded-xl bg-muted/50 p-5 text-left"><h2 className="font-semibold">What happens next?</h2><ol className="mt-4 space-y-4 text-sm"><li className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">1</span><span><strong>Confirmation email</strong><span className="block text-muted-foreground">We will send an email confirming receipt of your application.</span></span></li><li className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">2</span><span><strong>Initial review</strong><span className="block text-muted-foreground">Our team will review your profile within 3–5 business days.</span></span></li><li className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">3</span><span><strong>Follow-up</strong><span className="block text-muted-foreground">We will reach out if your experience matches our needs.</span></span></li></ol></div><Button asChild className="mt-7"><Link to="/careers">Return to careers</Link></Button></CardContent></Card></main></PublicShell>;
}

export function PublicNotFoundPage() {
  return <PublicShell><main className="grid min-h-[68vh] place-items-center px-5 py-16 text-center"><div><span className="text-sm font-bold uppercase tracking-wider text-primary">Trishakti HR</span><p className="mt-5 text-8xl font-light tracking-tight">404</p><h1 className="mt-3 text-2xl font-semibold">Lost in the quiet</h1><p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">The page you are looking for may have moved or is no longer available.</p><Button asChild className="mt-6"><Link to="/careers">Back to careers</Link></Button></div></main></PublicShell>;
}
