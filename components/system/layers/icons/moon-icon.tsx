import { useRegisterIcon } from "@/hooks/system/use-register-icon";
import { MoonData } from "@/lib/schema/system-schema";
import { useIconLayout } from "@/stores/system/icon-layout-store";
import { Icon } from "./icon";
import { useLayoutEffect, useMemo } from "react";
import { addIcon } from "@/stores/system/icon-store";
import { LocalIcon } from "./local-icon";
import { getLabel } from "@/stores/system/system-object-name-store";

const MOON_ICON = 2;

interface MoonIconProps {
  moonData: MoonData;
  hoverColor: string;
}

export function MoonIcon({ moonData, hoverColor }: MoonIconProps) {
  const { position, wPosition, mPosition, label, wLabel, mLabel } =
    useMemo(() => {
      const position: [number, number, number] = [
        moonData.position.x,
        moonData.position.y,
        moonData.position.z,
      ];
      const wPosition: [number, number, number] = [
        moonData.warpPosition.x,
        moonData.warpPosition.y,
        moonData.warpPosition.z,
      ];

      let mPosition: [number, number, number] | null = null;
      if (moonData.miningBeacon) {
        mPosition = [
          moonData.miningBeacon.x,
          moonData.miningBeacon.y,
          moonData.miningBeacon.z,
        ];
      }

      const label = getLabel(moonData.moonID);
      const wLabel = label + " (Warp in Point)";
      const mLabel = "Upwell Moon Mining Beacon";

      return { position, wPosition, mPosition, label, wLabel, mLabel };
    }, [moonData]);

  useLayoutEffect(
    () => addIcon(moonData.moonID, { iconID: MOON_ICON, position }),
    [moonData, label, position],
  );

  useRegisterIcon({
    id: moonData.moonID,
    position,
    priority: 5,
  });

  useRegisterIcon({
    id: moonData.moonID * 10,
    position: wPosition,
    priority: 1,
  });

  useRegisterIcon({
    id: moonData.moonID * 11,
    position: mPosition ? mPosition : [0, 0, 0],
    priority: 1,
  });

  const { visible } = useIconLayout(moonData.moonID);
  const { visible: wVisible } = useIconLayout(moonData.moonID * 10);
  const { visible: mVisible } = useIconLayout(moonData.moonID * 11);

  return (
    <>
      <Icon
        id={moonData.moonID}
        position={position}
        iconID={MOON_ICON}
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
      {mPosition && (
        <LocalIcon
          icon={"brackets/beacon.png"}
          position={mPosition}
          hoverColor={hoverColor}
          visible={mVisible}
          label={mLabel}
        />
      )}
    </>
  );
}
