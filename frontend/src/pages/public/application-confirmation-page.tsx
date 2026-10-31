/**
 * Renders the application confirmation design and optional navigation-state reference; no real submission is implied by the prototype.
 */
import { PublicShell } from "@/components/Layout/public-shell";
import { Button } from "@/components/ui/button";
import { Check, ClipboardCheck, Mail, Phone } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import "./application-confirmation-page.css";
// Renders the application confirmation design and optional navigation-state reference; no real submission is implied by the prototype.
export function ApplicationConfirmationPage() {
  const { state } = useLocation();
  const details = state as {
    reference?: string;
    candidateName?: string;
    jobTitle?: string;
  } | null;
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
                Demo reference: {details.reference}
              </small>
            ) : null}
            <div className="confirmation-next">
              <h2>What's Next?</h2>
              {[
                [
                  "Confirmation Email",
                  "You will receive an email confirming receipt of your application.",
                  Mail,
                ],
                [
                  "Initial Review",
                  "Our team will review your profile within 3–5 business days.",
                  ClipboardCheck,
                ],
                [
                  "Follow-up",
                  "If your qualifications match our needs, we will contact you to schedule an interview.",
                  Phone,
                ],
              ].map(([title, text, Icon]) => {
                const I = Icon as typeof Mail;
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
            <small className="confirmation-demo">
              Prototype confirmation: no application or email has been sent.
            </small>
          </section>
        </main>
      </PublicShell>
    </div>
  );
}
