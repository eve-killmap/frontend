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
import { TypeResult } from "@/lib/api/autocomplete";
import { FilterValue } from "@/lib/filter/types";
import { MAX_IDS_PER_CONDITION } from "@/lib/filter/serialize";
import { ShipIcon } from "@/components/common/ship-icon";
import { ValueChip } from "./value-chip";

export function TypeAutocomplete({
  values,
  onChange,
  placeholder,
  fetcher,
}: {
  values: FilterValue[];
  onChange: (values: FilterValue[]) => void;
  placeholder: string;
  fetcher: (q: string, signal?: AbortSignal) => Promise<TypeResult[]>;
}) {
  const [input, setInput] = useState("");
  const debounced = useDebouncedValue(input.trim(), 250);
  const [results, setResults] = useState<TypeResult[]>([]);
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
    fetcher(debounced, controller.signal)
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
  }, [debounced, fetcher]);

  const add = (r: TypeResult) => {
    if (
      values.some((v) => v.id === r.id) ||
      values.length >= MAX_IDS_PER_CONDITION
    )
      return;
    onChange([...values, { id: r.id, name: r.name, image_url: r.image_url }]);
    setInput("");
    setResults([]);
  };
  const remove = (id: number) => onChange(values.filter((v) => v.id !== id));

  return (
    <div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
          {values.map((v) => (
            <ValueChip
              key={v.id}
              value={v}
              typeIcon
              onRemove={() => remove(v.id)}
            />
          ))}
        </div>
      )}
      <Command shouldFilter={false} className="border bg-panel">
        <CommandInput
          placeholder={placeholder}
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
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <ShipIcon typeId={r.id} className="w-6 h-6 rounded-xs" />
                    <span className="flex-1 truncate">{r.name}</span>
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
