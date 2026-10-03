export const POLL_MS = 300;

export function Row({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div>
      {label}:{" "}
      <span className={warn ? "text-red-400 font-bold" : "text-fg-strong"}>
        {value}
      </span>
    </div>
  );
}

export function SectionHeader({ title }: { title: string }) {
  return (
    <div className="text-fg-muted border-t border-border/60 pt-1 mt-1 w-full text-left">
      <span className="text-3xs uppercase tracking-wide">{title}</span>
    </div>
  );
}
