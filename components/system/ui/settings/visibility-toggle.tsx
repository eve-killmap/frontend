import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSystemSettingsStore } from "@/stores/system/system-settings-store";

export const VisibilityToggle = React.memo(function VisibilityToggle() {
  const allShown = useSystemSettingsStore((s) => s.allMeshesShown);
  const starShown = useSystemSettingsStore((s) => s.starMeshShown);
  const planetShown = useSystemSettingsStore((s) => s.planetMeshesShown);
  const moonShown = useSystemSettingsStore((s) => s.moonMeshesShown);
  const beltShown = useSystemSettingsStore((s) => s.beltMeshesShown);

  const setAllShown = useSystemSettingsStore((s) => s.setAllShown);
  const setStarShown = useSystemSettingsStore((s) => s.setStarMeshShown);
  const setPlanetShown = useSystemSettingsStore((s) => s.setPlanetMeshesShown);
  const setMoonShown = useSystemSettingsStore((s) => s.setMoonMeshesShown);
  const setBeltShown = useSystemSettingsStore((s) => s.setBeltMeshesShown);

  return (
    <>
      <div className="flex items-center justify-between">
        <Label htmlFor="show-all-lines" className="text-xs text-fg-muted">
          Show All
        </Label>
        <Switch
          id="show-all-lines"
          checked={allShown}
          onCheckedChange={setAllShown}
          className="cursor-pointer"
        />
      </div>
      <div className="space-y-1 pl-2 border-l-2 border-capsuleer/40">
        <MeshVisibilityToggle
          id="star-shown"
          label="Star"
          shown={starShown}
          setShown={setStarShown}
        />
        <MeshVisibilityToggle
          id="planet-shown"
          label="Planets"
          shown={planetShown}
          setShown={setPlanetShown}
        />
        <MeshVisibilityToggle
          id="moons-shown"
          label="Moons"
          shown={moonShown}
          setShown={setMoonShown}
        />
        <MeshVisibilityToggle
          id="belt-shown"
          label="Asteroid Belts"
          shown={beltShown}
          setShown={setBeltShown}
        />
      </div>
    </>
  );
});

function MeshVisibilityToggle({
  id,
  label,
  shown,
  setShown,
}: {
  id: string;
  label: string;
  shown: boolean;
  setShown: (shown: boolean) => void;
}) {
  const allShown = useSystemSettingsStore((s) => s.allMeshesShown);

  return (
    <div className="flex items-center justify-between">
      <Label htmlFor={id} className="text-xs text-fg-muted">
        {label}
      </Label>
      <Switch
        id={id}
        checked={shown}
        onCheckedChange={(checked) => setShown(checked)}
        disabled={!allShown}
        className="cursor-pointer"
      />
    </div>
  );
}
