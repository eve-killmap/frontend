import {
  FilterAttribute,
  FilterCondition,
  FilterSide,
} from "@/lib/filter/types";
import { MAX_CONDITIONS } from "@/lib/filter/serialize";
import { makeUid } from "@/lib/filter/uid";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ConditionRow } from "./condition-row";

export interface AvailableAttribute {
  attribute: FilterAttribute;
  label: string;
  picker: "entity" | "ship" | "weapon" | "war";
  sides?: FilterSide[];
}

export function FilterBuilder({
  available,
  value,
  onChange,
}: {
  available: AvailableAttribute[];
  value: FilterCondition[];
  onChange: (next: FilterCondition[]) => void;
}) {
  const addCondition = () => {
    const first = available[0];
    onChange([
      ...value,
      {
        uid: makeUid(),
        attribute: first.attribute,
        side: first.sides ? first.sides[0] : undefined,
        values: [],
      },
    ]);
  };
  const updateCondition = (uid: string, next: FilterCondition) =>
    onChange(value.map((c) => (c.uid === uid ? next : c)));
  const removeCondition = (uid: string) =>
    onChange(value.filter((c) => c.uid !== uid));

  return (
    <div className="flex flex-col gap-2">
      {value.map((c) => (
        <ConditionRow
          key={c.uid}
          condition={c}
          available={available}
          onChange={(next) => updateCondition(c.uid, next)}
          onRemove={() => removeCondition(c.uid)}
        />
      ))}
      {value.length === 0 && (
        <p className="text-2xs text-fg-subtle italic">
          No filters, showing all kills.
        </p>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={addCondition}
        disabled={value.length >= MAX_CONDITIONS}
        className="btn-glass justify-start"
      >
        <Plus /> Add condition
      </Button>
    </div>
  );
}
