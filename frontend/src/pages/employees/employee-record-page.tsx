import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getEmployee, listEmployees, type EmployeeRecord } from "@/data/employees-api";
import "./employee-record-page.css";

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
      setLoading(true); setError("");
      try {
        if (id) {
          const result = await getEmployee(id, controller.signal);
          if (!controller.signal.aborted) setEmployee(result.employee);
        } else {
          const result = await listEmployees(page, controller.signal);
          if (!controller.signal.aborted) { setEmployees(result.employees); setHasMore(result.hasMore); }
        }
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Could not load employees.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load(); return () => controller.abort();
  }, [id, page]);
  return <div className="page-employees-employee-record-page"><div className="page-stack">
    <h1>{employee ? employee.fullName : "Employee records"}</h1>
    {loading && <p role="status">Loading employee records…</p>}
    {error && <p role="alert">{error}</p>}
    <Button variant="outline" onClick={() => window.location.reload()}>Reload saved records</Button>
    {!id && !loading && !error && <>
      {!employees.length && <p>No employee records yet. Complete an onboarding checklist to create one.</p>}
      {employees.map(record => <section className="rounded-lg border bg-white p-4" key={record.id}><Link to={"/employees/" + record.id}>{record.fullName} · {record.position}</Link><p>Joining: {record.joiningDate}</p></section>)}
      <div className="flex gap-3"><Button disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button><span>Page {page}</span><Button disabled={!hasMore} onClick={() => setPage(page + 1)}>Next</Button></div>
    </>}
    {employee && !loading && <>
      <Link to="/employees">All employee records</Link>
      <section className="employee-personal"><h2>Employment details</h2><dl className="grid gap-3">
        {[["Employee ID", employee.id], ["Position", employee.position], ["Department", employee.department], ["Location", employee.location], ["Joining date", employee.joiningDate], ["Email", employee.email], ["Phone", employee.phone]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl></section>
      <p>Created from the accepted offer and submitted application on {new Date(employee.createdAt).toLocaleString()}. Joining date is recorded separately from onboarding completion.</p>
      <div className="flex gap-4"><Link to={"/onboarding/" + employee.onboardingId}>Completed onboarding</Link><Link to={"/candidates/" + employee.candidateId}>Source candidate</Link></div>
    </>}
  </div></div>;
}
