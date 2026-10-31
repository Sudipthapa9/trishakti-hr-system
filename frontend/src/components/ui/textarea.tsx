/**
 * Wraps a native multiline input with the same interaction styling as other form controls.
 */
import * as React from "react";
import { cn } from "@/lib/utils";

// Render the textarea region while forwarding supported props and caller styling.
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-[var(--radius-md)] border border-input bg-[var(--color-control-bg)] px-3 py-3 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-[var(--color-control-disabled-bg)] disabled:text-muted-foreground aria-invalid:border-destructive aria-invalid:bg-[var(--color-status-danger-bg)] aria-invalid:focus-visible:ring-destructive md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
