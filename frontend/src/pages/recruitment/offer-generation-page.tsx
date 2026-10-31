/**
 * Keeps offer inputs and document preview synchronized; printing is browser-local and delivery is not connected.
 */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Candidate } from "@/types/hr";
import { Download, Send } from "lucide-react";
import { useState } from "react";
import "./offer-generation-page.css";
// Keeps offer inputs and document preview synchronized; printing is browser-local and delivery is not connected.
export function OfferGenerationPage({
  candidates,
}: {
  candidates: Candidate[];
}) {
  const initial =
    candidates.find((c) => c.name === "Eleanor Shellstrop") ?? candidates[0];
  // Keep id in component state; updates trigger a render.
  const [id, setId] = useState(initial?.id ?? "");
  // Keep position in component state; updates trigger a render.
  const [position, setPosition] = useState(
    initial?.role ?? "Senior Product Designer",
  );
  // Keep salary in component state; updates trigger a render.
  const [salary, setSalary] = useState("145000");
  // Keep bonus in component state; updates trigger a render.
  const [bonus, setBonus] = useState("10000");
  // Keep start in component state; updates trigger a render.
  const [start, setStart] = useState("2024-09-01");
  // Keep expiry in component state; updates trigger a render.
  const [expiry, setExpiry] = useState("2024-08-15");
  // Keep benefits in component state; updates trigger a render.
  const [benefits, setBenefits] = useState(
    "Comprehensive Health Coverage\n401(k) with 5% match\nUnlimited PTO",
  );
  // Keep step in component state; updates trigger a render.
  const [step, setStep] = useState(1);
  // Keep notice in component state; updates trigger a render.
  const [notice, setNotice] = useState("");
  const candidate = candidates.find((c) => c.id === id);
  // Format the same controlled salary values used by both the editor and letter preview.
  const money = (v: string) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(Number(v) || 0);
  // Parse date-only values at local midnight to avoid shifting the displayed calendar date.
  const date = (v: string) =>
    v
      ? new Date(v + "T00:00:00").toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "To be confirmed";
  return (
    <div className="page-recruitment-offer-generation-page">
      <div className="page-stack">
        {notice ? (
          <p role="status" className="prototype-feedback">
            {notice}
          </p>
        ) : null}
        {/* Related navigation destinations or workflow steps. */}
        <nav className="offer-steps" aria-label="Offer progress">
          {["Details", "Preview", "Send"].map((v, i) => (
            <button
              key={v}
              aria-current={step === i + 1 ? "step" : undefined}
              onClick={() => setStep(i + 1)}
            >
              <span>{i + 1}</span>
              {v}
            </button>
          ))}
        </nav>
        <div className="offer-layout">
          <div>
            {/* Collect inputs; the submit handler controls validation and the resulting local action. */}
            <form
              className="offer-details"
              onSubmit={(e) => {
                e.preventDefault();
                setStep(3);
                setNotice(
                  "Offer prepared locally for review. Email delivery is not connected.",
                );
              }}
            >
              <h1>Offer Details</h1>
              <div className="form-field">
                <Label htmlFor="offer-candidate">Candidate Name</Label>
                <select
                  id="offer-candidate"
                  className="form-select"
                  value={id}
                  onChange={(e) => {
                    setId(e.target.value);
                    const c = candidates.find((c) => c.id === e.target.value);
                    if (c) setPosition(c.role);
                  }}
                >
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <Label htmlFor="offer-position">Position</Label>
                <Input
                  id="offer-position"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  required
                />
              </div>
              <div className="form-field">
                <Label htmlFor="offer-salary">Base Salary (Annual)</Label>
                <Input
                  id="offer-salary"
                  type="number"
                  min="0"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  required
                />
              </div>
              <div className="form-field">
                <Label htmlFor="offer-bonus">Sign-on Bonus</Label>
                <Input
                  id="offer-bonus"
                  type="number"
                  min="0"
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                />
              </div>
              <div className="offer-dates">
                <div className="form-field">
                  <Label htmlFor="offer-start">Joining Date</Label>
                  <Input
                    id="offer-start"
                    type="date"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    required
                  />
                </div>
                <div className="form-field">
                  <Label htmlFor="offer-expiry">Offer Expiry</Label>
                  <Input
                    id="offer-expiry"
                    type="date"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-field">
                <Label htmlFor="offer-benefits">Key Benefits</Label>
                <Textarea
                  id="offer-benefits"
                  value={benefits}
                  onChange={(e) => setBenefits(e.target.value)}
                />
              </div>
              <Button type="submit">
                <Send />
                Send Offer to Candidate
              </Button>
            </form>
            <p className="demo-note">
              Prototype preview only. No offer is delivered.
            </p>
          </div>
          {/* Group related content and controls in this screen section. */}
          <section className="offer-preview">
            {/* Page or panel heading and contextual actions. */}
            <header>
              <span>Document Preview</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setStep(2);
                  window.print();
                }}
              >
                <Download />
                Generate PDF
              </Button>
            </header>
            <article className="offer-paper">
              <div className="offer-letterhead">
                <div>
                  <h2>Trikshati Poly Packs</h2>
                  <p>
                    123 Industrial Parkway
                    <br />
                    Innovation District, CA 90210
                    <br />
                    hr@trikshati.com
                  </p>
                </div>
                <p>
                  Date: August 1, 2024
                  <br />
                  Ref: TPP-2024-OFF-442
                </p>
              </div>
              <p>Dear {candidate?.name ?? "Eleanor Shellstrop"},</p>
              <p>
                We are thrilled to offer you the position of{" "}
                <strong>{position}</strong> at Trikshati Poly Packs. We were
                incredibly impressed with your background and are confident that
                your skills will be a valuable addition to our team.
              </p>
              <h3>Compensation</h3>
              <p>
                Your starting base salary will be {money(salary)} per year, paid
                in accordance with the Company's standard payroll schedule.
                Additionally, you will receive a one-time sign-on bonus of{" "}
                {money(bonus)}, payable upon successful completion of your first
                90 days of employment.
              </p>
              <h3>Benefits</h3>
              <p>
                As a full-time employee, you will be eligible for the following
                benefits:
              </p>
              <ul>
                {benefits
                  .split("\n")
                  .filter(Boolean)
                  .map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
              </ul>
              <h3>Terms & Acceptance</h3>
              <p>
                Your anticipated start date is {date(start)}. Please review the
                attached standard terms of employment.
              </p>
              <p>
                This offer will expire on {date(expiry)}. Please sign below to
                indicate your acceptance of this offer.
              </p>
              <div className="offer-signature">
                Authorized signature<span>Candidate acceptance</span>
              </div>
            </article>
          </section>
        </div>
      </div>
    </div>
  );
}
