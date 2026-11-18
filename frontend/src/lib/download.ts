export type DownloadedFile = { blob: Blob; name: string };

// A temporary anchor belongs to this browser action, not React's rendered tree.
export function saveBlob(blob: Blob, name: string) {
  const anchor = document.createElement("a");
  const url = URL.createObjectURL(blob);
  try {
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  } finally {
    anchor.remove();
  }
  // Allow the browser to consume the URL before releasing it, even after unmount.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadFile(
  request: (signal: AbortSignal) => Promise<DownloadedFile>,
  signal: AbortSignal,
) {
  signal.throwIfAborted();
  const file = await request(signal);
  signal.throwIfAborted();
  saveBlob(file.blob, file.name);
}
