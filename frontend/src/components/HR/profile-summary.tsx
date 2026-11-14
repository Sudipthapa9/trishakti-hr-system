import type { ReactNode } from "react";
import { Person } from "@/components/HR/workflow-ui";

export function ProfileSummary({
  name,
  detail,
  children,
}: {
  name: string;
  detail?: string;
  children?: ReactNode;
}) {
  return (
    <div className="grid gap-4">
      <Person name={name} detail={detail} />
      {children}
    </div>
  );
}
