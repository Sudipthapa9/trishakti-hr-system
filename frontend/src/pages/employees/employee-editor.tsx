import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hrRequest } from "@/data/hr-api";
import type { EmployeeRecord } from "@/data/employees-api";
const labels = {
  fullName: "Full name",
  email: "Email",
  phone: "Phone",
  position: "Position",
  department: "Department",
  location: "Location",
  emergencyName: "Emergency contact name",
  emergencyRelationship: "Relationship",
  emergencyPhone: "Emergency contact phone",
};
type Change = {
  id: string;
  changedBy: string;
  changedAt: string;
  previousValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
};
export function EmployeeEditor({
  employee,
  onSaved,
}: {
  employee: EmployeeRecord;
  onSaved: (employee: EmployeeRecord) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<Change[]>([]);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const busy = useRef(false);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    const form = new FormData(event.currentTarget);
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      const result = await hrRequest("employees/" + employee.id, {
        method: "PATCH",
        body: JSON.stringify({
          ...Object.fromEntries(
            Object.keys(labels).map((key) => [key, form.get(key)]),
          ),
          expectedVersion: employee.version,
        }),
      });
      onSaved(result.employee);
      setEditing(false);
      setShowHistory(false);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not save employee.",
      );
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  async function loadHistory(nextPage: number) {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      const result = await hrRequest(
        `employees/${employee.id}/history?page=${nextPage}`,
      );
      setHistory(result.changes);
      setMore(result.hasMore);
      setPage(nextPage);
      setShowHistory(true);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not load history.",
      );
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  return (
    <section className="rounded-lg border bg-white p-5">
      <h2>Manage employee details</h2>
      <div className="flex gap-3">
        <Button
          disabled={saving}
          variant="outline"
          onClick={() => setEditing((v) => !v)}
        >
          {editing ? "Cancel edit" : "Edit record"}
        </Button>
        <Button
          disabled={saving}
          variant="outline"
          onClick={() => void loadHistory(1)}
        >
          View edit history
        </Button>
      </div>
      {error && <p role="alert">{error}</p>}
      {editing && (
        <form onSubmit={save}>
          <fieldset disabled={saving} className="mt-4 grid gap-3">
            {(Object.keys(labels) as (keyof typeof labels)[]).map((key) => (
              <label key={key}>
                {labels[key]}
                <Input
                  name={key}
                  type={key === "email" ? "email" : "text"}
                  defaultValue={employee[key]}
                  required={!key.startsWith("emergency")}
                  maxLength={
                    key === "email"
                      ? 254
                      : key === "phone" || key === "emergencyPhone"
                        ? 50
                        : key === "department" ||
                            key === "emergencyRelationship"
                          ? 100
                          : 200
                  }
                />
              </label>
            ))}
            <p>
              Fill all emergency contact fields or leave them all empty. Edits
              are recorded in history.
            </p>
            <Button type="submit">
              {saving ? "Saving…" : "Save employee"}
            </Button>
          </fieldset>
        </form>
      )}
      {showHistory && (
        <div className="mt-4 grid gap-3">
          {!history.length && <p>No employee edits yet.</p>}
          {history.map((change) => (
            <article key={change.id}>
              <h3>
                {new Date(change.changedAt).toLocaleString()} ·{" "}
                {change.changedBy}
              </h3>
              {(Object.keys(labels) as (keyof typeof labels)[])
                .filter(
                  (key) => change.previousValues[key] !== change.newValues[key],
                )
                .map((key) => (
                  <p key={key}>
                    {labels[key]}: {String(change.previousValues[key] || "—")} →{" "}
                    {String(change.newValues[key] || "—")}
                  </p>
                ))}
            </article>
          ))}
          <div className="flex gap-3">
            <Button
              disabled={saving || page === 1}
              onClick={() => void loadHistory(page - 1)}
            >
              Previous
            </Button>
            <Button
              disabled={saving || !more}
              onClick={() => void loadHistory(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
