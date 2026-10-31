/**
 * Provides a visual placeholder while real content is loading; it does not fetch data.
 */
import { cn } from "@/lib/utils";

// Render the skeleton region while forwarding supported props and caller styling.
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
