import { XIcon } from "lucide-react";
import { FilterValue } from "@/lib/filter/types";
import { ShipIcon } from "@/components/common/ship-icon";

export function ValueChip({
  value,
  typeIcon = false,
  onRemove,
}: {
  value: FilterValue;
  typeIcon?: boolean;
  onRemove: () => void;
}) {
  return (
    <span className="flex h-7 w-fit items-center gap-1.5 rounded-sm bg-muted pl-1 pr-1.5 text-xs font-medium text-foreground">
      {typeIcon ? (
        <ShipIcon typeId={value.id} className="w-5 h-5 rounded-xs" />
      ) : value.image_url ? (
        <img src={value.image_url} alt="" className="size-5 rounded-xs" />
      ) : null}
      <span className="whitespace-nowrap">
        {value.name}
        {value.ticker ? ` [${value.ticker}]` : ""}
      </span>
      <button
        onClick={onRemove}
        aria-label={`Remove ${value.name}`}
        className="-mr-0.5 opacity-50 hover:opacity-100 cursor-pointer"
      >
        <XIcon className="size-3.5" />
      </button>
    </span>
  );
}
