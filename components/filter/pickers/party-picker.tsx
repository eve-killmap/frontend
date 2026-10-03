import { useEffect, useRef, useState } from "react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { autocompleteEntities, EntityResult } from "@/lib/api/autocomplete";
import { WarParty, WarPartyKind } from "@/lib/api/wars";
import { XIcon } from "lucide-react";

const KINDS: { kind: WarPartyKind; label: string }[] = [
  { kind: "alliance", label: "Alliance" },
  { kind: "corporation", label: "Corp" },
];

export function PartyPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: WarParty | null;
  onChange: (party: WarParty | null) => void;
}) {
  const [kind, setKind] = useState<WarPartyKind>("alliance");
  const [input, setInput] = useState("");
  const debounced = useDebouncedValue(input.trim(), 250);
  const [results, setResults] = useState<EntityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const reqId = useRef(0);

  useEffect(() => {
    if (debounced.length < 3) {
      setResults([]);
      return;
    }
    const id = ++reqId.current;
    const controller = new AbortController();
    setLoading(true);
    autocompleteEntities(kind, debounced, controller.signal)
      .then((r) => {
        if (id === reqId.current) setResults(r);
      })
      .catch(() => {
        if (id === reqId.current) setResults([]);
      })
      .finally(() => {
        if (id === reqId.current) setLoading(false);
      });
    return () => controller.abort();
  }, [kind, debounced]);

  const pick = (r: EntityResult) => {
    onChange({ kind, id: r.id, name: r.name });
    setInput("");
    setResults([]);
  };
  const reset = () => onChange(null);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-fg-secondary">{label}</span>
        <div className="flex gap-0.5">
          {KINDS.map((k) => (
            <button
              key={k.kind}
              onClick={() => {
                setKind(k.kind);
                reset();
              }}
              className={`text-2xs px-1.5 py-0.5 rounded-xs cursor-pointer ${kind === k.kind ? "bg-capsuleer/20 text-capsuleer" : "text-fg-subtle hover:text-fg-secondary"}`}
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>
      {value ? (
        <div className="flex items-center gap-1 rounded-sm bg-muted px-1.5 py-1 text-xs">
          <span className="flex-1 truncate min-w-0">
            {value.name ?? `#${value.id}`}
          </span>
          <button
            onClick={reset}
            aria-label={`Clear ${label}`}
            className="shrink-0 opacity-50 hover:opacity-100 cursor-pointer"
          >
            <XIcon className="size-3.5" />
          </button>
        </div>
      ) : (
        <Command
          shouldFilter={false}
          className="relative h-fit overflow-visible border bg-panel"
        >
          <CommandInput
            placeholder={`Search ${kind}…`}
            value={input}
            onValueChange={setInput}
          />
          {debounced.length >= 3 && (
            <CommandList className="absolute left-0 right-0 top-full z-overlay mt-1 max-h-56 rounded-sm border bg-panel shadow-lg">
              {results.length > 0 ? (
                <CommandGroup>
                  {results.map((r) => (
                    <CommandItem
                      key={r.id}
                      value={String(r.id)}
                      onSelect={() => pick(r)}
                      className="flex items-start gap-2 cursor-pointer"
                    >
                      {r.image_url && (
                        <img
                          src={r.image_url}
                          alt=""
                          className="size-6 rounded-xs shrink-0"
                        />
                      )}
                      <span className="min-w-0 flex-1 wrap-break-word">
                        {r.name}
                        {r.member_count === 0 && (
                          <span className="ml-1 text-fg-subtle">(Closed)</span>
                        )}
                        {r.ticker && (
                          <span className="ml-1 text-fg-faint text-2xs">
                            [{r.ticker}]
                          </span>
                        )}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : (
                <CommandEmpty>
                  {loading ? "Searching…" : "No matches"}
                </CommandEmpty>
              )}
            </CommandList>
          )}
        </Command>
      )}
    </div>
  );
}
