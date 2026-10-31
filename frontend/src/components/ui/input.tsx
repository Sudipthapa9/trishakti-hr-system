/**
 * Wraps a native input with shared styling and focus, disabled, and aria-invalid visual states.
 */
import * as React from "react";
import { cn } from "@/lib/utils";

// Render the input region while forwarding supported props and caller styling.
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-[var(--radius-md)] border border-input bg-[var(--color-control-bg)] px-3 py-3 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-[var(--color-control-disabled-bg)] disabled:text-muted-foreground aria-invalid:border-destructive aria-invalid:bg-[var(--color-status-danger-bg)] aria-invalid:focus-visible:ring-destructive md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
