import { Switch } from "@/components/ui/switch";
import { useMapStore } from "@/stores/map/map-store";

export function MapDimensionToggle() {
  const show3D = useMapStore((s) => s.show3D);
  const setShow3D = useMapStore((s) => s.setShow3D);

  return (
    <div className="flex items-center gap-2 px-3 select-none">
      <span
        className={`text-xs font-mono ${show3D ? "text-fg-muted" : "text-capsuleer"}`}
      >
        2D
      </span>
      <Switch
        checked={show3D}
        onCheckedChange={setShow3D}
        className="cursor-pointer"
        aria-label="Toggle 2D / 3D map layout"
      />
      <span
        className={`text-xs font-mono ${show3D ? "text-capsuleer" : "text-fg-muted"}`}
      >
        3D
      </span>
    </div>
  );
}
