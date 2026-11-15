import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// Native progress exposes its numeric value to assistive technology.
export function Progress({ className, ...props }: ComponentProps<"progress">) {
  return (
    <progress
      data-slot="progress"
      className={cn(
        "h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary",
        className,
      )}
      {...props}
    />
  );
}
