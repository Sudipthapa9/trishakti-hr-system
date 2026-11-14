import { Card } from "@/components/ui/card";
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
}: {
  onboardingId: string;
}) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [page, setPage] = useState(1);
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
    <Card asChild className="gap-4 py-0 ring-0">
      <section className="rounded-lg border bg-white p-5">
        <h2>Private onboarding documents</h2>
        <p>
          PDF or DOCX, up to 10MB per file. Uploading does not automatically
          mark documents verified.
        </p>
        {error && <FeedbackMessage role="alert">{error}</FeedbackMessage>}
        <form onSubmit={upload} className="my-4 flex flex-wrap gap-3">
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
          <p>No documents uploaded.</p>
        ) : (
          documents.map((document) => (
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
          ))
        )}
        <div className="mt-3 flex gap-3">
          <PaginationControls
            previousDisabled={loading || page === 1}
            onPrevious={() => {
              setLoading(true);
              setPage((p) => p - 1);
            }}
            nextDisabled={loading || !more}
            onNext={() => {
              setLoading(true);
              setPage((p) => p + 1);
            }}
          />
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => {
              setLoading(true);
              setRevision((v) => v + 1);
            }}
          >
            Reload documents
          </Button>
        </div>
      </section>
    </Card>
  );
}
