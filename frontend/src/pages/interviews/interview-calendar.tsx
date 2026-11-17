import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InterviewCalendar({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (date: string) => void;
  disabled?: boolean;
}) {
  const [today] = useState(() =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu" }).format(
      new Date(),
    ),
  );
  const [month, setMonth] = useState(() => (value || today).slice(0, 7));
  const [year, number] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, number - 1, 1));
  const count = new Date(Date.UTC(year, number, 0)).getUTCDate();
  const label = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(first);
  function move(offset: number) {
    const next = new Date(Date.UTC(year, number - 1 + offset, 1));
    setMonth(next.toISOString().slice(0, 7));
  }
  return (
    <section className="interview-calendar" aria-label="Interview date filter">
      <header>
        <strong aria-live="polite">{label}</strong>
        <div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            aria-label="Previous month"
            onClick={() => move(-1)}
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            aria-label="Next month"
            onClick={() => move(1)}
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </header>
      <div className="calendar-days">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <small key={day}>
            {day.slice(0, 1)}
            <span className="sr-only">{day.slice(1)}</span>
          </small>
        ))}
        {Array.from({ length: first.getUTCDay() }, (_, index) => (
          <span key={"blank-" + index} aria-hidden="true" />
        ))}
        {Array.from({ length: count }, (_, index) => {
          const date = `${month}-${String(index + 1).padStart(2, "0")}`;
          return (
            <button
              type="button"
              key={date}
              disabled={disabled}
              aria-label={date}
              aria-pressed={value === date}
              aria-current={today === date ? "date" : undefined}
              onClick={() => onChange(date)}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
      <div className="interview-calendar-actions">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => {
            setMonth(today.slice(0, 7));
            onChange(today);
          }}
        >
          Today
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled || !value}
          onClick={() => onChange("")}
        >
          All dates
        </Button>
      </div>
    </section>
  );
}
