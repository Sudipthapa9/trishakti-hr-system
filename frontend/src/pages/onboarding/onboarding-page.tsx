import { PageHeader } from "@/components/Layout/page-header";
import { RotateCcw } from "lucide-react";
import { OnboardingDetail } from "./onboarding-detail";
import { OnboardingTable } from "./onboarding-table";
import { FeedbackMessage } from "@/components/shared/feedback/feedback-message";
import { PaginationControls } from "@/components/shared/navigation/pagination-controls";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  completeOnboarding,
  getOnboarding,
  listOnboarding,
  saveChecklist,
  type OnboardingRecord,
  type Checklist,
} from "@/data/onboarding-api";
import "./onboarding-page.css";
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
      setLoading(true);
      setError("");
      try {
        if (id) {
          const result = await getOnboarding(id, controller.signal);
          if (!controller.signal.aborted) setRecord(result.record);
        } else {
          const result = await listOnboarding(page, controller.signal);
          if (!controller.signal.aborted) {
            setRecords(result.records);
            setHasMore(result.hasMore);
          }
        }
      } catch (error) {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error
              ? error.message
              : "Could not load onboarding.",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [id, page]);
  async function toggle(key: keyof Checklist) {
    if (!record || busy.current || uncertain || record.completedAt) return;
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      const result = await saveChecklist(record, {
        ...record.checklist,
        [key]: !record.checklist[key],
      });
      setRecord(result.record);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not save checklist.",
      );
      setUncertain(true);
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  const completed = record
    ? Object.values(record.checklist).filter(Boolean).length
    : 0;
  async function finish() {
    if (!record || busy.current || uncertain || completed !== 4) return;
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      const result = await completeOnboarding(record);
      navigate("/employees/" + result.employeeId);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not complete onboarding.",
      );
      setUncertain(true);
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  return (
    <div className="page-onboarding-onboarding-page">
      <div className="page-stack">
        {!id && (
          <PageHeader
            className="onboarding-list-heading"
            title="Onboarding"
            description="Track candidate onboarding, verified actions and joining dates."
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
          <FeedbackMessage role="status">Loading onboarding…</FeedbackMessage>
        )}
        {error && <FeedbackMessage role="alert">{error}</FeedbackMessage>}
        {!loading && !id && !error && (
          <>
            {!records.length && (
              <div className="onboarding-list-empty">
                <h2>
                  {page > 1
                    ? "No records on this page"
                    : "No onboarding records yet"}
                </h2>
                <p>
                  Start onboarding from an accepted offer to see candidates
                  here.
                </p>
                {page > 1 ? (
                  <Button variant="outline" onClick={() => setPage(page - 1)}>
                    Previous page
                  </Button>
                ) : (
                  <Button asChild variant="outline">
                    <Link to="/offers/new">Go to Offers</Link>
                  </Button>
                )}
              </div>
            )}
            {records.length > 0 && (
              <section className="onboarding-list-panel">
                <header className="onboarding-list-panel-heading">
                  <h2>Candidate Onboarding</h2>
                  <p>Progress reflects the four saved HR confirmations.</p>
                </header>
                <OnboardingTable records={records} />
                <footer className="onboarding-list-footer">
                  <p>
                    Showing {(page - 1) * 20 + 1} to{" "}
                    {(page - 1) * 20 + records.length}
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
        {!loading && record && (
          <OnboardingDetail
            record={record}
            saving={saving}
            uncertain={uncertain}
            onToggle={(key) => void toggle(key)}
            onFinish={() => void finish()}
            onReload={() => window.location.reload()}
          />
        )}
      </div>
    </div>
  );
}
