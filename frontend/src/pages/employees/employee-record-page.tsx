import { PageHeader } from "@/components/Layout/page-header";
import { RotateCcw } from "lucide-react";
import { EmployeesTable } from "./employees-table";
import { FeedbackMessage } from "@/components/shared/feedback/feedback-message";
import { PaginationControls } from "@/components/shared/navigation/pagination-controls";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  getEmployee,
  listEmployees,
  type EmployeeRecord,
} from "@/data/employees-api";
import "./employee-record-page.css";
import { EmployeeDetail } from "./employee-detail";

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
        {!id && (
          <PageHeader
            className="employees-list-heading"
            title="Employees"
            description="Employee records created from completed onboarding."
            action={
              <Button
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={() => window.location.reload()}
              >
                <RotateCcw aria-hidden="true" /> Reload
              </Button>
            }
          />
        )}
        {loading && (
          <FeedbackMessage role="status">
            Loading employee records…
          </FeedbackMessage>
        )}
        {error && (
          <div className="employee-load-error">
            <FeedbackMessage role="alert">{error}</FeedbackMessage>
            {id && (
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            )}
          </div>
        )}

        {!id && !loading && !error && (
          <>
            {!employees.length && (
              <div className="employees-list-empty">
                <h2>
                  {page > 1
                    ? "No employees on this page"
                    : "No employee records yet"}
                </h2>
                <p>
                  Complete an onboarding checklist to create an employee record.
                </p>
                {page > 1 ? (
                  <Button variant="outline" onClick={() => setPage(page - 1)}>
                    Previous page
                  </Button>
                ) : (
                  <Button asChild variant="outline">
                    <Link to="/onboarding">Go to Onboarding</Link>
                  </Button>
                )}
              </div>
            )}
            {employees.length > 0 && (
              <section className="employees-list-panel">
                <header>
                  <h2>Employee Directory</h2>
                  <span>Saved employee records</span>
                </header>
                <EmployeesTable employees={employees} />
                <footer>
                  <p>
                    Showing {(page - 1) * 20 + 1} to{" "}
                    {(page - 1) * 20 + employees.length}
                  </p>
                  <PaginationControls
                    previousDisabled={page === 1}
                    nextDisabled={!hasMore}
                    onPrevious={() => setPage(page - 1)}
                    onNext={() => setPage(page + 1)}
                  >
                    <span>Page {page}</span>
                  </PaginationControls>
                </footer>
              </section>
            )}
          </>
        )}
        {employee && !loading && !error && (
          <EmployeeDetail
            employee={employee}
            onSaved={setEmployee}
            onReload={() => window.location.reload()}
          />
        )}
      </div>
    </div>
  );
}
