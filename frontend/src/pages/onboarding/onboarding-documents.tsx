import "./onboarding-documents.css";
import { Upload, Plus } from "lucide-react";
import { FeedbackMessage } from "@/components/shared/feedback/feedback-message";
import { FileUploadField } from "@/components/shared/forms/file-upload-field";
import { DocumentRow } from "@/components/shared/data-display/document-row";
import { PaginationControls } from "@/components/shared/navigation/pagination-controls";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { hrRequest } from "@/data/hr-api";
type Document = { id: string; name: string; size: number; createdAt: string };
export function OnboardingDocuments({
  onboardingId,
  title = "Additional Documentation",
}: {
  onboardingId: string;
  title?: string;
}) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [page, setPage] = useState(1);
  const [showUpload, setShowUpload] = useState(false);
  const [more, setMore] = useState(false);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  const uploadId = useRef(crypto.randomUUID());
  const base = `onboarding/${onboardingId}/documents`;
  useEffect(() => {
    const controller = new AbortController();
    void hrRequest(base + "?page=" + page, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) {
          setDocuments(result.documents);
          setMore(result.hasMore);
          setError("");
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [base, page, revision]);
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("document");
    if (!(file instanceof File) || !file.size || file.size > 10 * 1024 * 1024) {
      setError("Choose a PDF or DOCX up to 10MB.");
      return;
    }
    data.set("id", uploadId.current);
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      await hrRequest(base, { method: "POST", body: data });
      uploadId.current = crypto.randomUUID();
      form.reset();
      setLoading(true);
      setRevision((v) => v + 1);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not upload document.",
      );
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  async function download(document: Document) {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      const blob = (await hrRequest(
        base + "/" + document.id,
        {},
        true,
      )) as Blob;
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = document.name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not download document.",
      );
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  return (
    <section className="onboarding-documents">
      <header>
        <h2>{title}</h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={saving}
          aria-expanded={showUpload}
          aria-controls="onboarding-document-upload"
          onClick={() => setShowUpload((current) => !current)}
        >
          <Upload aria-hidden="true" /> Upload File
        </Button>
      </header>
      <div className="onboarding-documents-content">
        <p>
          PDF or DOCX, up to 10MB per file. Uploading does not automatically
          mark documents verified.
        </p>
        {error && <FeedbackMessage role="alert">{error}</FeedbackMessage>}
        <form
          id="onboarding-document-upload"
          hidden={!showUpload}
          onSubmit={upload}
          className="onboarding-document-upload"
        >
          <FileUploadField
            aria-label="Onboarding document"
            name="document"
            accept=".pdf,.docx"
            required
            disabled={saving}
            onChange={() => {
              uploadId.current = crypto.randomUUID();
            }}
          />
          <Button type="submit" disabled={saving}>
            {saving ? "Working…" : "Upload document"}
          </Button>
        </form>
        {loading ? (
          <FeedbackMessage role="status">Loading documents…</FeedbackMessage>
        ) : !documents.length ? (
          <div className="onboarding-document-empty">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => setShowUpload(true)}
            >
              <Plus aria-hidden="true" /> Add Document
            </Button>
            <p>No documents uploaded yet.</p>
          </div>
        ) : (
          <div className="onboarding-document-grid">
            {documents.map((document) => (
              <DocumentRow
                key={document.id}
                name={document.name}
                metadata={Math.ceil(document.size / 1024) + " KB"}
                action={
                  <Button
                    variant="outline"
                    disabled={saving}
                    onClick={() => void download(document)}
                  >
                    Download
                  </Button>
                }
              />
            ))}
          </div>
        )}
        <div className="onboarding-document-pagination">
          <PaginationControls
            previousDisabled={loading || saving || page === 1}
            onPrevious={() => {
              setLoading(true);
              setPage((p) => p - 1);
            }}
            nextDisabled={loading || saving || !more}
            onNext={() => {
              setLoading(true);
              setPage((p) => p + 1);
            }}
          />
          <Button
            variant="outline"
            disabled={loading || saving}
            onClick={() => {
              setLoading(true);
              setRevision((v) => v + 1);
            }}
          >
            Reload documents
          </Button>
        </div>
      </div>
    </section>
  );
}
