import { useRegisterObject } from "@/hooks/system/use-register-object";
import { PlanetData } from "@/lib/schema/system-schema";
import { useObjectVisible } from "@/stores/system/object-lod-store";
import { useSystemSettingsStore } from "@/stores/system/system-settings-store";
import * as THREE from "three";

interface PlanetsProps {
  planetData: PlanetData;
  color: string;
}

export function Planet({ planetData, color }: PlanetsProps) {
  const allShown = useSystemSettingsStore((s) => s.allMeshesShown);
  const planetShown = useSystemSettingsStore((s) => s.planetMeshesShown);

  const position: [number, number, number] = [
    planetData.position.x,
    planetData.position.y,
    planetData.position.z,
  ];

  useRegisterObject({
    id: planetData.planetID,
    position,
    worldRadius: planetData.radius,
    minPixelRadius: 2,
  });

  const lodVisible = useObjectVisible(planetData.planetID);
  const visible = allShown && planetShown && lodVisible;

  return (
    <mesh position={position} visible={visible} renderOrder={5}>
      <sphereGeometry args={[planetData.radius]} />
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
