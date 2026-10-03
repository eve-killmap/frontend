import { useRegisterObject } from "@/hooks/system/use-register-object";
import { MoonData } from "@/lib/schema/system-schema";
import { useObjectVisible } from "@/stores/system/object-lod-store";
import { useSystemSettingsStore } from "@/stores/system/system-settings-store";
import * as THREE from "three";

interface MoonProps {
  moonData: MoonData;
  color: string;
}

export function Moon({ moonData, color }: MoonProps) {
  const allShown = useSystemSettingsStore((s) => s.allMeshesShown);
  const moonShown = useSystemSettingsStore((s) => s.moonMeshesShown);

  const position: [number, number, number] = [
    moonData.position.x,
    moonData.position.y,
    moonData.position.z,
  ];

  useRegisterObject({
    id: moonData.moonID,
    position,
    worldRadius: moonData.radius,
    minPixelRadius: 2,
  });

  const lodVisible = useObjectVisible(moonData.moonID);
  const visible = allShown && moonShown && lodVisible;

  return (
    <mesh position={position} visible={visible} renderOrder={5}>
      <sphereGeometry args={[moonData.radius]} />
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
