import { useEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import {
  captureFrameFn,
  setCaptureFrameFn,
  type CaptureFrameFn,
} from "@/lib/export/capture-functions";

const MAX_SCALE = 4;

export function CaptureBridge() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  useEffect(() => {
    const fn: CaptureFrameFn = async (scale) => {
      const prevRatio = gl.getPixelRatio();
      const prevSize = gl.getSize(new THREE.Vector2());
      let blob: Promise<Blob>;
      try {
        gl.setPixelRatio(Math.min(scale, MAX_SCALE));
        gl.setSize(size.width, size.height, false);
        gl.render(scene, camera);
        blob = new Promise<Blob>((resolve, reject) =>
          gl.domElement.toBlob(
            (b) =>
              b ? resolve(b) : reject(new Error("Capture produced no image")),
            "image/png",
          ),
        );
      } finally {
        gl.setPixelRatio(prevRatio);
        gl.setSize(prevSize.x, prevSize.y, false);
      }
      return await blob;
    };
    setCaptureFrameFn(fn);
    return () => {
      if (captureFrameFn === fn) setCaptureFrameFn(null);
    };
  }, [gl, scene, camera, size]);

  return null;
}
