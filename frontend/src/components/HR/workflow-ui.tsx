// Deferred screening score presentation.
export function Score({
  value,
  large = false,
}: {
  value: number;
  large?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-primary/10 font-semibold text-primary ${large ? "px-4 py-2 text-2xl" : "px-2.5 py-1 text-xs"}`}
    >
      {value}%
      {large ? <span className="text-xs font-medium">MATCH</span> : null}
    </span>
  );
}
