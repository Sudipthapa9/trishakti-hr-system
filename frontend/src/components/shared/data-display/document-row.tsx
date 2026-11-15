import type { ReactNode } from "react";
import { FileText } from "lucide-react";

// Download authorization, Blob URLs and busy state stay in the caller.
export function DocumentRow({
  name,
  metadata,
  action,
}: {
  name: string;
  metadata?: ReactNode;
  action: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b py-3">
      <div className="flex min-w-0 items-center gap-3">
        <FileText
          aria-hidden="true"
          className="size-5 shrink-0 text-muted-foreground"
        />
        <div className="min-w-0">
          <p className="break-words text-sm font-medium">{name}</p>
          {metadata && (
            <p className="text-xs text-muted-foreground">{metadata}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}
