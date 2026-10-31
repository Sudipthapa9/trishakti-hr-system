/**
 * Composes the public careers design and filters published sample vacancies without contacting a recruitment API.
 */
import { PublicShell } from "@/components/Layout/public-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Job } from "@/types/hr";
import {
  ArrowRight,
  Clock3,
  GraduationCap,
  Heart,
  Leaf,
  Lightbulb,
  MapPin,
  Search,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./careers-page.css";
// Composes the public careers design and filters published sample vacancies without contacting a recruitment API.
export function CareersPage({ jobs }: { jobs: Job[] }) {
  // Keep query in component state; updates trigger a render.
  const [query, setQuery] = useState("");
  // Keep location in component state; updates trigger a render.
  const [location, setLocation] = useState("All Locations");
  // Keep count in component state; updates trigger a render.
  const [count, setCount] = useState(3);
  // Recompute this derived view only when its declared inputs change.
  const open = useMemo(
    () =>
      jobs.filter(
        (j) =>
          j.status === "Open" &&
          (location === "All Locations" || j.location === location) &&
          (j.title + " " + j.department)
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [jobs, query, location],
  );
  return (
    <div className="page-public-careers-page">
      <PublicShell>
        {/* Main screen content; shared navigation is composed separately. */}
        <main>
          {/* Group related content and controls in this screen section. */}
          <section className="careers-hero">
            <h1>Join Our Team</h1>
            <p>
              Build a sustainable future with Trikshati Poly Packs. We are
              looking for
              <br className="hidden sm:block" /> innovative minds to shape the
              next generation of packaging solutions.
            </p>
            {/* Collect inputs; the submit handler controls validation and the resulting local action. */}
            <form
              className="careers-search"
              onSubmit={(e) => {
                e.preventDefault();
                document
                  .getElementById("open-positions")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <label>
                <Search size={17} />
                <Input
                  aria-label="Search jobs"
                  placeholder="Job title, keyword, or department"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setCount(3);
                  }}
                />
              </label>
              <label>
                <MapPin size={17} />
                <select
                  aria-label="Location"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setCount(3);
                  }}
                >
                  <option>All Locations</option>
                  {[
                    ...new Set(
                      jobs
                        .filter((j) => j.status === "Open")
                        .map((j) => j.location),
                    ),
                  ].map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </label>
              <Button type="submit">Search Jobs</Button>
            </form>
          </section>
          {/* Group related content and controls in this screen section. */}
          <section className="careers-values" id="values">
            {/* Page or panel heading and contextual actions. */}
            <header>
              <h2>Culture & Values</h2>
              <p>The principles that guide how we work and build together.</p>
            </header>
            <div>
              {[
                [
                  "Innovation",
                  "We continuously explore new materials and processes to redefine packaging limits.",
                  Lightbulb,
                ],
                [
                  "Sustainability",
                  "Eco-friendly solutions are at the core of our business, striving for a zero-waste future.",
                  Leaf,
                ],
                [
                  "People-First",
                  "We invest in our team's growth, well-being, and foster an inclusive, supportive environment.",
                  Users,
                ],
              ].map(([title, text, Icon]) => {
                const I = Icon as typeof Leaf;
                return (
                  <article key={String(title)}>
                    <span>
                      <I size={23} />
                    </span>
                    <h3>{String(title)}</h3>
                    <p>{String(text)}</p>
                  </article>
                );
              })}
            </div>
          </section>
          {/* Group related content and controls in this screen section. */}
          <section className="careers-benefits">
            {/* Page or panel heading and contextual actions. */}
            <header>
              <h2>Employee Benefits</h2>
              <p>We take care of our own.</p>
            </header>
            <div>
              {[
                [
                  "Flexible Work",
                  "Hybrid and remote options available for eligible roles.",
                  Clock3,
                ],
                [
                  "Health & Wellness",
                  "Comprehensive medical coverage and wellness programs.",
                  Heart,
                ],
                [
                  "Growth Budget",
                  "Annual stipend for courses, conferences, and certifications.",
                  GraduationCap,
                ],
                [
                  "Team Retreats",
                  "Annual company getaways to recharge and connect.",
                  Users,
                ],
              ].map(([title, text, Icon]) => {
                const I = Icon as typeof Heart;
                return (
                  <article key={String(title)}>
                    <I size={21} />
                    <h3>{String(title)}</h3>
                    <p>{String(text)}</p>
                  </article>
                );
              })}
            </div>
          </section>
          {/* Group related content and controls in this screen section. */}
          <section className="careers-life" id="about">
            {/* Page or panel heading and contextual actions. */}
            <header>
              <h2>Life at Trikshati</h2>
              <p>A glimpse into our daily work and culture.</p>
            </header>
            <div className="careers-gallery">
              <img
                src="/design/careers-9.png"
                alt="Colleagues collaborating around a meeting table"
              />
              <img
                src="/design/careers-10.png"
                alt="Packaging engineers on the production floor"
              />
              <img
                src="/design/careers-3.png"
                alt="Bright shared office with plants and workspaces"
              />
              <img
                src="/design/careers-7.png"
                alt="Team discussing sustainable materials"
              />
              <img
                src="/design/careers-8.png"
                alt="Colleagues sharing a meal"
              />
            </div>
          </section>
          {/* Group related content and controls in this screen section. */}
          <section className="careers-testimonial">
            <span aria-hidden="true">❞</span>
            <blockquote>
              “Joining Trikshati was the best career move I've made. The
              dedication to sustainable engineering and the supportive
              environment allows me to truly innovate and grow every day.”
            </blockquote>
            <span className="testimonial-avatar">AS</span>
            <strong>Aarav Sharma</strong>
            <small>Senior Packaging Engineer</small>
          </section>
          {/* Group related content and controls in this screen section. */}
          <section className="careers-open" id="open-positions">
            {/* Page or panel heading and contextual actions. */}
            <header>
              <div>
                <h2>Open Positions</h2>
                <p>
                  Showing {Math.min(count, open.length)} of {open.length} open
                  roles
                </p>
              </div>
              <span>All Departments</span>
            </header>
            <div className="careers-job-grid">
              {open.slice(0, count).map((j) => (
                <article key={j.id}>
                  <div>
                    <span>{j.department}</span>
                    <small>{j.employmentType}</small>
                  </div>
                  <h3>{j.title}</h3>
                  <p className="careers-job-location">
                    <MapPin size={12} />
                    {j.location}
                  </p>
                  <p>
                    {j.description ??
                      "Join our team and help develop innovative, sustainable packaging solutions."}
                  </p>
                  {/* Supporting links, pagination, or secondary screen actions. */}
                  <footer>
                    <Link to={"/careers/" + j.id}>
                      View Details
                      <ArrowRight size={12} />
                    </Link>
                    <Button asChild variant="outline" size="xs">
                      <Link to={"/careers/" + j.id + "/application"}>
                        Apply Now
                      </Link>
                    </Button>
                  </footer>
                </article>
              ))}
            </div>
            {!open.length ? (
              <p className="empty-message">No positions match your search.</p>
            ) : null}
            {count < open.length ? (
              <Button variant="outline" onClick={() => setCount((v) => v + 3)}>
                Load More Positions
              </Button>
            ) : null}
          </section>
        </main>
      </PublicShell>
    </div>
  );
}
