import * as THREE from "three";
import { BG_FS, BG_VS } from "@/lib/experience/background/shaders";

export type GretaBackground = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  material: THREE.ShaderMaterial;
  resize: () => void;
  render: () => void;
};

export function initGretaBackground(
  canvas: HTMLCanvasElement,
): GretaBackground {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    45,
    innerWidth / innerHeight,
    0.1,
    100,
  );
  camera.position.set(0, 0, 5);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;

  // r128 index.html treated these hexes like raw RGB in the shader; modern Color(hex) decodes
  // sRGB → linear and reads darker. LinearSRGBColorSpace keeps byte ratios as working-space RGB.
  const uColorBackground = new THREE.Color().setHex(
    0x352d40,
    THREE.LinearSRGBColorSpace,
  );
  const uColorHighlight = new THREE.Color().setHex(
    0xc4a8e8,
    THREE.LinearSRGBColorSpace,
  );
  renderer.setClearColor(uColorBackground, 1);

  const material = new THREE.ShaderMaterial({
    vertexShader: BG_VS,
    fragmentShader: BG_FS,
    uniforms: {
      uOpacity: { value: 1 },
      uColorBackground: { value: uColorBackground },
      uColorHighlight: { value: uColorHighlight },
      uSize: { value: new THREE.Vector2(0.1, 0.1) },
      uIntensity: { value: 0.5 },
      uOffsetX: { value: 0 },
    },
    depthTest: false,
    depthWrite: false,
    side: THREE.BackSide,
    // Same colors as index.html; avoid extra tone mapping so the noise + purple match the static page.
    toneMapped: false,
  });

  const geo = new THREE.SphereGeometry(10, 64, 64);
  const mesh = new THREE.Mesh(geo, material);
  mesh.rotation.set(1.27, 1.9, 0);
  scene.add(mesh);

  const resize = () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  };

  const render = () => renderer.render(scene, camera);

  return { scene, camera, renderer, material, resize, render };
}
