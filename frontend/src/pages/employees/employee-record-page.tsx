import { ProfileSummary } from "@/components/HR/profile-summary";
import { DetailList } from "@/components/HR/detail-list";
import { Card } from "@/components/ui/card";
import { FeedbackMessage } from "@/components/HR/feedback-message";
import { PaginationControls } from "@/components/HR/pagination-controls";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  getEmployee,
  listEmployees,
  type EmployeeRecord,
} from "@/data/employees-api";
import "./employee-record-page.css";
import { EmployeeEditor } from "./employee-editor";
import { OnboardingDocuments } from "@/pages/onboarding/onboarding-documents";

export function EmployeeRecordPage() {
  const { employeeId } = useParams();
  return <EmployeeContent key={employeeId || "list"} id={employeeId} />;
}
function EmployeeContent({ id }: { id?: string }) {
  const [employee, setEmployee] = useState<EmployeeRecord | null>(null);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        if (id) {
          const result = await getEmployee(id, controller.signal);
          if (!controller.signal.aborted) setEmployee(result.employee);
        } else {
          const result = await listEmployees(page, controller.signal);
          if (!controller.signal.aborted) {
            setEmployees(result.employees);
            setHasMore(result.hasMore);
          }
        }
      } catch (error) {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error
              ? error.message
              : "Could not load employees.",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [id, page]);
  return (
    <div className="page-employees-employee-record-page">
      <div className="page-stack">
        <h1>{employee ? employee.fullName : "Employee records"}</h1>
        {loading && (
          <FeedbackMessage role="status">
            Loading employee records…
          </FeedbackMessage>
        )}
        {error && <FeedbackMessage role="alert">{error}</FeedbackMessage>}
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reload saved records
        </Button>
        {!id && !loading && !error && (
          <>
            {!employees.length && (
              <p>
                No employee records yet. Complete an onboarding checklist to
                create one.
              </p>
            )}
            {employees.map((record) => (
              <Card asChild className="gap-4 py-0 ring-0" key={record.id}>
                <section
                  className="rounded-lg border bg-white p-4"
                  key={record.id}
                >
                  <Link to={"/employees/" + record.id}>
                    <ProfileSummary
                      name={record.fullName}
                      detail={record.position}
                    />
                  </Link>
                  <p>Joining: {record.joiningDate}</p>
                </section>
              </Card>
            ))}
            <div className="flex gap-3">
              <PaginationControls
                previousDisabled={page === 1}
                nextDisabled={!hasMore}
                onPrevious={() => setPage(page - 1)}
                onNext={() => setPage(page + 1)}
              >
                <span>Page {page}</span>
              </PaginationControls>
            </div>
          </>
        )}
        {employee && !loading && (
          <>
            <Link to="/employees">All employee records</Link>
            <section className="employee-personal">
              <h2>Employment details</h2>
              <DetailList
                items={[
                  ["Employee ID", employee.id],
                  ["Position", employee.position],
                  ["Department", employee.department],
                  ["Location", employee.location],
                  ["Joining date", employee.joiningDate],
                  ["Email", employee.email],
                  ["Phone", employee.phone],
                ]}
              />
            </section>
            <EmployeeEditor
              key={employee.version}
              employee={employee}
              onSaved={setEmployee}
            />
            <OnboardingDocuments onboardingId={employee.onboardingId} />
            <p>
              Emergency contact:{" "}
              {employee.emergencyName
                ? `${employee.emergencyName} · ${employee.emergencyRelationship} · ${employee.emergencyPhone}`
                : "Not provided"}
            </p>
            <p>
              Created from the accepted offer and submitted application on{" "}
              {new Date(employee.createdAt).toLocaleString()}. Joining date is
              recorded separately from onboarding completion.
            </p>
            <div className="flex gap-4">
              <Link to={"/onboarding/" + employee.onboardingId}>
                Completed onboarding
              </Link>
              <Link to={"/candidates/" + employee.candidateId}>
                Source candidate
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
