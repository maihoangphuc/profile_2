import * as THREE from "three";
import { rootCssVarToHexInt } from "@/utils/rootCssColor";

export const clayMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  roughness: 0.95,
  metalness: 0.0,
  reflectivity: 0.5,
  envMapIntensity: 0.65,
  clearcoat: 0.0,
});

const CLAY_DIFFUSE_WRAP = 0.5;
const clayDiffuseWrapScale = (1 + CLAY_DIFFUSE_WRAP).toFixed(2);
clayMaterial.onBeforeCompile = (shader) => {
  const needle =
    "const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {\n\tfloat dotNL = saturate( dot( geometryNormal, directLight.direction ) );";
  const wrapped = `const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {\n\tfloat dotNL = saturate( ( dot( geometryNormal, directLight.direction ) + ${CLAY_DIFFUSE_WRAP.toFixed(2)} ) / ${clayDiffuseWrapScale} );`;
  if (!shader.fragmentShader.includes(needle)) return;
  shader.fragmentShader = shader.fragmentShader.replace(needle, wrapped);
};
clayMaterial.customProgramCacheKey = () => `clay-wrap-${CLAY_DIFFUSE_WRAP}`;

export function syncClayMaterialColorFromCss() {
  const hex =
    rootCssVarToHexInt("--color-web-scene-neutral") ||
    rootCssVarToHexInt("--palette-web-scene-neutral");
  if (hex !== 0) clayMaterial.color.setHex(hex);
}

export async function loadModels(
  scene: THREE.Scene,
  onProgress: (pct: number) => void,
) {
  const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");

  const loader = new GLTFLoader();

  loader.register((parser) => {
    const tl = new THREE.TextureLoader(parser.options.manager);
    tl.setCrossOrigin(parser.options.crossOrigin);
    tl.setRequestHeader(parser.options.requestHeader);
    parser.textureLoader = tl;
    return { name: "EXPERIENCE_texture_loader_compat" };
  });

  const glbUrls = ["/3d.glb", "/rock.glb"] as const;
  type GlbUrl = (typeof glbUrls)[number];
  const fileProgress: Partial<Record<GlbUrl, { loaded: number; total: number }>> = {};

  const getTargetPct = () => {
    let sumLoaded = 0;
    let sumTotal = 0;
    let anyWithoutTotal = false;
    for (const u of glbUrls) {
      const p = fileProgress[u];
      if (!p) continue;
      if (p.total > 0) {
        sumLoaded += p.loaded;
        sumTotal += p.total;
      } else if (p.loaded > 0) {
        anyWithoutTotal = true;
      }
    }
    if (sumTotal > 0) return Math.min(99, (sumLoaded / sumTotal) * 100);
    if (anyWithoutTotal) {
      const started = glbUrls.filter((u) => fileProgress[u] && fileProgress[u]!.loaded > 0).length;
      return Math.min(99, (started / glbUrls.length) * 55);
    }
    return 0;
  };

  const loadGLB = (url: GlbUrl) =>
    new Promise<import("three/examples/jsm/loaders/GLTFLoader.js").GLTF>((resolve, reject) => {
      loader.load(
        url,
        (gltf) => {
          const prev = fileProgress[url];
          fileProgress[url] = {
            loaded: prev?.total && prev.total > 0 ? prev.total : 1,
            total: prev?.total && prev.total > 0 ? prev.total : 1,
          };
          onProgress(getTargetPct());
          resolve(gltf);
        },
        (xhr) => {
          const total = xhr.lengthComputable ? xhr.total : 0;
          fileProgress[url] = { loaded: xhr.loaded, total };
          onProgress(getTargetPct());
        },
        reject,
      );
    });

  const [figure, rock] = await Promise.all([loadGLB("/3d.glb"), loadGLB("/rock.glb")]);

  onProgress(99);
  syncClayMaterialColorFromCss();

  const group = new THREE.Group();
  figure.scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.material = clayMaterial;
      mesh.castShadow = true;
      mesh.receiveShadow = false;
    }
  });
  figure.scene.scale.setScalar(2.5);
  figure.scene.position.y = 0.4;
  group.add(figure.scene);

  rock.scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
  });
  rock.scene.scale.setScalar(3.9);
  rock.scene.position.y = -1.5;
  group.add(rock.scene);

  group.position.set(0, -0.8, 0);
  group.scale.setScalar(2.6);
  scene.add(group);

  return group;
}
