import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// Leave File objects and upload ownership with the feature; do not set a value.
export function FileUploadField({
  className,
  ...props
}: Omit<ComponentProps<"input">, "type">) {
  return (
    <input
      {...props}
      type="file"
      data-slot="file-upload"
      className={cn(
        "max-w-full rounded-md border border-input bg-background p-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1 file:font-medium disabled:opacity-50",
        className,
      )}
    />
  );
}
