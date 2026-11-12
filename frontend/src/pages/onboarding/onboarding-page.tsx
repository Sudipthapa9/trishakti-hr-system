import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { completeOnboarding, getOnboarding, listOnboarding, saveChecklist, type OnboardingRecord } from "@/data/onboarding-api";
import "./onboarding-page.css";
import { OnboardingDocuments } from "./onboarding-documents";
const labels = { documents: "Documents verified", payroll: "Bank and payroll setup", accounts: "Work accounts prepared", orientation: "Orientation completed" };
export function OnboardingPage() {
  const { onboardingId } = useParams();
  return <OnboardingContent key={onboardingId || "list"} id={onboardingId} />;
}
function OnboardingContent({ id }: { id?: string }) {
  const navigate = useNavigate();
  const [records, setRecords] = useState<OnboardingRecord[]>([]);
  const [record, setRecord] = useState<OnboardingRecord | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const busy = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError("");
      try {
        if (id) { const result = await getOnboarding(id, controller.signal); if (!controller.signal.aborted) setRecord(result.record); }
        else { const result = await listOnboarding(page, controller.signal); if (!controller.signal.aborted) { setRecords(result.records); setHasMore(result.hasMore); } }
      } catch (error) { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Could not load onboarding."); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load(); return () => controller.abort();
  }, [id, page]);
  async function toggle(key: keyof typeof labels) {
    if (!record || busy.current || uncertain || record.completedAt) return;
    busy.current = true; setSaving(true); setError("");
    try { const result = await saveChecklist(record, { ...record.checklist, [key]: !record.checklist[key] }); setRecord(result.record); }
    catch (error) { setError(error instanceof Error ? error.message : "Could not save checklist."); setUncertain(true); }
    finally { busy.current = false; setSaving(false); }
  }
  const completed = record ? Object.values(record.checklist).filter(Boolean).length : 0;
  async function finish() {
    if (!record || busy.current || uncertain || completed !== 4) return;
    busy.current = true; setSaving(true); setError("");
    try {
      const result = await completeOnboarding(record);
      navigate("/employees/" + result.employeeId);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not complete onboarding.");
      setUncertain(true);
    } finally { busy.current = false; setSaving(false); }
  }
  return <div className="page-onboarding-onboarding-page"><div className="page-stack">
    <h1>{record ? "Onboarding: " + record.candidateName : "Onboarding"}</h1>
    {loading && <p role="status">Loading onboarding…</p>}
    {error && <p role="alert">{error}</p>}
    <Button variant="outline" onClick={() => window.location.reload()}>Reload saved records</Button>
    {!loading && !id && !error && <>
      {!records.length && <p>No onboarding records yet. Start from an accepted offer.</p>}
      {records.map((item) => <section className="rounded-lg border bg-white p-4" key={item.id}><Link to={"/onboarding/" + item.id}>{item.candidateName} · {item.position}</Link><p>Joining: {item.joiningDate}</p></section>)}
      <div className="flex gap-3"><Button disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button><span>Page {page}</span><Button disabled={!hasMore} onClick={() => setPage(page + 1)}>Next</Button></div>
    </>}
    {!loading && record && <>
      <Link to="/onboarding">All onboarding records</Link>
      <section className="rounded-lg border bg-white p-5"><h2>{record.position}</h2><p>{record.email}</p><p>{record.department} · {record.location} · Joining {record.joiningDate}</p><Link to={"/offers/" + record.offerId}>View accepted offer</Link></section>
      <OnboardingDocuments onboardingId={record.id} />
      <section className="rounded-lg border bg-white p-5"><h2>Required actions ({completed}/4)</h2><p>HR records completion after verifying each action.</p>
        <fieldset disabled={saving || uncertain || Boolean(record.completedAt)} className="grid gap-4" aria-busy={saving}>{(Object.keys(labels) as (keyof typeof labels)[]).map((key) => <label key={key} className="flex gap-3"><input type="checkbox" checked={record.checklist[key]} onChange={() => void toggle(key)} />{labels[key]}</label>)}</fieldset>
        {saving && <p role="status">Saving checklist…</p>}
        {uncertain && <p>Reload the saved record before making more changes.</p>}
      </section>
      {record.completedAt && record.employeeId ? <section><p>Completed on {new Date(record.completedAt).toLocaleString()} by {record.completedBy}.</p><Button asChild><Link to={"/employees/" + record.employeeId}>View employee record</Link></Button></section> : <section><p>Completion locks this checklist, creates the employee record and marks this application Hired.</p><Button disabled={saving || uncertain || completed !== 4} onClick={() => void finish()}>{saving ? "Saving…" : "Complete onboarding & create employee"}</Button></section>}
    </>}
  </div></div>;
}
