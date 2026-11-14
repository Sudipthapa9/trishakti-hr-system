import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function DataState({
  kind,
  children,
  onRetry,
}: {
  kind: "loading" | "empty" | "error";
  children: ReactNode;
  onRetry?: () => void;
}) {
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className="grid gap-3 rounded-lg border border-dashed p-6 text-sm text-muted-foreground"
    >
      <p>{children}</p>
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          className="w-fit"
          onClick={onRetry}
        >
          Try again
        </Button>
      )}
    </div>
  );
}
