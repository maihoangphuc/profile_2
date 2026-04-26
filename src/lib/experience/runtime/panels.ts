import * as THREE from "three";
import { EVENTS, N, PH, PW } from "@/constants/experience";
import { readRootCssVar } from "@/utils/rootCssColor";
import { canvasFont } from "@/lib/experience/runtime/ui";

const panelVS = `
      varying vec2 vUv;
      uniform float uCurvature;
      uniform float uStretch;
      uniform float uAspect;
      uniform float uHover;
      uniform float uTime;

      void main(){
        vUv = uv;
        vec3 pos = position;

        float curv = uCurvature * 0.8;
        if(abs(curv) > 0.0001){
          float r = 1.0 / curv;
          float theta = pos.x * curv;
          pos.x = r * sin(theta);
          pos.z -= (r - r * cos(theta));
        }

        if(abs(uStretch) > 0.0001){
          float t = uv.y - 0.5;
          float shear = t * uStretch;
          pos.x += shear * uAspect * 0.23;
        }

        if (uHover > 0.0) {
           pos.z += sin(pos.x * 12.0 + pos.y * 12.0 + uTime * 6.0) * 0.06 * uHover;
        }

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;

const panelFS = `
      varying vec2 vUv;
      uniform sampler2D uMap;
      uniform float uOpacity;
      uniform float uHover;
      void main(){
        vec4 tex = texture2D(uMap, vUv);
        if(tex.a < 0.05) discard;
        vec3 gray = vec3(dot(tex.rgb, vec3(0.299, 0.587, 0.114)));
        vec3 col = mix(gray, vec3(tex.rgb), uHover);
        gl_FragColor = vec4(col, tex.a * uOpacity);
      }
    `;

export type PanelData = {
  mesh: THREE.Mesh;
  capMesh: THREE.Mesh;
  mat: THREE.ShaderMaterial;
  capMat: THREE.ShaderMaterial;
  pivot: THREE.Group;
  hoverVal?: number;
  targetHover?: number;
};

export function buildPanels(scene: THREE.Scene) {
  const panels: PanelData[] = [];
  const texLoader = new THREE.TextureLoader();
  texLoader.crossOrigin = "Anonymous";
  const gTextures: THREE.Texture[] = [];
  for (let i = 0; i < N; i++) {
    gTextures.push(texLoader.load(`https://picsum.photos/seed/${i + 142}/800/533`));
  }
  const sharedGeo = new THREE.PlaneGeometry(PW, PH, 32, 24);
  const capGeo = new THREE.PlaneGeometry(PW, PH, 32, 24);
  capGeo.translate(-0.72, 0, 0);

  for (let i = 0; i < N; i++) {
    const ev = EVENTS[i % EVENTS.length];
    const capCanvas = document.createElement("canvas");
    capCanvas.width = 1600;
    capCanvas.height = 1000;
    const ctx = capCanvas.getContext("2d");
    if (!ctx) continue;
    ctx.clearRect(0, 0, 1600, 1000);
    ctx.fillStyle = readRootCssVar("--color-web-line-strong");
    ctx.font = canvasFont(36, "bold");
    ctx.fillText(ev.tag.toUpperCase(), 40, 520);

    ctx.fillStyle = readRootCssVar("--color-web-white");
    ctx.font = canvasFont(100, "bold");
    ev.body.split("\n").forEach((line, idx) => ctx.fillText(line, 40, 640 + idx * 110));
    const capTex = new THREE.CanvasTexture(capCanvas);

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: gTextures[i] },
        uCurvature: { value: 0 },
        uOpacity: { value: 1 },
        uStretch: { value: 0 },
        uAspect: { value: PW / PH },
        uHover: { value: 0 },
        uTime: { value: 0 },
      },
      vertexShader: panelVS,
      fragmentShader: panelFS,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });

    const capMat = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: capTex },
        uCurvature: { value: 0 },
        uOpacity: { value: 1 },
        uStretch: { value: 0 },
        uAspect: { value: PW / PH },
        uHover: { value: 0 },
        uTime: { value: 0 },
      },
      vertexShader: panelVS,
      fragmentShader: `
              varying vec2 vUv;
              uniform sampler2D uMap;
              uniform float uOpacity;
              void main(){
                vec4 tex = texture2D(uMap, vUv);
                if(tex.a < 0.05) discard;
                gl_FragColor = vec4(tex.rgb, tex.a * uOpacity);
              }
            `,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });

    const mesh = new THREE.Mesh(sharedGeo, mat);
    mesh.renderOrder = 0;
    const capMesh = new THREE.Mesh(capGeo, capMat);
    capMesh.renderOrder = 2;
    capMesh.position.z = 0.04;
    const pivot = new THREE.Group();
    pivot.add(mesh);
    pivot.add(capMesh);
    scene.add(pivot);
    panels.push({ mesh, mat, capMesh, capMat, pivot });
  }
  return panels;
}
