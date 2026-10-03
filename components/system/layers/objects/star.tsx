import { useRegisterObject } from "@/hooks/system/use-register-object";
import { StarData } from "@/lib/schema/system-schema";
import { useObjectVisible } from "@/stores/system/object-lod-store";
import { useSystemSettingsStore } from "@/stores/system/system-settings-store";
import * as THREE from "three";

interface StarProps {
  starData: StarData;
  color: string;
}

export function Star({ starData, color }: StarProps) {
  const allShown = useSystemSettingsStore((s) => s.allMeshesShown);
  const starShown = useSystemSettingsStore((s) => s.starMeshShown);

  const position: [number, number, number] = [0, 0, 0];

  useRegisterObject({
    id: starData.starID,
    position,
    worldRadius: starData.radius,
    minPixelRadius: 2,
  });

  const lodVisible = useObjectVisible(starData.starID);
  const visible = allShown && starShown && lodVisible;

  return (
    <mesh position={position} visible={visible} renderOrder={5}>
      <sphereGeometry args={[starData.radius]} />
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
