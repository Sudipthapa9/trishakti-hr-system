import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Parents retain paging, loading and hasMore rules, including independent lists.
export function PaginationControls({
  previousDisabled,
  nextDisabled,
  onPrevious,
  onNext,
  children,
  className,
  label = "Page navigation",
  previousLabel = "Previous",
  nextLabel = "Next",
}: {
  previousDisabled?: boolean;
  nextDisabled?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  children?: ReactNode;
  className?: string;
  label?: string;
  previousLabel?: string;
  nextLabel?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("flex flex-wrap items-center gap-3", className)}
    >
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={previousDisabled}
        onClick={onPrevious}
      >
        {previousLabel}
      </Button>
      {children}
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={nextDisabled}
        onClick={onNext}
      >
        {nextLabel}
      </Button>
    </div>
  );
}
