import * as THREE from "three";
import {
  R_IU,
  R2_IU,
  INSENSITIVITY,
  DEPTH_SCALE,
  OWNERSHIP_GRID_SIZE,
  VALIDINF,
} from "@/lib/sov/kernel";
import { OwnershipGrid } from "@/lib/sov/blobs";
import { FieldRegion } from "./field-region";

const DISC_SEGMENTS = 24;

export interface FieldSource {
  systemIndex: number;
  groupIndex: number;
  weight: number;
}

export function ownershipGridDims(
  worldW: number,
  worldH: number,
): { owW: number; owH: number; cellWorld: number } {
  const cellWorld = Math.max(worldW, worldH) / OWNERSHIP_GRID_SIZE;
  return {
    owW: Math.max(1, Math.round(worldW / cellWorld)),
    owH: Math.max(1, Math.round(worldH / cellWorld)),
    cellWorld,
  };
}

function unitDiscGeometry(): THREE.InstancedBufferGeometry {
  const verts: number[] = [];
  for (let i = 0; i < DISC_SEGMENTS; i++) {
    const a0 = (i / DISC_SEGMENTS) * Math.PI * 2;
    const a1 = ((i + 1) / DISC_SEGMENTS) * Math.PI * 2;
    verts.push(0, 0, Math.cos(a0), Math.sin(a0), Math.cos(a1), Math.sin(a1));
  }
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 2));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4);
  return geo;
}

const discVertex = `
    precision highp float;
    uniform vec4 uRegion;      // (minX, minY, maxX, maxY) world
    uniform float uRadius;     // R · U (world units)
    uniform float uOwner;      // active owner index
    in vec2 position;          // unit-disc vertex
    in vec2 aCenter;           // instance center (world)
    in float aWeight;
    in float aOwner;
    out vec2 vWorld;
    out vec2 vCenter;
    out float vWeight;
    void main() {
        if (abs(aOwner - uOwner) > 0.5) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        vCenter = aCenter;
        vWorld = aCenter + position * uRadius;
        vWeight = aWeight;
        vec2 ndc = (vWorld - uRegion.xy) / (uRegion.zw - uRegion.xy) * 2.0 - 1.0;
        gl_Position = vec4(ndc, 0.0, 1.0);
    }
`;

const discFragment = `
    precision highp float;
    uniform float uU2;         // U² (AU²/iu²)
    in vec2 vWorld;
    in vec2 vCenter;
    in float vWeight;
    out vec4 fragColor;
    void main() {
        vec2 d = vWorld - vCenter;            // AU
        float d2iu = dot(d, d) / uU2;         // iu²
        if (d2iu > ${R2_IU.toFixed(1)}) discard;
        fragColor = vec4(vWeight / (${INSENSITIVITY.toFixed(1)} + d2iu), 0.0, 0.0, 1.0);
    }
`;

const argmaxFragment = `
    precision highp float;
    uniform sampler2D uAccum;
    uniform float uOwner;
    in vec2 vUv;
    out vec4 fragColor;
    void main() {
        float v = texture(uAccum, vUv).r;
        gl_FragDepth = clamp(1.0 - v / ${DEPTH_SCALE.toFixed(1)}, 0.0, 1.0);
        fragColor = vec4(v, uOwner, 0.0, 1.0);
    }
`;

const ownershipFragment = `
    precision highp float;
    uniform sampler2D uBest;
    in vec2 vUv;
    out vec4 fragColor;
    void main() {
        vec2 b = texture(uBest, vUv).rg;
        if (b.r < ${VALIDINF.toFixed(4)}) { fragColor = vec4(0.0); return; }
        fragColor = vec4(b.g / 255.0, 1.0, 0.0, 1.0);
    }
`;

const fullscreenVertex = `
    precision highp float;
    in vec2 position;
    out vec2 vUv;
    void main() {
        vUv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
    }
`;

export class FieldRenderer {
  private gl: THREE.WebGLRenderer;
  private accum: THREE.WebGLRenderTarget;
  private best: THREE.WebGLRenderTarget;
  private ownershipRT: THREE.WebGLRenderTarget | null = null;
  private discGeo: THREE.InstancedBufferGeometry;
  private discMat: THREE.ShaderMaterial;
  private argmaxMat: THREE.ShaderMaterial;
  private ownershipMat: THREE.ShaderMaterial;
  private fsGeo: THREE.BufferGeometry;
  private fsCamera: THREE.OrthographicCamera;
  private fsScene: THREE.Scene;
  private fsMesh: THREE.Mesh;
  private discScene: THREE.Scene;
  private discMesh: THREE.Mesh;
  private aCenter!: THREE.InstancedBufferAttribute;
  private aWeight!: THREE.InstancedBufferAttribute;
  private aOwner!: THREE.InstancedBufferAttribute;
  private groupCount = 0;
  private targetW = 0;
  private targetH = 0;
  private owW = 0;
  private owH = 0;
  private sources: FieldSource[] = [];

  constructor(gl: THREE.WebGLRenderer) {
    this.gl = gl;

    const half = { type: THREE.HalfFloatType };
    this.accum = new THREE.WebGLRenderTarget(1, 1, {
      format: THREE.RedFormat,
      ...half,
      depthBuffer: false,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
    });
    this.best = new THREE.WebGLRenderTarget(1, 1, {
      format: THREE.RGFormat,
      ...half,
      depthBuffer: true,
      stencilBuffer: false,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
    });
    this.discGeo = unitDiscGeometry();
    this.discMat = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms: {
        uRegion: { value: new THREE.Vector4() },
        uRadius: { value: 0 },
        uOwner: { value: 0 },
        uU2: { value: 1 },
      },
      vertexShader: discVertex,
      fragmentShader: discFragment,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      transparent: true,
    });
    this.discScene = new THREE.Scene();
    this.discMesh = new THREE.Mesh(this.discGeo, this.discMat);
    this.discMesh.frustumCulled = false;
    this.discScene.add(this.discMesh);

    this.fsGeo = new THREE.BufferGeometry();
    this.fsGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute([-1, -1, 3, -1, -1, 3], 2),
    );
    this.fsGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4);
    this.fsCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.argmaxMat = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms: { uAccum: { value: this.accum.texture }, uOwner: { value: 0 } },
      vertexShader: fullscreenVertex,
      fragmentShader: argmaxFragment,
      depthTest: true,
      depthWrite: true,
      transparent: false,
    });
    this.ownershipMat = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms: { uBest: { value: this.best.texture } },
      vertexShader: fullscreenVertex,
      fragmentShader: ownershipFragment,
      depthTest: false,
      depthWrite: false,
    });

    this.fsScene = new THREE.Scene();
    this.fsMesh = new THREE.Mesh(this.fsGeo, this.argmaxMat);
    this.fsMesh.frustumCulled = false;
    this.fsScene.add(this.fsMesh);
  }

  setData(
    sources: FieldSource[],
    positionsWorld: Float32Array,
    groupCount: number,
  ): void {
    if (groupCount > 255) {
      console.warn(
        `[field] ${groupCount} groups exceeds the 255 ownership-grid cap; readOwnership may mislabel groups beyond 255`,
      );
    }
    this.sources = sources;
    this.groupCount = groupCount;
    const n = sources.length;
    const order = [...sources.keys()].sort(
      (a, b) => sources[a].groupIndex - sources[b].groupIndex,
    );
    const centers = new Float32Array(n * 2);
    const weights = new Float32Array(n);
    const owners = new Float32Array(n);
    for (let k = 0; k < n; k++) {
      const s = sources[order[k]];
      centers[k * 2] = positionsWorld[s.systemIndex * 2];
      centers[k * 2 + 1] = positionsWorld[s.systemIndex * 2 + 1];
      weights[k] = s.weight;
      owners[k] = s.groupIndex;
    }
    this.sortedOrder = order;
    this.aCenter = new THREE.InstancedBufferAttribute(centers, 2);
    this.aWeight = new THREE.InstancedBufferAttribute(weights, 1);
    this.aOwner = new THREE.InstancedBufferAttribute(owners, 1);
    this.discGeo.setAttribute("aCenter", this.aCenter);
    this.discGeo.setAttribute("aWeight", this.aWeight);
    this.discGeo.setAttribute("aOwner", this.aOwner);
    this.discGeo.instanceCount = n;
  }

  private sortedOrder: number[] = [];

  updateCentersFrom(positionsWorld: Float32Array): void {
    if (!this.aCenter) return;
    const arr = this.aCenter.array as Float32Array;
    for (let k = 0; k < this.sortedOrder.length; k++) {
      const s = this.sources[this.sortedOrder[k]];
      arr[k * 2] = positionsWorld[s.systemIndex * 2];
      arr[k * 2 + 1] = positionsWorld[s.systemIndex * 2 + 1];
    }
    this.aCenter.needsUpdate = true;
  }

  getBestTexture(): THREE.Texture {
    return this.best.texture;
  }

  render(
    region: FieldRegion,
    uPerIu: number,
    targetW: number,
    targetH: number,
  ): void {
    if (targetW !== this.targetW || targetH !== this.targetH) {
      this.accum.setSize(targetW, targetH);
      this.best.setSize(targetW, targetH);
      this.targetW = targetW;
      this.targetH = targetH;
    }

    const gl = this.gl;
    const prevTarget = gl.getRenderTarget();
    const prevAutoClear = gl.autoClear;
    const prevClearColor = new THREE.Color();
    gl.getClearColor(prevClearColor);
    const prevClearAlpha = gl.getClearAlpha();
    gl.autoClear = false;

    this.discMat.uniforms.uRegion.value.set(
      region.minX,
      region.minY,
      region.maxX,
      region.maxY,
    );
    this.discMat.uniforms.uRadius.value = R_IU * uPerIu;
    this.discMat.uniforms.uU2.value = uPerIu * uPerIu;

    gl.setRenderTarget(this.best);
    gl.setClearColor(0x000000, 0);
    gl.clearColor();
    gl.clearDepth();

    for (let g = 0; g < this.groupCount; g++) {
      this.discMat.uniforms.uOwner.value = g;
      gl.setRenderTarget(this.accum);
      gl.clearColor();
      gl.render(this.discScene, this.fsCamera);

      this.argmaxMat.uniforms.uOwner.value = g;
      gl.setRenderTarget(this.best);
      this.renderFullscreen(this.argmaxMat);
    }

    gl.setRenderTarget(prevTarget);
    gl.autoClear = prevAutoClear;
    gl.setClearColor(prevClearColor, prevClearAlpha);
  }

  readOwnership(region: FieldRegion, uPerIu: number): OwnershipGrid {
    const gl = this.gl;
    const worldW = region.maxX - region.minX;
    const worldH = region.maxY - region.minY;
    const { owW, owH, cellWorld } = ownershipGridDims(worldW, worldH);
    if (!this.ownershipRT) {
      this.ownershipRT = new THREE.WebGLRenderTarget(owW, owH, {
        format: THREE.RGBAFormat,
        type: THREE.UnsignedByteType,
        depthBuffer: false,
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
      });
    } else if (owW !== this.owW || owH !== this.owH) {
      this.ownershipRT.setSize(owW, owH);
    }
    this.owW = owW;
    this.owH = owH;

    const prevTarget = gl.getRenderTarget();
    const prevAutoClear = gl.autoClear;
    const prevClearColor = new THREE.Color();
    gl.getClearColor(prevClearColor);
    const prevClearAlpha = gl.getClearAlpha();
    gl.autoClear = false;

    gl.setRenderTarget(this.ownershipRT);
    gl.setClearColor(0x000000, 0);
    gl.clearColor();
    this.renderFullscreen(this.ownershipMat);
    const px = new Uint8Array(owW * owH * 4);
    gl.readRenderTargetPixels(this.ownershipRT, 0, 0, owW, owH, px);

    gl.setRenderTarget(prevTarget);
    gl.autoClear = prevAutoClear;
    gl.setClearColor(prevClearColor, prevClearAlpha);

    return this.toOwnershipGrid(px, region, uPerIu, owW, owH, cellWorld);
  }

  private renderFullscreen(mat: THREE.ShaderMaterial): void {
    this.fsMesh.material = mat;
    this.gl.render(this.fsScene, this.fsCamera);
  }

  private toOwnershipGrid(
    px: Uint8Array,
    region: FieldRegion,
    uPerIu: number,
    owW: number,
    owH: number,
    cellWorld: number,
  ): OwnershipGrid {
    const owner = new Int32Array(owW * owH).fill(-1);
    for (let y = 0; y < owH; y++) {
      for (let x = 0; x < owW; x++) {
        const i = (y * owW + x) * 4;
        if (px[i + 1] > 0) owner[y * owW + x] = px[i];
      }
    }
    const cellIu = cellWorld / uPerIu;
    return {
      width: owW,
      height: owH,
      owner,
      originIuX: (region.minX + cellWorld * 0.5) / uPerIu,
      originIuY: (region.minY + cellWorld * 0.5) / uPerIu,
      cellIu,
    };
  }

  dispose(): void {
    this.accum.dispose();
    this.best.dispose();
    this.ownershipRT?.dispose();
    this.discGeo.dispose();
    this.discMat.dispose();
    this.argmaxMat.dispose();
    this.ownershipMat.dispose();
    this.fsGeo.dispose();
  }
}
