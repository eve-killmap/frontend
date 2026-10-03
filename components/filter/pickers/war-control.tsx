import { useState } from "react";
import { FilterCondition } from "@/lib/filter/types";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { WarBrowserDialog } from "../war-browser-dialog";

export function WarControl({
  condition,
  onChange,
}: {
  condition: FilterCondition;
  onChange: (next: FilterCondition) => void;
}) {
  const [open, setOpen] = useState(false);
  const warAny = condition.warAny === true;
  const values = condition.values;
  const MAX_SHOWN = 5;
  const shown = values.slice(0, MAX_SHOWN);

  return (
    <div className="space-y-1">
      <label className="flex items-center gap-2 cursor-pointer">
        <Switch
          checked={warAny}
          onCheckedChange={(c) =>
            onChange({ ...condition, warAny: c, values: c ? [] : values })
          }
          className="cursor-pointer"
        />
        <span className="text-xs text-fg-secondary">Any war</span>
      </label>
      {!warAny && (
        <>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="btn-glass"
              onClick={() => setOpen(true)}
            >
              Find wars…
            </Button>
            {values.length > 0 && (
              <button
                onClick={() => onChange({ ...condition, values: [] })}
                className="text-2xs text-fg-subtle hover:text-fg-secondary cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          {values.length > 0 && (
            <ul className="space-y-0.5">
              {shown.map((v) => (
                <li key={v.id} className="leading-tight">
                  <span className="block text-2xs text-fg-secondary truncate">
                    {v.name}
                  </span>
                  {v.detail && (
                    <span className="block text-3xs text-fg-muted">
                      {v.detail}
                    </span>
                  )}
                </li>
              ))}
              {values.length > MAX_SHOWN && (
                <li className="text-2xs text-fg-subtle">
                  +{values.length - MAX_SHOWN} more
                </li>
              )}
            </ul>
          )}
          <WarBrowserDialog
            open={open}
            onOpenChange={setOpen}
            selected={values}
            onSelectedChange={(next) =>
              onChange({ ...condition, warAny: false, values: next })
            }
          />
        </>
      )}
    </div>
  );
}
