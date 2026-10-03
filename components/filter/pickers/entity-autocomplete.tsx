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
import {
  autocompleteEntities,
  EntityKind,
  EntityResult,
} from "@/lib/api/autocomplete";
import { FilterValue } from "@/lib/filter/types";
import { MAX_IDS_PER_CONDITION } from "@/lib/filter/serialize";
import { ValueChip } from "./value-chip";

export function EntityAutocomplete({
  kind,
  values,
  onChange,
}: {
  kind: EntityKind;
  values: FilterValue[];
  onChange: (values: FilterValue[]) => void;
}) {
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

  const add = (r: EntityResult) => {
    if (
      values.some((v) => v.id === r.id) ||
      values.length >= MAX_IDS_PER_CONDITION
    )
      return;
    onChange([
      ...values,
      { id: r.id, name: r.name, image_url: r.image_url, ticker: r.ticker },
    ]);
    setInput("");
    setResults([]);
  };
  const remove = (id: number) => onChange(values.filter((v) => v.id !== id));

  return (
    <div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
          {values.map((v) => (
            <ValueChip key={v.id} value={v} onRemove={() => remove(v.id)} />
          ))}
        </div>
      )}
      <Command shouldFilter={false} className="border bg-panel">
        <CommandInput
          placeholder={`Search ${kind}…`}
          value={input}
          onValueChange={setInput}
        />
        {debounced.length >= 3 && (
          <CommandList>
            {results.length > 0 ? (
              <CommandGroup>
                {results.map((r) => (
                  <CommandItem
                    key={r.id}
                    value={String(r.id)}
                    onSelect={() => add(r)}
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
                      {r.ticker && (
                        <span className="ml-1 text-fg-faint text-2xs">
                          [{r.ticker}]
                        </span>
                      )}
                      {r.member_count === 0 && (
                        <span className="ml-2 text-fg-subtle">(Closed)</span>
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
    </div>
  );
}
