import type { ComponentProps } from "react";
import { Badge } from "@/components/ui/badge";

type Tone = ComponentProps<typeof Badge>["variant"];
type StatusDomain = "application" | "job";
const tones: Record<StatusDomain, Record<string, Tone>> = {
  application: {
    Review: "neutral",
    Screening: "secondary",
    Shortlisted: "success",
    Interview: "warning",
    Offer: "success",
    Hired: "success",
    Rejected: "danger",
    Withdrawn: "neutral",
  },
  job: { Open: "success", Draft: "warning", Archived: "neutral" },
};

// Unknown domain statuses retain their exact text and a neutral appearance.
export function StatusBadge({
  domain,
  status,
  children,
  ...props
}: Omit<ComponentProps<typeof Badge>, "variant"> & {
  domain: StatusDomain;
  status: string;
}) {
  return (
    <Badge variant={tones[domain]?.[status] ?? "neutral"} {...props}>
      {children ?? status}
    </Badge>
  );
}
