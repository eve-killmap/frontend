import { StarData } from "@/lib/schema/system-schema";
import { Icon } from "./icon";
import { useRegisterIcon } from "@/hooks/system/use-register-icon";
import { useIconLayout } from "@/stores/system/icon-layout-store";
import { useLayoutEffect, useMemo } from "react";
import { addIcon } from "@/stores/system/icon-store";
import { LocalIcon } from "./local-icon";
import { getLabel } from "@/stores/system/system-object-name-store";

const STAR_ICON = 7;

interface StarIconProps {
  starData: StarData;
  hoverColor: string;
}

export function StarIcon({ starData, hoverColor }: StarIconProps) {
  const { position, label, wPosition, wLabel } = useMemo(() => {
    const position: [number, number, number] = [0, 0, 0];
    const wPosition: [number, number, number] = [
      starData.warpPosition.x,
      starData.warpPosition.y,
      starData.warpPosition.z,
    ];

    const label = getLabel(starData.starID);
    const wLabel = label + " (Warp in Point)";

    return { position, label, wPosition, wLabel };
  }, [starData]);

  useLayoutEffect(
    () => addIcon(starData.starID, { iconID: STAR_ICON, position }),
    [starData, label, position],
  );

  useRegisterIcon({
    id: starData.starID,
    position,
    priority: 10,
  });

  useRegisterIcon({
    id: starData.starID * 10,
    position: wPosition,
    priority: 1,
  });

  const { visible } = useIconLayout(starData.starID);
  const { visible: wVisible } = useIconLayout(starData.starID * 10);

  return (
    <>
      <Icon
        id={starData.starID}
        position={position}
        iconID={STAR_ICON}
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
