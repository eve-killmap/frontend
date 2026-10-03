import { useRegisterIcon } from "@/hooks/system/use-register-icon";
import { AsteroidBeltData } from "@/lib/schema/system-schema";
import { useIconLayout } from "@/stores/system/icon-layout-store";
import { Icon } from "./icon";
import { useLayoutEffect, useMemo } from "react";
import { addIcon } from "@/stores/system/icon-store";
import { getLabel } from "@/stores/system/system-object-name-store";

const ASTEROID_BELT_ICON = 0;

interface AsteroidBeltIconProps {
  asteroidBeltData: AsteroidBeltData;
  hoverColor: string;
}

export function AsteroidBeltIcon({
  asteroidBeltData,
  hoverColor,
}: AsteroidBeltIconProps) {
  const { position, label } = useMemo(() => {
    const position: [number, number, number] = [
      asteroidBeltData.position.x,
      asteroidBeltData.position.y,
      asteroidBeltData.position.z,
    ];

    const label = getLabel(asteroidBeltData.asteroidBeltID);

    return { position, label };
  }, [asteroidBeltData]);

  useLayoutEffect(
    () =>
      addIcon(asteroidBeltData.asteroidBeltID, {
        iconID: ASTEROID_BELT_ICON,
        position,
      }),
    [asteroidBeltData, label, position],
  );

  useRegisterIcon({
    id: asteroidBeltData.asteroidBeltID,
    position,
    priority: 7,
  });

  const { visible } = useIconLayout(asteroidBeltData.asteroidBeltID);

  return (
    <Icon
      id={asteroidBeltData.asteroidBeltID}
      position={position}
      iconID={ASTEROID_BELT_ICON}
      hoverColor={hoverColor}
      visible={visible}
      label={label}
    />
  );
}
