import { useRegisterObject } from "@/hooks/system/use-register-object";
import { AsteroidBeltData } from "@/lib/schema/system-schema";
import { useObjectVisible } from "@/stores/system/object-lod-store";
import { useSystemSettingsStore } from "@/stores/system/system-settings-store";
import * as THREE from "three";

interface PlanetsProps {
  asteroidBeltData: AsteroidBeltData;
  color: string;
}

export function AsteroidBelt({ asteroidBeltData, color }: PlanetsProps) {
  const allShown = useSystemSettingsStore((s) => s.allMeshesShown);
  const beltShown = useSystemSettingsStore((s) => s.beltMeshesShown);

  const position: [number, number, number] = [
    asteroidBeltData.position.x,
    asteroidBeltData.position.y,
    asteroidBeltData.position.z,
  ];
  const radius = asteroidBeltData.radius ?? 20000;

  useRegisterObject({
    id: asteroidBeltData.asteroidBeltID,
    position,
    worldRadius: radius,
    minPixelRadius: 2,
  });

  const lodVisible = useObjectVisible(asteroidBeltData.asteroidBeltID);
  const visible = allShown && beltShown && lodVisible;

  return (
    <mesh position={position} visible={visible} renderOrder={5}>
      <sphereGeometry args={[radius]} />
      <meshBasicMaterial
        opacity={0.1}
        wireframe={true}
        transparent
        depthWrite={false}
        toneMapped={false}
        color={color}
        side={THREE.DoubleSide}
        blending={THREE.NormalBlending}
      />
    </mesh>
  );
}
