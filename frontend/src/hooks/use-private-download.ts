import { useCallback, useEffect, useRef, useState } from "react";
import { downloadFile, type DownloadedFile } from "@/lib/download";

export function usePrivateDownload() {
  const controller = useRef<AbortController | null>(null);
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(
    () => () => {
      controller.current?.abort();
      controller.current = null;
    },
    [],
  );
  const clearError = useCallback(() => setError(null), []);
  async function download(
    id: string,
    request: (signal: AbortSignal) => Promise<DownloadedFile>,
  ) {
    if (controller.current) return;
    const current = new AbortController();
    controller.current = current;
    setDownloadId(id);
    setError(null);
    try {
      await downloadFile(request, current.signal);
    } catch (error) {
      if (!current.signal.aborted)
        setError(
          error instanceof Error
            ? error.message
            : "Could not download the file.",
        );
    } finally {
      if (controller.current === current) {
        controller.current = null;
        if (!current.signal.aborted) setDownloadId(null);
      }
    }
  }
  return { downloadId, error, download, clearError };
}
