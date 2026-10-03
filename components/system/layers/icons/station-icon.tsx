import { useRegisterIcon } from "@/hooks/system/use-register-icon";
import { StationData } from "@/lib/schema/system-schema";
import { useIconLayout } from "@/stores/system/icon-layout-store";
import { Icon } from "./icon";
import { useLayoutEffect, useMemo } from "react";
import { addIcon } from "@/stores/system/icon-store";
import { getLabel } from "@/stores/system/system-object-name-store";

const STATION_ICON = 6;

interface StationIconProps {
  stationData: StationData;
  hoverColor: string;
}

export function StationIcon({ stationData, hoverColor }: StationIconProps) {
  const { position, label } = useMemo(() => {
    const position: [number, number, number] = [
      stationData.position.x,
      stationData.position.y,
      stationData.position.z,
    ];

    const label = getLabel(stationData.stationID);

    return { position, label };
  }, [stationData]);

  useLayoutEffect(
    () => addIcon(stationData.stationID, { iconID: STATION_ICON, position }),
    [stationData, label, position],
  );

  useRegisterIcon({
    id: stationData.stationID,
    position,
    priority: 8,
  });

  const { visible } = useIconLayout(stationData.stationID);

  return (
    <Icon
      id={stationData.stationID}
      position={position}
      iconID={STATION_ICON}
      hoverColor={hoverColor}
      visible={visible}
      label={label}
    />
  );
}
