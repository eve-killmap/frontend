import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { SCENE } from "@/lib/scene-colors";

const _camLocal = new THREE.Vector3();
const _invMatrix = new THREE.Matrix4();

const vertexShader = `
    varying vec3 vLocalPos;

    void main() {
        vLocalPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShader = `
    precision highp float;

    uniform vec3 uColor;
    uniform float uRadius;
    uniform float uCoreWidth;
    uniform float uFalloffWidth;
    uniform float uCoreOpacity;
    uniform float uFalloffOpacity;

    varying vec3 vLocalPos;

    void main() {
        float r = length(vLocalPos.xy);

        // Screen-space derivative (computed before abs for accuracy)
        float fw = fwidth(r);

        float sd = r - uRadius;
        float d = abs(sd);

        // Anti-aliased core: ensure at least 1px wide
        float coreHalf = max(uCoreWidth, fw * 0.75);
        float coreAlpha = 1.0 - smoothstep(coreHalf - fw, coreHalf + fw, d);

        float falloffAlpha = exp(-d * d / (uFalloffWidth * uFalloffWidth * 0.5));

        float alpha = coreAlpha * uCoreOpacity + falloffAlpha * uFalloffOpacity * (1.0 - coreAlpha);

        gl_FragColor = vec4(uColor, alpha);
    }
`;

interface OrbitProps {
  center: [number, number, number];
  celestialPosition: [number, number, number];
  coreOpacity?: number;
  falloffOpacity?: number;
  beginFade?: number;
  endFade?: number;
}

export function Orbit({
  center,
  celestialPosition,
  coreOpacity = 0.8,
  falloffOpacity = 0.5,
  beginFade = 10000000,
  endFade = 100000,
}: OrbitProps) {
  const { radius, quaternion, falloffWidth, coreWidth } = useMemo(() => {
    const centerPos = new THREE.Vector3(center[0], center[1], center[2]);
    const celestialPos = new THREE.Vector3(
      celestialPosition[0],
      celestialPosition[1],
      celestialPosition[2],
    );

    const dir = new THREE.Vector3().subVectors(celestialPos, centerPos);
    const radius = dir.length();

    dir.normalize();

    const fwd = new THREE.Vector3(-1, 0, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(fwd, dir);

    const ringOrientation = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(-1, 0, 0),
      Math.PI / 2,
    );

    quaternion.multiply(ringOrientation);

    const falloffWidth = radius / 200;
    const coreWidth = falloffWidth / 1000;

    return { radius, quaternion, falloffWidth, coreWidth };
  }, [center, celestialPosition]);

  const meshRef = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.ShaderMaterial>(null!);

  useFrame(({ camera }) => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;

    mesh.updateWorldMatrix(true, false);
    _invMatrix.copy(mesh.matrixWorld).invert();
    _camLocal.copy(camera.position).applyMatrix4(_invMatrix);

    const rho = Math.hypot(_camLocal.x, _camLocal.y);
    const dRadial = rho - radius;
    const dPlane = _camLocal.z;

    const dist = Math.hypot(dRadial, dPlane);

    const fade = THREE.MathUtils.smoothstep(dist, endFade, beginFade);

    mat.uniforms.uCoreOpacity.value = coreOpacity * fade;
    mat.uniforms.uFalloffOpacity.value = falloffOpacity * fade;
  });

  return (
    <mesh
      ref={meshRef}
      position={center}
      quaternion={quaternion}
      renderOrder={0}
    >
      <ringGeometry
        args={[radius - falloffWidth, radius + falloffWidth, 256]}
      />
      <shaderMaterial
        ref={matRef}
        uniforms={{
          uColor: { value: new THREE.Color(SCENE.HIGHLIGHT) },
          uRadius: { value: radius },
          uCoreWidth: { value: coreWidth },
          uFalloffWidth: { value: falloffWidth },
          uCoreOpacity: { value: coreOpacity },
          uFalloffOpacity: { value: falloffOpacity },
        }}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.NormalBlending}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  );
}
