import { useRegisterIcon } from "@/hooks/system/use-register-icon";
import { StargateData } from "@/lib/schema/system-schema";
import { useIconLayout } from "@/stores/system/icon-layout-store";
import { Icon } from "./icon";
import { useLayoutEffect, useMemo } from "react";
import { addIcon } from "@/stores/system/icon-store";
import { getLabel } from "@/stores/system/system-object-name-store";

const STARGATE_ICON = 4;
const DISRUPTED_STARGATE_ICON = 5;

interface StargateIconProps {
  stargateData: StargateData;
  hoverColor: string;
  disrupted: boolean;
}

export function StargateIcon({
  stargateData,
  hoverColor,
  disrupted,
}: StargateIconProps) {
  const { position, label } = useMemo(() => {
    const position: [number, number, number] = [
      stargateData.position.x,
      stargateData.position.y,
      stargateData.position.z,
    ];

    const label = getLabel(stargateData.stargateID);

    return { position, label };
  }, [stargateData]);

  useLayoutEffect(
    () =>
      addIcon(stargateData.stargateID, {
        iconID: disrupted ? DISRUPTED_STARGATE_ICON : STARGATE_ICON,
        position,
      }),
    [stargateData, disrupted, position],
  );

  useRegisterIcon({
    id: stargateData.stargateID,
    position,
    priority: 9,
  });

  const { visible } = useIconLayout(stargateData.stargateID);

  return (
    <Icon
      id={stargateData.stargateID}
      position={position}
      iconID={disrupted ? DISRUPTED_STARGATE_ICON : STARGATE_ICON}
      hoverColor={hoverColor}
      visible={visible}
      label={label}
    />
  );
}
