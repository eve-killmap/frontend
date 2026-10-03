import {
  FilterAttribute,
  FilterCondition,
  FilterSide,
  FilterValue,
} from "@/lib/filter/types";
import {
  EntityKind,
  autocompleteShips,
  autocompleteWeapons,
} from "@/lib/api/autocomplete";
import { XIcon } from "lucide-react";
import { AvailableAttribute } from "./filter-builder";
import { EntityAutocomplete } from "./pickers/entity-autocomplete";
import { TypeAutocomplete } from "./pickers/type-autocomplete";
import { WarControl } from "./pickers/war-control";

const SIDE_LABELS: Record<FilterSide, string> = {
  victim: "Victim",
  attacker: "Attacker",
  involved: "Involved",
};

export function ConditionRow({
  condition,
  available,
  onChange,
  onRemove,
}: {
  condition: FilterCondition;
  available: AvailableAttribute[];
  onChange: (next: FilterCondition) => void;
  onRemove: () => void;
}) {
  const attr =
    available.find((a) => a.attribute === condition.attribute) ?? available[0];

  const setAttribute = (attribute: FilterAttribute) => {
    const def = available.find((a) => a.attribute === attribute)!;
    onChange({
      ...condition,
      attribute,
      side: def.sides ? def.sides[0] : undefined,
      values: [],
    });
  };
  const setSide = (side: FilterSide) => onChange({ ...condition, side });
  const setValues = (values: FilterValue[]) =>
    onChange({ ...condition, values });

  return (
    <div className="flex flex-col gap-1 rounded-sm border border-border bg-panel-elevated/40 p-1.5">
      <div className="flex items-center gap-1">
        <select
          value={condition.attribute}
          onChange={(e) => setAttribute(e.target.value as FilterAttribute)}
          className="flex-1 bg-panel border border-border rounded-xs text-xs px-1 py-0.5"
        >
          {available.map((a) => (
            <option key={a.attribute} value={a.attribute}>
              {a.label}
            </option>
          ))}
        </select>
        {attr.sides && attr.sides.length > 1 && (
          <select
            value={condition.side}
            onChange={(e) => setSide(e.target.value as FilterSide)}
            className="bg-panel border border-border rounded-xs text-xs px-1 py-0.5"
          >
            {attr.sides.map((s) => (
              <option key={s} value={s}>
                {SIDE_LABELS[s]}
              </option>
            ))}
          </select>
        )}
        <button
          onClick={onRemove}
          aria-label="Remove condition"
          className="text-fg-subtle hover:text-fg-secondary cursor-pointer"
        >
          <XIcon className="size-3.5" />
        </button>
      </div>
      {attr.picker === "ship" ? (
        <TypeAutocomplete
          values={condition.values}
          onChange={setValues}
          placeholder="Search ships…"
          fetcher={autocompleteShips}
        />
      ) : attr.picker === "weapon" ? (
        <TypeAutocomplete
          values={condition.values}
          onChange={setValues}
          placeholder="Search weapons…"
          fetcher={autocompleteWeapons}
        />
      ) : attr.picker === "war" ? (
        <WarControl condition={condition} onChange={onChange} />
      ) : (
        <EntityAutocomplete
          kind={condition.attribute as EntityKind}
          values={condition.values}
          onChange={setValues}
        />
      )}
    </div>
  );
}
