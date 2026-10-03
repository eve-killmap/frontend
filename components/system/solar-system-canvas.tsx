import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { SystemData } from "@/lib/schema/system-schema";
import { SolarSystemScene } from "./solar-system-scene";
import { getCameraState } from "@/stores/system/camera-state-store";
import { decodeSystemShare } from "@/lib/system/share/system-share";
import { preload } from "suspend-react";
import { preloadFont } from "troika-three-text";
import { SCENE } from "@/lib/scene-colors";
import { CaptureBridge } from "@/components/common/capture-bridge";

const FONTS = ["/fonts/Barlow-Medium.ttf", "/fonts/SpaceMono-Regular.ttf"];
for (const font of FONTS) {
  preload(() => new Promise<void>((res) => preloadFont({ font }, res)), [
    "troika-text",
    font,
    undefined,
  ] as unknown as [string, string, undefined]);
}

const INITIAL_CAMERA_AZIMUTH = 60;

interface SolarSystemCanvasProps {
  slug: string;
  farthestKill: number;
  systemData: SystemData;
}

export function SolarSystemCanvas({
  slug,
  farthestKill,
  systemData,
}: SolarSystemCanvasProps) {
  const deepLinkKillId = useMemo(() => {
    if (typeof window === "undefined") return null;
    const param = new URLSearchParams(window.location.search).get("kill");
    return param ? Number(param) || null : null;
  }, []);

  const { farthest, initialCameraPosition, initialControlsTarget } =
    useMemo(() => {
      const farthest = Math.max(farthestKill, systemData.farthestObject);

      const shared = deepLinkKillId
        ? null
        : decodeSystemShare(new URLSearchParams(window.location.search)).camera;
      const cached = deepLinkKillId ? null : getCameraState();

      const source = shared
        ? { cameraPosition: shared.position, controlsTarget: shared.target }
        : cached;

      if (source) {
        return {
          farthest,
          initialCameraPosition: source.cameraPosition,
          initialControlsTarget: source.controlsTarget,
        };
      }

      const radians = (INITIAL_CAMERA_AZIMUTH * Math.PI) / 180;
      const y = farthest * 1.2 * Math.cos(radians);
      const z = farthest * 1.2 * Math.sin(radians);

      return {
        farthest,
        initialCameraPosition: [0, y, -z] as [number, number, number],
        initialControlsTarget: null,
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [systemData, slug, deepLinkKillId]);

  return (
    <>
      <Canvas
        camera={{
          position: initialCameraPosition,
          fov: 60,
          near: 1,
          far: farthest * 5,
        }}
        gl={{ alpha: false, antialias: true, logarithmicDepthBuffer: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(SCENE.CANVAS_CLEAR);
        }}
      >
        <CaptureBridge />
        <Suspense fallback={null}>
          <SolarSystemScene
            slug={slug}
            systemData={systemData}
            farthest={farthest}
            initialControlsTarget={initialControlsTarget}
            deepLinkKillId={deepLinkKillId}
          />
        </Suspense>
      </Canvas>
    </>
  );
}
