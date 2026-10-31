/**
 * Displays and locally edits a fictional employee profile, with a browser-generated text export.
 */
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  Download,
  FileText,
  History,
  Pencil,
  UserRound,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import "./employee-record-page.css";
// Provide the fixed prototype records or display configuration consumed by this module.
const initial = {
  name: "Eleanor Shellstrop",
  birth: "May 14, 1990",
  email: "eleanor.s@trikshati.com",
  phone: "+1 (555) 019-2834",
  contact: "Chidi Anagonye",
  relationship: "Spouse",
  contactPhone: "+1 (555) 837-9921",
};
// Displays and locally edits a fictional employee profile, with a browser-generated text export.
export function EmployeeRecordPage() {
  // Keep employee in component state; updates trigger a render.
  const [employee, setEmployee] = useState(initial);
  // Keep draft in component state; updates trigger a render.
  const [draft, setDraft] = useState(initial);
  // Keep editing in component state; updates trigger a render.
  const [editing, setEditing] = useState(false);
  // Keep notice in component state; updates trigger a render.
  const [notice, setNotice] = useState("");
  const field = (key: keyof typeof initial, label: string) => (
    <div>
      <label htmlFor={"employee-" + key}>{label}</label>
      {editing ? (
        <Input
          id={"employee-" + key}
          value={draft[key]}
          onChange={(e) => setDraft((v) => ({ ...v, [key]: e.target.value }))}
        />
      ) : (
        <p>{employee[key]}</p>
      )}
    </div>
  );
  return (
    <div className="page-employees-employee-record-page">
      <div className="page-stack">
        {/* Page or panel heading and contextual actions. */}
        <header className="employee-heading">
          <div>
            <small>Employee Record</small>
            <h1>{employee.name}</h1>
          </div>
          <div>
            <Button
              variant="outline"
              onClick={() => {
                const text = Object.entries(employee)
                  .map(([k, v]) => k + ": " + v)
                  .join("\n");
                const url = URL.createObjectURL(
                  new Blob([text], { type: "text/plain" }),
                );
                const a = document.createElement("a");
                a.href = url;
                a.download = "employee-profile.txt";
                a.click();
                URL.revokeObjectURL(url);
                setNotice("Local profile exported.");
              }}
            >
              <Download />
              Export Profile
            </Button>
            <Button
              onClick={() => {
                if (editing) {
                  setDraft(employee);
                  setEditing(false);
                } else setEditing(true);
              }}
            >
              <Pencil />
              {editing ? "Cancel Edit" : "Edit Record"}
            </Button>
          </div>
        </header>
        {notice ? (
          <p role="status" className="prototype-feedback">
            {notice}
          </p>
        ) : null}
        <div className="employee-layout">
          {/* Supporting profile, navigation, or filter content beside the main panel. */}
          <aside className="employee-profile">
            <img src="/design/profile-24-2.png" alt="" />
            <h2>{employee.name}</h2>
            <p>Senior Product Designer</p>
            <Badge variant="success">• Active</Badge>
            <dl>
              {[
                ["Employee ID", "TPP-2024-089"],
                ["Department", "Product"],
                ["Reporting Manager", "Sarah Connor"],
                ["Joining Date", "Oct 12, 2024"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </aside>
          <div className="employee-details">
            {/* Group related content and controls in this screen section. */}
            <section className="employee-personal">
              <h2>
                <UserRound size={20} />
                Personal Details
              </h2>
              <div className="employee-fields">
                {field("name", "Full Name")}
                {field("birth", "Date of Birth")}
                {field("email", "Email Address (Work)")}
                {field("phone", "Phone Number")}
              </div>
              <h2>
                <Users size={20} />
                Emergency Contact
              </h2>
              <div className="employee-fields emergency-fields">
                {field("contact", "Name")}
                {field("relationship", "Relationship")}
                {field("contactPhone", "Phone")}
              </div>
              {editing ? (
                <Button
                  onClick={() => {
                    setEmployee(draft);
                    setEditing(false);
                    setNotice(
                      "Employee details saved locally. No API update was sent.",
                    );
                  }}
                >
                  Save Changes
                </Button>
              ) : null}
            </section>
            <div className="employee-bottom">
              {/* Group related content and controls in this screen section. */}
              <section className="employee-documents">
                <h2>
                  <FileText size={20} />
                  Documents
                </h2>
                {[
                  "Signed Offer Letter",
                  "Government ID (Passport)",
                  "Employment Contract",
                ].map((name) => (
                  <button
                    key={name}
                    onClick={() =>
                      setNotice(
                        name + " preview is not connected in this prototype.",
                      )
                    }
                  >
                    <FileText size={18} />
                    <span>{name}</span>
                    <Download size={15} />
                  </button>
                ))}
              </section>
              {/* Group related content and controls in this screen section. */}
              <section className="employee-journey">
                <h2>
                  <History size={20} />
                  Recruitment Journey
                </h2>
                <p>
                  View the screening, interview notes, and AI match scores that
                  led to this hire.
                </p>
                <Button asChild size="sm" variant="outline">
                  <Link to="/screening/eleanor-shellstrop">
                    Source Candidate Profile
                    <ArrowRight />
                  </Link>
                </Button>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
