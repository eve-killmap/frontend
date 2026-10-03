import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

function wrap(value: number, mod: number): number {
  return ((value % mod) + mod) % mod;
}

const pad = (n: number) => String(n).padStart(2, "0");

function Field({
  value,
  mod,
  label,
  onChange,
}: {
  value: number;
  mod: number;
  label: string;
  onChange: (v: number) => void;
}) {
  const [text, setText] = useState<string | null>(null);

  const bump = (delta: number) => {
    const next = wrap(value + delta, mod);
    onChange(next);
    if (text !== null) setText(pad(next));
  };

  const commit = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits !== "") onChange(wrap(Number(digits), mod));
    setText(null);
  };

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        aria-label={`Increase ${label}`}
        onClick={() => bump(1)}
        className="text-fg-muted hover:text-capsuleer cursor-pointer leading-none"
      >
        <ChevronUp className="size-3.5" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        aria-label={label}
        value={text ?? pad(value)}
        onFocus={(e) => {
          setText(pad(value));
          e.currentTarget.select();
        }}
        onChange={(e) => setText(e.target.value.replace(/\D/g, "").slice(0, 2))}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp") {
            e.preventDefault();
            bump(1);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            bump(-1);
          } else if (e.key === "Enter") {
            commit(e.currentTarget.value);
            e.currentTarget.blur();
          }
        }}
        className="w-9 h-7 text-center border border-border bg-elevated-subtle text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-capsuleer/40"
      />
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        onClick={() => bump(-1)}
        className="text-fg-muted hover:text-capsuleer cursor-pointer leading-none"
      >
        <ChevronDown className="size-3.5" />
      </button>
    </div>
  );
}

export function TimeStepper({
  hour,
  minute,
  onChange,
}: {
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <Field
        value={hour}
        mod={24}
        label="Hour"
        onChange={(h) => onChange(h, minute)}
      />
      <span className="text-fg-muted text-xs select-none">:</span>
      <Field
        value={minute}
        mod={60}
        label="Minute"
        onChange={(m) => onChange(hour, m)}
      />
    </div>
  );
}
