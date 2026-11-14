import type { ComponentProps } from "react";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

export function FilterToolbar({
  asChild = false,
  className,
  ...props
}: ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "div";
  return (
    <Comp
      data-slot="filter-toolbar"
      className={cn("flex flex-wrap items-center gap-3", className)}
      {...props}
    />
  );
}
