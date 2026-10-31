/**
 * Tracks local onboarding checks and document names; completion enables navigation to a prototype employee record.
 */
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Check,
  Clock3,
  Eye,
  FileText,
  Plus,
  Sparkles,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import "./onboarding-page.css";
// Provide the fixed prototype records or display configuration consumed by this module.
const initial = [
  { name: "Offer Letter", detail: "Signed Jul 15, 2024", done: true },
  {
    name: "Employment Contract",
    detail: "Countersigned Jul 16, 2024",
    done: true,
  },
  {
    name: "Government ID Verification",
    detail: "Verification completed in this demo",
    done: true,
  },
  {
    name: "Bank & Payroll Setup",
    detail: "Details submitted and routed",
    done: true,
  },
  {
    name: "HR Head Final Approval",
    detail: "Pending your review",
    done: false,
  },
];
// Tracks local onboarding checks and document names; completion enables navigation to a prototype employee record.
export function OnboardingPage() {
  // Keep items in component state; updates trigger a render.
  const [items, setItems] = useState(initial);
  // Keep notice in component state; updates trigger a render.
  const [notice, setNotice] = useState("");
  // Keep documents in component state; updates trigger a render.
  const [documents, setDocuments] = useState(["Emergency Contacts.pdf"]);
  const completed = items.filter((i) => i.done).length;
  return (
    <div className="page-onboarding-onboarding-page">
      <div className="page-stack">
        {/* Page or panel heading and contextual actions. */}
        <header className="onboarding-heading">
          <div>
            <h1>Onboarding: Eleanor Shellstrop</h1>
            <p>
              <Badge variant="success">In Progress ({completed * 20}%)</Badge>
              <CalendarDays size={13} />
              Target Completion: Jul 28, 2024
            </p>
          </div>
          <div>
            <Button
              variant="outline"
              onClick={() =>
                setNotice(
                  "Rejection review is not connected in this prototype.",
                )
              }
            >
              Reject Candidate
            </Button>
            <Button
              disabled={completed < items.length}
              asChild={completed === items.length}
            >
              {completed === items.length ? (
                <Link to="/employees/eleanor-shellstrop">
                  Approve & Create Record
                </Link>
              ) : (
                "Approve & Create Record"
              )}
            </Button>
          </div>
        </header>
        {notice ? (
          <p role="status" className="prototype-feedback">
            {notice}
          </p>
        ) : null}
        <div className="onboarding-layout">
          {/* Supporting profile, navigation, or filter content beside the main panel. */}
          <aside>
            {/* Group related content and controls in this screen section. */}
            <section className="onboarding-profile">
              <div className="onboarding-person">
                <img src="/design/profile-23-2.png" alt="" />
                <div>
                  <h2>Eleanor Shellstrop</h2>
                  <p>Senior Product Designer</p>
                </div>
              </div>
              <dl>
                {[
                  ["Department", "Product"],
                  ["Joining Date", "August 1, 2024"],
                  ["Location", "Remote (AZ)"],
                  ["Manager", "Michael Realman"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="reused-data">
                <Sparkles size={18} />
                Recruitment data has been pre-filled for this record to
                streamline onboarding.
              </p>
            </section>
            {/* Group related content and controls in this screen section. */}
            <section className="onboarding-progress">
              <h2>Onboarding Progress</h2>
              <div>
                <strong>
                  {completed}/{items.length}
                </strong>
                <dl>
                  <div>
                    <dt>Documentation</dt>
                    <dd>100%</dd>
                  </div>
                  <div>
                    <dt>Approvals</dt>
                    <dd>{items[4].done ? "100%" : "0%"}</dd>
                  </div>
                  <div>
                    <dt>IT Setup</dt>
                    <dd>Pending</dd>
                  </div>
                </dl>
              </div>
            </section>
          </aside>
          <div className="onboarding-details">
            {/* Group related content and controls in this screen section. */}
            <section className="onboarding-checklist">
              {/* Page or panel heading and contextual actions. */}
              <header>
                <h2>Required Actions Checklist</h2>
                <span>
                  {completed} of {items.length} Completed
                </span>
              </header>
              {items.map((item, i) => (
                <div className="onboarding-task" key={item.name}>
                  <span
                    className={item.done ? "task-complete" : "task-pending"}
                  >
                    {item.done ? <Check size={18} /> : <Clock3 size={18} />}
                  </span>
                  <div>
                    <strong>{item.name}</strong>
                    <p>
                      {item.done
                        ? item.detail
                        : i === 4
                          ? "Pending your review"
                          : "Awaiting review"}
                    </p>
                  </div>
                  <Button
                    size={item.done ? "icon-sm" : "sm"}
                    variant={item.done ? "ghost" : "default"}
                    aria-label={item.done ? "Review " + item.name : undefined}
                    onClick={() => {
                      setItems((v) =>
                        v.map((x, n) =>
                          i === n ? { ...x, done: !x.done } : x,
                        ),
                      );
                      setNotice("Checklist updated locally.");
                    }}
                  >
                    {item.done ? <Eye size={17} /> : "Review Now"}
                  </Button>
                </div>
              ))}
            </section>
            {/* Group related content and controls in this screen section. */}
            <section className="onboarding-documents">
              {/* Page or panel heading and contextual actions. */}
              <header>
                <h2>Additional Documentation</h2>
                <label className="upload-action">
                  <Upload size={14} />
                  Upload File
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setDocuments((v) => [...v, file.name]);
                        setNotice(
                          "File name added locally. No document was uploaded to a server.",
                        );
                      }
                    }}
                  />
                </label>
              </header>
              <div>
                {documents.map((name, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      setNotice(
                        "Document preview is not connected in this prototype.",
                      )
                    }
                  >
                    <FileText size={22} />
                    <span>
                      {name}
                      <small>Local document record</small>
                    </span>
                  </button>
                ))}
                <label className="tax-document">
                  <Plus size={21} />
                  Add Tax Forms
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setDocuments((v) => [...v, file.name]);
                    }}
                  />
                </label>
              </div>
            </section>
          </div>
        </div>
        <p className="demo-note">
          Prototype checklist and document names only. No employment record is
          stored.
        </p>
      </div>
    </div>
  );
}
