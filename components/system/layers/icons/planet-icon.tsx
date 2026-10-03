import { useRegisterIcon } from "@/hooks/system/use-register-icon";
import { PlanetData } from "@/lib/schema/system-schema";
import { useIconLayout } from "@/stores/system/icon-layout-store";
import { Icon } from "./icon";
import { useLayoutEffect, useMemo } from "react";
import { addIcon } from "@/stores/system/icon-store";
import { LocalIcon } from "./local-icon";
import { getLabel } from "@/stores/system/system-object-name-store";

const PLANET_ICON = 3;

interface PlanetIconProps {
  planetData: PlanetData;
  hoverColor: string;
}

export function PlanetIcon({ planetData, hoverColor }: PlanetIconProps) {
  const { position, wPosition, label, wLabel } = useMemo(() => {
    const position: [number, number, number] = [
      planetData.position.x,
      planetData.position.y,
      planetData.position.z,
    ];
    const wPosition: [number, number, number] = [
      planetData.warpPosition.x,
      planetData.warpPosition.y,
      planetData.warpPosition.z,
    ];

    const planetName = getLabel(planetData.planetID);

    const label = planetData.uniqueName ?? planetName;
    const wLabel = label + " (Warp in Point)";

    return { position, wPosition, label, wLabel };
  }, [planetData]);

  useLayoutEffect(
    () => addIcon(planetData.planetID, { iconID: PLANET_ICON, position }),
    [planetData, label, position],
  );

  useRegisterIcon({
    id: planetData.planetID,
    position,
    priority: 6,
  });

  useRegisterIcon({
    id: planetData.planetID * 10,
    position: wPosition,
    priority: 1,
  });

  const { visible } = useIconLayout(planetData.planetID);
  const { visible: wVisible } = useIconLayout(planetData.planetID * 10);

  return (
    <>
      <Icon
        id={planetData.planetID}
        position={position}
        iconID={PLANET_ICON}
        hoverColor={hoverColor}
        visible={visible}
        label={label}
      />
      <LocalIcon
        icon={"brackets/warpin.png"}
        position={wPosition}
        hoverColor={hoverColor}
        visible={wVisible}
        label={wLabel}
      />
    </>
  );
}
