import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { PartyPicker } from "./pickers/party-picker";
import { WarParty, warSearch } from "@/lib/api/wars";
import { WarSearchResult } from "@/lib/schema/war-schema";
import {
  warLabel,
  warDateRange,
  warParticipantIds,
  fmtDay,
} from "@/lib/filter/war-label";
import { resolveNames, UniverseName } from "@/lib/api/universe-names";
import { FilterValue } from "@/lib/filter/types";
import { MAX_IDS_PER_CONDITION } from "@/lib/filter/serialize";

const fmtDate = (e: number | null) => (e == null ? "–" : fmtDay(e));

export function WarBrowserDialog({
  open,
  onOpenChange,
  selected,
  onSelectedChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: FilterValue[];
  onSelectedChange: (values: FilterValue[]) => void;
}) {
  const [aggressor, setAggressor] = useState<WarParty | null>(null);
  const [defender, setDefender] = useState<WarParty | null>(null);
  const [results, setResults] = useState<WarSearchResult[]>([]);
  const [names, setNames] = useState<Record<number, UniverseName>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [searched, setSearched] = useState(false);
  const reqId = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);

  const selectedIds = new Set(selected.map((v) => v.id));

  const runSearch = async () => {
    if (!aggressor && !defender) return;
    controllerRef.current?.abort();
    const id = ++reqId.current;
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setError(false);
    setSearched(true);
    try {
      const wars = await warSearch(aggressor, defender, controller.signal);
      const ids = Array.from(new Set(wars.flatMap(warParticipantIds)));
      const resolved: Record<number, UniverseName> = ids.length
        ? await resolveNames(ids, controller.signal)
        : {};
      if (id !== reqId.current) return;
      setResults(wars);
      setNames(resolved);
    } catch {
      if (id !== reqId.current) return;
      setError(true);
      setResults([]);
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  };

  const toggleWar = (war: WarSearchResult) => {
    if (selectedIds.has(war.war_id)) {
      onSelectedChange(selected.filter((v) => v.id !== war.war_id));
    } else if (selected.length < MAX_IDS_PER_CONDITION) {
      onSelectedChange([
        ...selected,
        {
          id: war.war_id,
          name: warLabel(war, names),
          detail: warDateRange(war),
        },
      ]);
    }
  };

  const addAll = () => {
    const existing = new Set(selected.map((v) => v.id));
    const additions: FilterValue[] = [];
    for (const war of results) {
      if (existing.has(war.war_id)) continue;
      if (selected.length + additions.length >= MAX_IDS_PER_CONDITION) break;
      additions.push({
        id: war.war_id,
        name: warLabel(war, names),
        detail: warDateRange(war),
      });
    }
    if (additions.length) onSelectedChange([...selected, ...additions]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl **:data-[slot=dialog-close]:cursor-pointer">
        <DialogHeader>
          <DialogTitle>Find a war</DialogTitle>
          <DialogDescription className="sr-only">
            Search for a war by its participants to filter the kill list.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 items-start">
          <PartyPicker
            label="Aggressor"
            value={aggressor}
            onChange={setAggressor}
          />
          <PartyPicker
            label="Defender + allies"
            value={defender}
            onChange={setDefender}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="btn-glass"
            disabled={(!aggressor && !defender) || loading}
            onClick={runSearch}
          >
            {loading && <Loader2 className="size-3.5 animate-spin" />} Search
          </Button>
          <span className="text-2xs text-fg-subtle">
            Pick at least one party.
          </span>
        </div>
        <ScrollArea className="h-72 border border-border bg-elevated-subtle">
          <div className="p-1">
            {error ? (
              <p className="text-xs text-fg-subtle px-2 py-3">
                Search failed. Try again.
              </p>
            ) : !searched ? (
              <p className="text-xs text-fg-subtle px-2 py-3">
                Search for wars by aggressor and/or defender.
              </p>
            ) : results.length === 0 && !loading ? (
              <p className="text-xs text-fg-subtle px-2 py-3">No wars found.</p>
            ) : (
              results.map((war) => (
                <button
                  key={war.war_id}
                  onClick={() => toggleWar(war)}
                  aria-pressed={selectedIds.has(war.war_id)}
                  className={`w-full flex items-start gap-2 px-2 py-1 text-left cursor-pointer hover:bg-panel ${selectedIds.has(war.war_id) ? "bg-panel" : ""}`}
                >
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 size-3 rounded-sm border shrink-0 ${selectedIds.has(war.war_id) ? "bg-capsuleer/60 border-capsuleer/60" : "border-foreground/25"}`}
                  />
                  <span className="flex-1">
                    <span className="text-xs text-fg-secondary">
                      {warLabel(war, names)}
                    </span>
                    {war.mutual && (
                      <span className="ml-1 text-3xs text-capsuleer">
                        mutual
                      </span>
                    )}
                    <span className="block text-2xs text-fg-subtle">
                      declared {fmtDate(war.declared)} · started{" "}
                      {fmtDate(war.started)} · finished {fmtDate(war.finished)}{" "}
                      · retracted {fmtDate(war.retracted)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
        <div className="flex items-center justify-between">
          <Button
            size="sm"
            variant="outline"
            className="btn-glass"
            disabled={results.length === 0}
            onClick={addAll}
          >
            + Add all {results.length} wars
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-2xs text-fg-subtle">
              {selected.length} selected
            </span>
            <Button
              size="sm"
              variant="outline"
              className="btn-glass"
              onClick={() => onOpenChange(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
