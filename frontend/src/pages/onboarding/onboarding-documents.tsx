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
    <section className="rounded-lg border bg-white p-5">
      <h2>Private onboarding documents</h2>
      <p>
        PDF or DOCX, up to 10MB per file. Uploading does not automatically mark
        documents verified.
      </p>
      {error && <p role="alert">{error}</p>}
      <form onSubmit={upload} className="my-4 flex flex-wrap gap-3">
        <input
          aria-label="Onboarding document"
          type="file"
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
        <p role="status">Loading documents…</p>
      ) : !documents.length ? (
        <p>No documents uploaded.</p>
      ) : (
        documents.map((document) => (
          <div
            key={document.id}
            className="flex justify-between gap-3 border-b py-3"
          >
            <span>
              {document.name} · {Math.ceil(document.size / 1024)} KB
            </span>
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => void download(document)}
            >
              Download
            </Button>
          </div>
        ))
      )}
      <div className="mt-3 flex gap-3">
        <Button
          disabled={loading || page === 1}
          onClick={() => {
            setLoading(true);
            setPage((p) => p - 1);
          }}
        >
          Previous
        </Button>
        <Button
          disabled={loading || !more}
          onClick={() => {
            setLoading(true);
            setPage((p) => p + 1);
          }}
        >
          Next
        </Button>
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
  );
}
