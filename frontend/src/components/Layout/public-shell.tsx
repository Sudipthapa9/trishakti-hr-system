/**
 * Provides the public careers header, footer, and reusable job metadata without the HR workspace sidebar.
 */
import { Button } from "@/components/ui/button";
import type { Job } from "@/types/hr";
import { BriefcaseBusiness, MapPin } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import "./public-shell.css";
// Provides the public careers header, footer, and reusable job metadata without the HR workspace sidebar.
export function PublicShell({
  children,
  showHeader = true,
}: {
  children: ReactNode;
  showHeader?: boolean;
}) {
  return (
    <div className="public-site">
      {showHeader ? (
        <header className="public-header">
          <Link to="/careers" className="public-brand">
            Trikshati Poly Packs
          </Link>
          {/* Related navigation destinations or workflow steps. */}
          <nav aria-label="Careers navigation">
            <Link to="/careers">Careers</Link>
            <a href="/careers#values">About Us</a>
            <details>
              <summary>Application Status</summary>
              <p>
                Application status tracking will be available when applications
                open.
              </p>
            </details>
          </nav>
          <Button asChild size="sm">
            <Link to="/">Sign In</Link>
          </Button>
        </header>
      ) : null}
      {children}
      {/* Supporting links, pagination, or secondary screen actions. */}
      <footer className="public-footer">
        <Link className="public-brand" to="/careers">
          Trikshati Poly Packs
        </Link>
        <div>
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <a href="mailto:careers@trishakti.example">Contact Us</a>
          <span>Cookie Policy</span>
        </div>
        <small>© 2024 Trikshati Poly Packs. All rights reserved.</small>
      </footer>
    </div>
  );
}
// Provides the public careers header, footer, and reusable job metadata without the HR workspace sidebar.
export function JobSummary({ job }: { job: Job }) {
  return (
    <div className="job-metadata">
      <span>
        <MapPin size={13} />
        {job.location}
      </span>
      <span>
        <BriefcaseBusiness size={13} />
        {job.employmentType}
      </span>
    </div>
  );
}
