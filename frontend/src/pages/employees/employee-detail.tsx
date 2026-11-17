import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  Pencil,
  UserRound,
  HeartPulse,
  History,
  RotateCcw,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailList } from "@/components/shared/data-display/detail-list";
import type { EmployeeRecord } from "@/data/employees-api";
import { OnboardingDocuments } from "@/pages/onboarding/onboarding-documents";
import { EmployeeEditor } from "./employee-editor";

const dates = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
export function EmployeeDetail({
  employee,
  onSaved,
  onReload,
}: {
  employee: EmployeeRecord;
  onSaved: (record: EmployeeRecord) => void;
  onReload: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const initials = employee.fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <>
      <Link className="employee-back-link" to="/employees">
        <ArrowLeft aria-hidden="true" /> All employee records
      </Link>
      <header className="employee-heading">
        <div>
          <p>Employee Record</p>
          <h1>{employee.fullName}</h1>
        </div>
        <div className="employee-heading-actions">
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={onReload}
          >
            <RotateCcw aria-hidden="true" /> Reload
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={busy || editing}
            onClick={() => window.print()}
          >
            <Download aria-hidden="true" /> Export Profile
          </Button>
          <Button
            size="sm"
            disabled={busy}
            aria-expanded={editing}
            aria-controls="employee-editor-panel"
            onClick={() => setEditing((current) => !current)}
          >
            <Pencil aria-hidden="true" />
            {editing ? "Cancel Edit" : "Edit Record"}
          </Button>
        </div>
      </header>
      <div className="employee-layout">
        <aside className="employee-profile" aria-label="Employee summary">
          <Avatar className="employee-profile-avatar">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <h2>{employee.fullName}</h2>
          <p>{employee.position}</p>
          <Badge variant="success">Employee Record</Badge>
          <DetailList
            items={[
              ["Employee ID", employee.id],
              ["Department", employee.department],
              ["Location", employee.location],
              [
                "Joining Date",
                dates.format(new Date(employee.joiningDate + "T00:00:00Z")),
              ],
            ]}
          />
        </aside>
        <div className="employee-details">
          <section className="employee-personal">
            <h2>
              <UserRound aria-hidden="true" /> Personal Details
            </h2>
            <DetailList
              className="employee-fields"
              items={[
                ["Full Name", employee.fullName],
                ["Position", employee.position],
                [
                  "Email Address (Work)",
                  <a key="email" href={"mailto:" + employee.email}>
                    {employee.email}
                  </a>,
                ],
                ["Phone Number", employee.phone],
              ]}
            />
            <div className="employee-emergency">
              <h2>
                <HeartPulse aria-hidden="true" /> Emergency Contact
              </h2>
              <DetailList
                className="employee-fields emergency-fields"
                items={[
                  ["Name", employee.emergencyName],
                  ["Relationship", employee.emergencyRelationship],
                  ["Phone", employee.emergencyPhone],
                ]}
              />
            </div>
          </section>
          <div className="employee-bottom">
            <OnboardingDocuments
              onboardingId={employee.onboardingId}
              title="Documents"
            />
            <section className="employee-journey">
              <h2>
                <History aria-hidden="true" /> Recruitment Journey
              </h2>
              <p>
                View the source candidate profile and completed onboarding
                linked to this employee record.
              </p>
              <Button asChild size="sm">
                <Link to={"/candidates/" + employee.candidateId}>
                  Source Candidate Profile <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Link
                className="employee-onboarding-link"
                to={"/onboarding/" + employee.onboardingId}
              >
                View Completed Onboarding
              </Link>
            </section>
          </div>
          <p className="employee-created-note">
            Created from the accepted offer and application on{" "}
            {new Date(employee.createdAt).toLocaleString("en-GB", {
              timeZone: "Asia/Kathmandu",
            })}{" "}
            (Nepal). The joining date is recorded separately.
          </p>
        </div>
      </div>
      <EmployeeEditor
        key={employee.version}
        employee={employee}
        editing={editing}
        onEditingChange={setEditing}
        onBusyChange={setBusy}
        onSaved={(record) => {
          setEditing(false);
          onSaved(record);
        }}
      />
    </>
  );
}
