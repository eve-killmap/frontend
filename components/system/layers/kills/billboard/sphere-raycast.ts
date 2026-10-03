import * as THREE from "three";

export function installSphereRaycast(
  mesh: THREE.InstancedMesh,
  getOrigin?: () => readonly number[] | number[],
  onHit?: (wx: number, wy: number, wz: number) => void,
): void {
  const hitPoint = new THREE.Vector3();
  let lastRayMs = 0;
  let lastRayInstanceId = -1;
  let lastRayDist = 0;

  mesh.raycast = function (raycaster, intersects) {
    if (this.count === 0) return;
    const now = performance.now();

    if (now - lastRayMs < 16) {
      if (lastRayInstanceId >= 0) {
        intersects.push({
          distance: lastRayDist,
          point: raycaster.ray.at(lastRayDist, hitPoint).clone(),
          object: this,
          instanceId: lastRayInstanceId,
        } as THREE.Intersection);
      }
      return;
    }
    lastRayMs = now;
    lastRayInstanceId = -1;

    const buf = this.instanceMatrix.array as Float32Array;
    const ro = raycaster.ray.origin;
    const rd = raycaster.ray.direction;
    const origin = getOrigin ? getOrigin() : null;

    for (let i = 0; i < this.count; i++) {
      const base = i * 16;
      const scale = buf[base];
      if (scale <= 0) continue;

      const cx = buf[base + 12] - ro.x;
      const cy = buf[base + 13] - ro.y;
      const cz = buf[base + 14] - ro.z;
      const tca = cx * rd.x + cy * rd.y + cz * rd.z;
      if (tca < 0) continue;
      const r = scale * 2;
      const d2 = cx * cx + cy * cy + cz * cz - tca * tca;
      if (d2 > r * r) continue;

      const thc = Math.sqrt(r * r - d2);
      const t0 = tca - thc;
      lastRayDist = t0 >= 0 ? t0 : tca + thc;
      lastRayInstanceId = i;
      if (origin && onHit) {
        onHit(
          buf[base + 12] + origin[0],
          buf[base + 13] + origin[1],
          buf[base + 14] + origin[2],
        );
      }
      intersects.push({
        distance: lastRayDist,
        point: raycaster.ray.at(lastRayDist, hitPoint).clone(),
        object: this,
        instanceId: i,
      } as THREE.Intersection);
      return;
    }
  };
}
