import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// Preserve each caller's live-region semantics and message text.
export function FeedbackMessage({
  role = "status",
  className,
  ...props
}: ComponentProps<"p">) {
  return (
    <p
      role={role}
      data-slot="feedback"
      className={cn(
        "rounded-md border px-3 py-2 text-sm",
        role === "alert"
          ? "border-destructive/20 bg-destructive/5 text-destructive"
          : "border-border bg-muted/30 text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
