/**
 * Renders the application confirmation design using the receipt returned after the saved submission.
 */
import { PublicShell } from "@/components/Layout/public-shell";
import { Button } from "@/components/ui/button";
import { Check, ClipboardCheck, Phone } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import "./application-confirmation-page.css";
// Renders the application confirmation design using the receipt returned after the saved submission.
export function ApplicationConfirmationPage() {
  const { state } = useLocation();
  const details = state as {
    reference?: string;
    candidateName?: string;
    jobTitle?: string;
  } | null;
  if (!details?.reference) {
    return (
      <PublicShell>
        <main className="application-confirmation">
          <section>
            <h1>No application receipt available</h1>
            <p>Return to the job board to submit an application.</p>
            <Button asChild><Link to="/careers">Return to Job Board</Link></Button>
          </section>
        </main>
      </PublicShell>
    );
  }
  return (
    <div className="page-public-application-confirmation-page">
      <PublicShell showHeader={false}>
        {/* Main screen content; shared navigation is composed separately. */}
        <main className="application-confirmation">
          {/* Group related content and controls in this screen section. */}
          <section>
            <span className="confirmation-check">
              <Check size={30} />
            </span>
            <h1>Application Received</h1>
            <p>
              Thank you for applying to Trikshati Poly Packs. We have
              successfully received your application and our HR team will review
              it shortly.
            </p>
            {details?.reference ? (
              <small className="confirmation-reference">
                Application reference: {details.reference}
              </small>
            ) : null}
            <div className="confirmation-next">
              <h2>What's Next?</h2>
              {[
                [
                  "Keep Your Reference",
                  "Save the application reference above for any follow-up with HR.",
                  ClipboardCheck,
                ],
                [
                  "Initial Review",
                  "Our HR team will review your application and CV.",
                  ClipboardCheck,
                ],
                [
                  "Follow-up",
                  "If your qualifications match our needs, we will contact you to schedule an interview.",
                  Phone,
                ],
              ].map(([title, text, Icon]) => {
                const I = Icon as typeof ClipboardCheck;
                return (
                  <div key={String(title)}>
                    <I size={18} />
                    <p>
                      <strong>{String(title)}</strong>
                      <span>{String(text)}</span>
                    </p>
                  </div>
                );
              })}
            </div>
            <Button asChild>
              <Link to="/careers">Return to Job Board</Link>
            </Button>

          </section>
        </main>
      </PublicShell>
    </div>
  );
}
