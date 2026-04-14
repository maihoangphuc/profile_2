import * as THREE from "three";
import { initGretaBackground } from "@/lib/experience/background/background";
import { C, EVENTS, MONTHS, N, PH, PW } from "@/constants/experience";
import { lerp, lerpPath } from "@/lib/experience/math";
import {
  readRootCssVar,
  rootCssVarToHexInt,
  rootCssVarToRgba,
} from "@/utils/rootCssColor";

type Dom = {
  bg: HTMLCanvasElement;
  c: HTMLCanvasElement;
  particles: HTMLCanvasElement;
  modelLoadPct: HTMLElement;
  month: HTMLElement;
  monthGhost: HTMLElement;
  timeline: HTMLElement;
  tlProgress: HTMLElement;
  introLeft: HTMLElement;
  introRuleTrack: HTMLElement;
  introRight: HTMLElement;
  bgName: HTMLElement;
  soundBtn: HTMLElement;
  social: HTMLElement;
  sline: HTMLElement;
  exploreBtn: HTMLElement;
  brand: HTMLElement;
};

const APP_FONT_CSS_VAR = "--font-roboto";

function canvasFont(sizePx: number, weight: number | "bold" = 400): string {
  const stack = getComputedStyle(document.documentElement)
    .getPropertyValue(APP_FONT_CSS_VAR)
    .trim();
  const family = stack || "sans-serif";
  const w = weight === "bold" ? "bold" : String(weight);
  return `${w} ${sizePx}px ${family}`;
}

/** Gentle in/out (zero 1st & 2nd derivative at 0 and 1) for explore entry. */
function smootherstep01(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
}

/**
 * Góc tương đương 0 (k·2π) sao cho đích luôn lớn hơn start ít nhất một vòng
 * (xoay trái → phải).
 */
function exitRotationTargetAtLeastOneTurn(start: number): number {
  const TAU = Math.PI * 2;
  if (!Number.isFinite(start)) return TAU;
  // Lấy k nhỏ nhất sao cho k*TAU > start + TAU (tức là đích > start + một vòng)
  const k = Math.ceil((start + TAU) / TAU + 1e-9);
  return k * TAU;
}

function getDom(): Dom {
  const must = <T extends HTMLElement>(id: string) => {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Missing element #${id}`);
    return el as T;
  };

  return {
    bg: must<HTMLCanvasElement>("bg"),
    c: must<HTMLCanvasElement>("c"),
    particles: must<HTMLCanvasElement>("particles"),
    modelLoadPct: must("model-load-pct"),
    month: must("month-lbl"),
    monthGhost: must("month-lbl-ghost"),
    timeline: must("timeline"),
    tlProgress: must("tl-progress"),
    introLeft: must("intro-left"),
    introRuleTrack: must("intro-rule-track"),
    introRight: must("intro-right"),
    bgName: must("bg-name"),
    soundBtn: must("sound-btn"),
    social: must("social"),
    sline: must("sline"),
    exploreBtn: must("explore-btn"),
    brand: must("brand"),
  };
}

export function startExperience() {
  const dom = getDom();

  // Background
  const bg = initGretaBackground(dom.bg);

  // Particles (2D canvas)
  const pCanvas = dom.particles;
  const pCtxMaybe = pCanvas.getContext("2d");
  if (!pCtxMaybe) throw new Error("Missing particles 2d context");
  const pCtx = pCtxMaybe;
  let particles: Array<{
    x: number;
    y: number;
    r: number;
    vx: number;
    vy: number;
    op: number;
    seed: number;
  }> = [];

  function resizeParticles() {
    pCanvas.width = innerWidth;
    pCanvas.height = innerHeight;
  }
  function initParticles() {
    resizeParticles();
    particles = [];
    const count = Math.floor((innerWidth * innerHeight) / 15000);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * (innerWidth * 0.05) + 10;
      const isLeft = Math.random() > 0.5;
      particles.push({
        x: innerWidth / 2 + Math.cos(angle) * radius,
        y: innerHeight * 0.55 + (Math.random() - 0.5) * (innerHeight * 0.15),
        r: Math.random() * 0.5 + 0.2,
        vx: (isLeft ? -1 : 1) * (Math.random() * 0.3 + 0.05),
        vy: -Math.random() * 0.4 - 0.15,
        op: Math.random() * 0.5 + 0.1,
        seed: Math.random() * 100,
      });
    }
  }
  function drawParticles() {
    pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
    pCtx.save();
    pCtx.beginPath();
    pCtx.rect(0, 0, pCanvas.width, pCanvas.height - 60);
    pCtx.clip();
    for (const p of particles) {
      pCtx.beginPath();
      pCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      pCtx.fillStyle = rootCssVarToRgba("--color-web-accent", p.op);
      pCtx.fill();
      p.x += p.vx + Math.sin(p.y * 0.02 + p.seed) * 0.6;
      p.y += p.vy + Math.cos(p.x * 0.02 + p.seed) * 0.3;
      p.op -= 0.00015;
      if (p.y < pCanvas.height * 0.05) p.op -= 0.02;
      if (p.op <= 0 || p.y < -10 || p.x < -50 || p.x > pCanvas.width + 50) {
        p.y =
          pCanvas.height * 0.55 +
          (Math.random() - 0.5) * (pCanvas.height * 0.15);
        p.x =
          pCanvas.width / 2 + (Math.random() - 0.5) * (pCanvas.width * 0.15);
        p.op = Math.random() * 0.4 + 0.1;
        p.seed = Math.random() * 100;
      }
    }
    pCtx.restore();
  }

  // Three.js scene
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(
    50,
    innerWidth / innerHeight,
    0.1,
    80,
  );
  cam.position.set(0, 0.5, 11);
  const renderer = new THREE.WebGLRenderer({
    canvas: dom.c,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  scene.add(
    new THREE.AmbientLight(rootCssVarToHexInt("--color-web-white"), 0.3),
  );
  const sun = new THREE.DirectionalLight(
    rootCssVarToHexInt("--color-web-white"),
    1.2,
  );
  sun.position.set(5, 10, 7.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 30;
  sun.shadow.camera.left = -8;
  sun.shadow.camera.right = 8;
  sun.shadow.camera.top = 8;
  sun.shadow.camera.bottom = -8;
  scene.add(sun);
  const back = new THREE.DirectionalLight(
    rootCssVarToHexInt("--color-web-white"),
    0.6,
  );
  back.position.set(-5, 3, -5);
  scene.add(back);
  const rim1 = new THREE.DirectionalLight(
    rootCssVarToHexInt("--color-web-white"),
    1.5,
  );
  rim1.position.set(-10, 5, -10);
  scene.add(rim1);
  const rim2 = new THREE.DirectionalLight(
    rootCssVarToHexInt("--color-web-white"),
    1.0,
  );
  rim2.position.set(10, 5, -10);
  scene.add(rim2);

  // Models (concurrent)
  let figureGroup: THREE.Group | null = null;
  const clayMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.95,
    metalness: 0.0,
    reflectivity: 0.5,
    envMapIntensity: 0.65,
    clearcoat: 0.0,
  });
  // Merged body mesh: hem occludes direct light → a hard dark band on the pants (not fixable via shadow receive).
  // Wrapped diffuse lifts concave / grazing regions without changing lights for the rest of the scene.
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

  function syncClayMaterialColorFromCss() {
    const hex =
      rootCssVarToHexInt("--color-web-scene-neutral") ||
      rootCssVarToHexInt("--palette-web-scene-neutral");
    if (hex !== 0) clayMaterial.color.setHex(hex);
  }

  queueMicrotask(() => syncClayMaterialColorFromCss());

  let modelLoadTargetPct = 0;
  /** Ramps up toward xhr `modelLoadTargetPct` so big network jumps do not snap the UI. */
  let modelLoadRealFloor = 0;
  /** Soft follower: never below real xhr %, creeps up toward real+headroom so UI does not freeze. */
  let modelLoadCrawlPct = 0;
  let modelLoadDisplayPct = 0;
  let lastRenderedLoadPct = -1;
  let lastModelLoadUiMs = 0;

  async function loadModels() {
    const pctEl = dom.modelLoadPct;
    modelLoadTargetPct = 0;
    modelLoadRealFloor = 0;
    modelLoadCrawlPct = 0;
    modelLoadDisplayPct = 0;
    lastRenderedLoadPct = -1;
    lastModelLoadUiMs = performance.now();
    pctEl.textContent = "0";
    pctEl.classList.add("model-loading");

    const { GLTFLoader } =
      await import("three/examples/jsm/loaders/GLTFLoader.js");
    const loader = new GLTFLoader();
    // GLTFParser defaults to ImageBitmapLoader, which fetches blob: URLs from embedded
    // bufferViews; that can fail (console: "Couldn't load texture blob:..."). TextureLoader
    // decodes those blobs via Image instead, which is reliable for same-origin blob URLs.
    loader.register((parser) => {
      const tl = new THREE.TextureLoader(parser.options.manager);
      tl.setCrossOrigin(parser.options.crossOrigin);
      tl.setRequestHeader(parser.options.requestHeader);
      parser.textureLoader = tl;
      return { name: "EXPERIENCE_texture_loader_compat" };
    });

    const glbUrls = ["/3d.glb", "/rock.glb"] as const;
    type GlbUrl = (typeof glbUrls)[number];
    const fileProgress: Partial<
      Record<GlbUrl, { loaded: number; total: number }>
    > = {};

    const refreshModelLoadTarget = () => {
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
      let next: number;
      if (sumTotal > 0) {
        next = Math.min(99, (sumLoaded / sumTotal) * 100);
      } else if (anyWithoutTotal) {
        const started = glbUrls.filter(
          (u) => fileProgress[u] && fileProgress[u]!.loaded > 0,
        ).length;
        next = Math.min(99, (started / glbUrls.length) * 55);
      } else {
        next = 0;
      }
      modelLoadTargetPct = Math.max(modelLoadTargetPct, next);
    };

    const loadGLB = (url: GlbUrl) =>
      new Promise<import("three/examples/jsm/loaders/GLTFLoader.js").GLTF>(
        (resolve, reject) => {
          loader.load(
            url,
            (gltf) => {
              const prev = fileProgress[url];
              fileProgress[url] = {
                loaded: prev?.total && prev.total > 0 ? prev.total : 1,
                total: prev?.total && prev.total > 0 ? prev.total : 1,
              };
              refreshModelLoadTarget();
              resolve(gltf);
            },
            (xhr) => {
              const total = xhr.lengthComputable ? xhr.total : 0;
              fileProgress[url] = { loaded: xhr.loaded, total };
              refreshModelLoadTarget();
            },
            reject,
          );
        },
      );

    const [figure, rock] = await Promise.all([
      loadGLB("/3d.glb"),
      loadGLB("/rock.glb"),
    ]);

    modelLoadTargetPct = Math.max(modelLoadTargetPct, 99);

    syncClayMaterialColorFromCss();

    const group = new THREE.Group();

    figure.scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = clayMaterial;
        mesh.castShadow = true;
        // One merged body mesh: shadow-map receive draws a hard hem line on the pants. Skip receive
        // on the figure only; sun shading (N·L) still models form, and the rock still gets the cast.
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
    figureGroup = group;
  }

  // Panels/shaders (kept here for now; will continue splitting in follow-up passes)
  const panels: Array<{
    mesh: THREE.Mesh;
    capMesh: THREE.Mesh;
    mat: THREE.ShaderMaterial;
    capMat: THREE.ShaderMaterial;
    pivot: THREE.Group;
    hoverVal?: number;
    targetHover?: number;
  }> = [];

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

  function buildPanels() {
    const texLoader = new THREE.TextureLoader();
    texLoader.crossOrigin = "Anonymous";
    const gTextures: THREE.Texture[] = [];
    for (let i = 0; i < N; i++) {
      gTextures.push(
        texLoader.load(`https://picsum.photos/seed/${i + 142}/800/533`),
      );
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
      ev.body
        .split("\n")
        .forEach((line, idx) => ctx.fillText(line, 40, 640 + idx * 110));
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
  }

  // Input/events
  let isDragging = false;
  let lastX = 0;
  let introActive = true;
  /** First reveal after loading: spin figure one turn, then show intro lines. */
  let startupIntroSpinActive = false;
  let startupIntroSpinStartMs = 0;
  const STARTUP_INTRO_SPIN_MS = 6800;
  const STARTUP_INTRO_MODEL_SCALE_FROM = 1.75;
  const STARTUP_INTRO_MODEL_Y_FROM = -1.24;
  const STARTUP_INTRO_MODEL_Z_FROM = -1.35;
  /** True while the post-explore entrance animation is running. */
  let experienceEntryActive = false;
  let experienceEntryStartMs = 0;
  const EXPERIENCE_ENTRY_MS = 2650;
  /** After Explore: timeline/year/month only after entry motion (~{@link EXPERIENCE_ENTRY_MS}). */
  let timelineDatesVisible = false;
  /** Virtual scroll endpoints for the “scroll up into place” panel motion. */
  let entryScrollFrom = 0;
  let entryScrollTo = 0;
  let isPaused = false;
  let scrolled = false;
  let scrollCurrent = 0;
  let scrollTarget = 0;
  let scrollVel = 0;
  let scrollVelVis = 0;
  let figRotY = 0;
  let figScale = 2.6;
  let figPosY = -0.8;

  let lastMonthIndex: number | null = null;
  let lastFiForMonth: number | null = null;
  let pendingMonthIndex: number | null = null;
  let pendingFiForMonth: number | null = null;
  let nextMonthSwitchAt = 0;
  const MONTH_SWITCH_COOLDOWN_MS = 620;

  /** Brand → intro: carousel + figure exit before UI returns. */
  let experienceExitActive = false;
  let experienceExitStartMs = 0;
  /** Kể cả đã scroll hay chưa — panel âm + model về intro chạy song song, chậm mượt. */
  const EXPERIENCE_EXIT_MS = 2650;
  /** Always scroll panels at least this many units into negative. */
  const EXPERIENCE_EXIT_MIN_SCROLL_TRAVEL = 5;
  /** Max negative scroll (index space) — đảm bảo panel ra khỏi màn hình. */
  const EXPERIENCE_EXIT_SCROLL_DEEP_CAP = -12;
  /** Scroll: tới undershoot âm rồi về 0 (smootherstep — mượt đầu/cuối từng pha). */
  const EXPERIENCE_EXIT_UNDERSHOOT_SPLIT = 0.99;
  let exitScroll0 = 0;
  let exitFigRot0 = 0;
  /** Đích nội suy (≡ 0 mod 2π), quãng đường từ exitFigRot0 luôn ≥ một vòng. */
  let exitFigRot1 = 0;
  /** TH2: entry đang giữa chừng khi brand được nhấn — xoay nhẹ về intro không buộc 1 vòng. */
  let exitWasEntryMidSpin = false;
  /** Visual scroll mới nhất (kể cả entry lerp) — để capture đúng khi exit trigger. */
  let scrollForLayoutLast = 0;
  let exitFigPosY0 = -0.8;
  let exitFigScale0 = 2.6;
  /** BG yaw captured tại frame cuối trước exit — tránh giật do công thức entry ≠ exit. */
  let exitBgYaw0 = 0;
  let bgYawLast = 0;

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2(-10, -10);

  function positionSocialLine(target: HTMLElement, widthFactor = 1) {
    const x = target.offsetLeft;
    dom.sline.style.left = `${x}px`;
    dom.sline.style.width = "52px";
    dom.sline.style.transform = `scaleX(${widthFactor})`;
    dom.sline.style.opacity = "0.85";
  }

  function bindEvents() {
    const links = Array.from(dom.social.querySelectorAll<HTMLElement>(".soc"));
    const socDefault = dom.social.querySelector<HTMLElement>(
      '.soc[data-key="fb"]',
    );
    let activeSocialLink = socDefault ?? links[0];
    let introLineRevealTimer: number | undefined;
    /** `performance.now()` when intro-rule / explore / social line CSS run should finish. */
    let introLinesAnimEndMs = 0;
    let exploreCommitTimer: number | undefined;
    let exploreCommitPending = false;
    let timelineRevealTimer: number | undefined;
    function introLinesDurationMs() {
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue("--intro-lines-duration")
        .trim();
      const n = parseFloat(raw);
      if (!Number.isFinite(n)) return 2540;
      const ms = raw.endsWith("ms") ? Math.round(n) : Math.round(n * 1000);
      return ms + 40;
    }

    /** Intro rule + Explore underline + social line via GSAP */
    function runIntroPageLineEffects() {
      if (introLineRevealTimer !== undefined) {
        clearTimeout(introLineRevealTimer);
        introLineRevealTimer = undefined;
      }
      dom.introLeft.classList.remove("lines-animated");
      void dom.introLeft.offsetHeight;

      const wf = 0.6;
      let xFirst = 0;
      let xLastEdge = 0;

      if (links.length >= 2) {
        const first = links[0]!;
        const last = links[links.length - 1]!;
        activeSocialLink = first;
        xFirst = first.offsetLeft;
        xLastEdge = last.offsetLeft + last.offsetWidth;
      } else if (links.length === 1) {
        activeSocialLink = links[0]!;
        dom.sline.style.transition = "none";
        positionSocialLine(activeSocialLink, wf);
        void dom.sline.offsetHeight;
        dom.sline.style.transition = "";
      }

      const revealMs = introLinesDurationMs();
      introLinesAnimEndMs = performance.now() + revealMs;

      import("gsap").then(({ gsap }) => {
        const duration = revealMs / 1000;
        // 1. Math: Calculate total Intro Left sequence length for precise spin synchronization
        const wordsCount = dom.introLeft.querySelectorAll(".intro-word").length;
        const wordDur = 0.3;
        const wordStagger = 0.008;
        const wordsTotalSecs = wordDur + Math.max(0, wordsCount - 1) * wordStagger;

        const exploreChars = dom.exploreBtn.querySelectorAll(".explore-char");
        const charDur = duration * 0.25;
        const charStagger = duration * 0.035;
        const exploreTextTotalSecs = charDur + Math.max(0, exploreChars.length - 1) * charStagger;

        // Sequence: Rule Head (0.65) -> Words (total) -> Explore Line Tail (0.85)
        const sequenceLength = (duration * 0.65) + wordsTotalSecs + (duration * 0.85);

        let globalDelay = 0;
        if (startupIntroSpinActive) {
            // Delay Intro Left so it finishes EXACTLY with the 6800ms spin
            globalDelay = Math.max(0, (STARTUP_INTRO_SPIN_MS / 1000) - sequenceLength);
        }

        // 2. Timeline Trigger Points
        const t_ruleStart = globalDelay;
        const t_words = t_ruleStart + (duration * 0.65);
        const t_wordsEnd = t_words + wordsTotalSecs;
        const t_exploreLine = t_wordsEnd;
        const t_exploreLineEnd = t_exploreLine + (duration * 0.85);
        const t_exploreText = t_exploreLineEnd - exploreTextTotalSecs;

        // --- PREP PHASE: Set all zero-states BEFORE lifting CSS guards ---
        
        const introRule = document.getElementById("intro-rule");
        let tw = 0;
        if (introRule) {
            tw = dom.introRuleTrack.offsetWidth;
            gsap.killTweensOf(introRule);
            introRule.style.transition = "none";
            gsap.set(introRule, { left: 0, scaleX: 1, x: 0, width: tw, clipPath: "inset(0% 0% 0% 100%)" });
        }

        const exploreLine = document.getElementById("explore-underline");
        let exploreTotalW = 0;
        let exploreTargetW = 0;
        if (exploreLine) {
            exploreTargetW = exploreLine.offsetWidth;
            exploreTotalW = Math.max(dom.introLeft.offsetWidth / 2, exploreTargetW);
            gsap.killTweensOf(exploreLine);
            exploreLine.style.transition = "none";
            gsap.set(exploreLine, { left: "auto", right: 0, scaleX: 1, x: 0, width: exploreTotalW, clipPath: "inset(0% 100% 0% 0%)" });
        }

        let totalSpan = 0;
        let socTargetW = 0;
        if (links.length >= 2) {
          totalSpan = xLastEdge - xFirst;
          socTargetW = 52 * wf;
          gsap.killTweensOf(dom.sline);
          dom.sline.style.transition = "none"; 
          gsap.set(dom.sline, { left: xFirst, width: totalSpan, scaleX: 1, x: 0, opacity: 1, clipPath: "inset(0% 0% 0% 100%)" });
        }

        const rightText = document.getElementById("intro-right-text");
        if (rightText) gsap.set(rightText, { opacity: 0 });

        if (dom.bgName) gsap.set(dom.bgName, { opacity: 0 });
        
        const readMore = document.getElementById("read-more");
        if (readMore) gsap.set(readMore, { opacity: 0 });
        
        if (exploreChars.length > 0) gsap.set(exploreChars, { opacity: 0 });

        // --- REVEAL PHASE: Lift CSS guards now that inline styles are set ---
        
        dom.introLeft.classList.add("lines-animated");
        dom.introRight.classList.add("lines-animated");
        if (links.length >= 2) dom.social.classList.add("social-lines-animated");

        // --- ANIMATION PHASE ---

        // 1. Intro rule (Worm Chase)
        if (introRule) {
            const ruleProxy = { head: 100, tail: 0 };
            const finalTail = Math.max(0, 100 - (15 / tw) * 100);
            const tl_rule = gsap.timeline({
                delay: t_ruleStart,
                onComplete: () => {
                    gsap.set(introRule, { clearProps: "all" });
                    introRule.style.transition = "none";
                    void introRule.offsetHeight;
                    introRule.style.transition = "";
                }
            });
            tl_rule.to(ruleProxy, { head: 0, duration: duration * 0.65, ease: "power3.inOut", onUpdate: () => introRule.style.clipPath = `inset(0% ${ruleProxy.tail}% 0% ${ruleProxy.head}%)` }, 0)
                   .to(ruleProxy, { tail: finalTail, duration: duration * 0.55, ease: "power3.out", onUpdate: () => introRule.style.clipPath = `inset(0% ${ruleProxy.tail}% 0% ${ruleProxy.head}%)` }, duration * 0.3);
        }

        // 2. Explore underline (Worm Chase Left-to-Right)
        if (exploreLine) {
            const expProxy = { head: 100, tail: 0 };
            const finalTail = Math.max(0, 100 - (exploreTargetW / exploreTotalW) * 100);
            const tl_exp = gsap.timeline({ 
                delay: t_exploreLine,
                onComplete: () => {
                    gsap.set(exploreLine, { clearProps: "all" });
                    exploreLine.style.transition = "none";
                    void exploreLine.offsetHeight;
                    exploreLine.style.transition = "";
                }
            });
            tl_exp.to(expProxy, { head: 0, duration: duration * 0.65, ease: "power3.inOut", onUpdate: () => exploreLine.style.clipPath = `inset(0% ${expProxy.head}% 0% ${expProxy.tail}%)` }, 0)
                  .to(expProxy, { tail: finalTail, duration: duration * 0.55, ease: "power3.out", onUpdate: () => exploreLine.style.clipPath = `inset(0% ${expProxy.head}% 0% ${expProxy.tail}%)` }, duration * 0.3);
        }

        // 3. Social line (Worm Chase + Flash Fix)
        if (links.length >= 2) {
          const socProxy = { head: 100, tail: 0 };
          const finalTail = Math.max(0, 100 - (socTargetW / totalSpan) * 100);
          const tl_soc = gsap.timeline({
            onComplete: () => {
              gsap.set(dom.sline, { clearProps: "all" });
              dom.sline.style.transition = "none"; 
              if (activeSocialLink) positionSocialLine(activeSocialLink, wf);
              void dom.sline.offsetHeight;
              dom.sline.style.transition = ""; 
            }
          });
          
          tl_soc.to(socProxy, { head: 0, duration: duration * 0.65, ease: "power3.inOut", onUpdate: () => dom.sline.style.clipPath = `inset(0% ${socProxy.tail}% 0% ${socProxy.head}%)` }, 0)
                .to(socProxy, { tail: finalTail, duration: duration * 0.55, ease: "power3.out", onUpdate: () => dom.sline.style.clipPath = `inset(0% ${socProxy.tail}% 0% ${socProxy.head}%)` }, duration * 0.3);

          const socIcons = dom.social.querySelectorAll(".soc");
          if (socIcons.length > 0) {
            gsap.killTweensOf(socIcons);
            gsap.fromTo(socIcons, { opacity: 0 }, {
              opacity: 0.45,
              duration: 0.5,
              stagger: -0.15, // Reverse stagger to bloom from Right-to-Left
              ease: "expo.out",
              delay: duration * 0.065, // Starts exactly at 10% of the line's head movement duration
              clearProps: "opacity"
            });
          }
        } else if (links.length === 1) {
          dom.social.classList.add("social-lines-animated");
        }

        // 4. Text reveals
        if (dom.bgName) {
            const bgDelay = startupIntroSpinActive ? (STARTUP_INTRO_SPIN_MS / 1000) : 0;
            gsap.to(dom.bgName, { opacity: 1, duration: 1.8, ease: "power2.out", clearProps: "opacity", delay: bgDelay });
        }
        
        const words = dom.introLeft.querySelectorAll(".intro-word");
        if (words.length > 0) {
            gsap.killTweensOf(words);
            gsap.fromTo(words, { opacity: 0, y: 10 }, {
                opacity: 1, y: 0, duration: wordDur, stagger: wordStagger, ease: "expo.out", delay: t_words
            });
        }
        if (exploreChars.length > 0) {
            gsap.killTweensOf(exploreChars);
            gsap.fromTo(exploreChars, { opacity: 0 }, {
                opacity: 1, duration: charDur, ease: "power2.inOut", stagger: charStagger, clearProps: "opacity", delay: t_exploreText
            });
        }

        if (rightText) {
            gsap.killTweensOf(rightText);
            gsap.to(rightText, { opacity: 0.9, duration: 0.7, delay: t_exploreText, ease: "expo.out", clearProps: "opacity" });
        }
        if (readMore) {
            gsap.killTweensOf(readMore);
            gsap.to(readMore, { opacity: 1, duration: 0.7, delay: t_exploreText + 0.1, ease: "expo.out", clearProps: "opacity" });
        }
      });
    }

    function replaySocialLineEffect() {
      if (links.length === 0) return;
      const wf = 0.6;
      
      if (links.length >= 2) {
        const first = links[0]!;
        const last = links[links.length - 1]!;
        activeSocialLink = first;
        const xFirst = first.offsetLeft;
        const xLastEdge = last.offsetLeft + last.offsetWidth;
        const totalSpan = xLastEdge - xFirst;
        const targetW = 52 * wf;

        import("gsap").then(({ gsap }) => {
          dom.social.classList.add("social-lines-animated");
          gsap.killTweensOf(dom.sline);
          dom.sline.style.transition = "none";

          const socProxy = { head: 100, tail: 0 };
          const finalTail = Math.max(0, 100 - (targetW / totalSpan) * 100);
          gsap.set(dom.sline, { left: xFirst, width: totalSpan, scaleX: 1, x: 0, opacity: 1, clipPath: "inset(0% 0% 0% 100%)" });

          const dur = introLinesDurationMs() / 1000;

          const tl = gsap.timeline({
            onComplete: () => {
              gsap.set(dom.sline, { clearProps: "all" });
              dom.sline.style.transition = "none";
              if (activeSocialLink) positionSocialLine(activeSocialLink, wf);
              void dom.sline.offsetHeight;
              dom.sline.style.transition = "";
            }
          });

          tl.to(socProxy, { head: 0, duration: dur * 0.65, ease: "power3.inOut", onUpdate: () => dom.sline.style.clipPath = `inset(0% ${socProxy.tail}% 0% ${socProxy.head}%)` }, 0)
            .to(socProxy, { tail: finalTail, duration: dur * 0.55, ease: "power3.out", onUpdate: () => dom.sline.style.clipPath = `inset(0% ${socProxy.tail}% 0% ${socProxy.head}%)` }, dur * 0.3);

          const socIcons = dom.social.querySelectorAll(".soc");
          if (socIcons.length > 0) {
            gsap.killTweensOf(socIcons);
            gsap.fromTo(socIcons, { opacity: 0 }, {
              opacity: 0.45,
              duration: 0.5,
              stagger: -0.15,
              ease: "expo.out",
              delay: dur * 0.065, 
              clearProps: "opacity"
            });
          }
        });
      } else {
         dom.social.classList.add("social-lines-animated");
         if (activeSocialLink) positionSocialLine(activeSocialLink, wf);
      }
    }

    links.forEach((el) => {
      el.addEventListener("mouseenter", () => positionSocialLine(el, 1));
      el.addEventListener("focus", () => {
        activeSocialLink = el;
        positionSocialLine(activeSocialLink, 0.6);
      });
      el.addEventListener("pointerdown", () => {
        activeSocialLink = el;
        positionSocialLine(activeSocialLink, 0.6);
      });
    });
    dom.social.addEventListener("mouseleave", () => {
      if (activeSocialLink) positionSocialLine(activeSocialLink, 0.6);
      dom.sline.style.opacity = "0.85";
    });

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!scrolled) scrolled = true;
      if (introActive || experienceExitActive || experienceEntryActive) return;
      scrollVel += e.deltaY * 0.00045;
    };
    window.addEventListener("wheel", onWheel, { passive: false });

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      lastX = e.clientX;
      if (!scrolled) scrolled = true;
    };
    const onMouseUp = () => {
      isDragging = false;
    };
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / innerHeight) * 2 + 1;
      if (
        isDragging &&
        !introActive &&
        !experienceExitActive &&
        !experienceEntryActive
      ) {
        const dx = lastX - e.clientX;
        lastX = e.clientX;
        scrollVel += dx * 0.002;
      }
    };
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);

    const togglePaused = () => {
      isPaused = !isPaused;
      dom.soundBtn.classList.toggle("paused", isPaused);
    };
    dom.soundBtn.addEventListener("click", togglePaused);
    dom.soundBtn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        togglePaused();
      }
    });

    const enterExperience = () => {
      if (!introActive) return;
      if (exploreCommitPending) return;
      exploreCommitPending = true;
      dom.introLeft.classList.remove("lines-animated"); 
      dom.social.classList.remove("social-lines-animated");
      dom.social.classList.add("hidden");
      if (introLineRevealTimer !== undefined) {
        clearTimeout(introLineRevealTimer);
        introLineRevealTimer = undefined;
      }
      const waitMs = Math.max(
        0,
        Math.ceil(introLinesAnimEndMs - performance.now()),
      );
      const proceed = () => {
        exploreCommitTimer = undefined;
        exploreCommitPending = false;
        introActive = false;
        experienceEntryActive = true;
        experienceEntryStartMs = performance.now();
        entryScrollTo = scrollTarget;
        entryScrollFrom = scrollTarget - 8;
        if (introLineRevealTimer !== undefined) {
          clearTimeout(introLineRevealTimer);
          introLineRevealTimer = undefined;
        }
        if (timelineRevealTimer !== undefined) {
          clearTimeout(timelineRevealTimer);
          timelineRevealTimer = undefined;
        }
        timelineDatesVisible = false;
        dom.timeline.classList.remove("date-show");
        document.getElementById("year-lbl")?.classList.remove("date-show");
        dom.month.classList.remove("date-show");
        dom.introLeft.classList.remove("lines-animated");
        dom.introRight.classList.remove("lines-animated");
        dom.introLeft.classList.add("hidden");
        dom.introRight.classList.add("hidden");
        dom.bgName.classList.add("hidden");
        lastMonthIndex = null;
        lastFiForMonth = null;
        pendingMonthIndex = null;
        pendingFiForMonth = null;
        nextMonthSwitchAt = 0;
        dom.month.classList.remove("enter-left", "enter-right");
        dom.monthGhost.classList.remove("leave-left", "leave-right");
        timelineRevealTimer = window.setTimeout(() => {
          timelineRevealTimer = undefined;
          timelineDatesVisible = true;
          dom.timeline.classList.add("date-show");
          dom.social.classList.remove("hidden");
          replaySocialLineEffect();
          document.getElementById("year-lbl")?.classList.add("date-show");
          dom.month.classList.add("date-show");
        }, EXPERIENCE_ENTRY_MS);
      };
      if (waitMs > 0) {
        exploreCommitTimer = window.setTimeout(proceed, waitMs);
      } else {
        proceed();
      }
    };

    const returnToExploreIntro = () => {
      if (introActive || experienceExitActive) return;
      if (exploreCommitTimer !== undefined) {
        clearTimeout(exploreCommitTimer);
        exploreCommitTimer = undefined;
      }
      exploreCommitPending = false;
      if (timelineRevealTimer !== undefined) {
        clearTimeout(timelineRevealTimer);
        timelineRevealTimer = undefined;
      }
      timelineDatesVisible = false;
      if (introLineRevealTimer !== undefined) {
        clearTimeout(introLineRevealTimer);
        introLineRevealTimer = undefined;
      }
      dom.timeline.classList.remove("date-show");
      dom.social.classList.add("hidden");
      document.getElementById("year-lbl")?.classList.remove("date-show");
      dom.month.classList.remove("date-show");
      lastMonthIndex = null;
      lastFiForMonth = null;
      pendingMonthIndex = null;
      pendingFiForMonth = null;
      nextMonthSwitchAt = 0;
      dom.month.classList.remove("enter-left", "enter-right");
      dom.monthGhost.classList.remove("leave-left", "leave-right");

      exitScroll0 = experienceEntryActive ? scrollForLayoutLast : scrollCurrent;
      /** Góc Euler thật trên mesh (kể cả giữa chừng entry spin) — không dùng figRotY có thể lệch. */
      exitFigRot0 = figureGroup ? figureGroup.rotation.y : figRotY;
      exitWasEntryMidSpin = experienceEntryActive;
      if (exitWasEntryMidSpin) {
        // TH2: entry chưa xong — xoay nhẹ chiều dương (trái→phải) về k·2π gần nhất phía trước
        const TAU = Math.PI * 2;
        exitFigRot1 = Math.ceil(exitFigRot0 / TAU + 1e-9) * TAU;
      } else if (Math.abs(scrollCurrent) < 0.1) {
        // TH1: entry xong, chưa scroll — xoay đúng 1 vòng chiều dương
        exitFigRot1 = exitFigRot0 + Math.PI * 2;
      } else {
        // TH3: entry xong, đã scroll — xoay ≥ 1 vòng chiều dương, kết thúc đúng k·2π (≡ 0)
        exitFigRot1 = exitRotationTargetAtLeastOneTurn(exitFigRot0);
      }
      exitFigPosY0 = figPosY;
      exitFigScale0 = figScale;
      exitBgYaw0 = bgYawLast;
      experienceExitStartMs = performance.now();
      experienceExitActive = true;
      experienceEntryActive = false;
      scrolled = false;
      scrollVel = 0;
      scrollVelVis = 0;
      scrollTarget = 0;
    };

    dom.exploreBtn.addEventListener("click", enterExperience);
    dom.brand.addEventListener("click", returnToExploreIntro);

    const onResize = () => {
      cam.aspect = innerWidth / innerHeight;
      cam.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
      resizeParticles();
      bg.resize();
    };
    window.addEventListener("resize", onResize);

    return {
      teardown: () => {
        if (introLineRevealTimer !== undefined)
          clearTimeout(introLineRevealTimer);
        if (exploreCommitTimer !== undefined) clearTimeout(exploreCommitTimer);
        if (timelineRevealTimer !== undefined)
          clearTimeout(timelineRevealTimer);
        window.removeEventListener("wheel", onWheel);
        window.removeEventListener("mousedown", onMouseDown);
        window.removeEventListener("mouseup", onMouseUp);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("resize", onResize);
        dom.exploreBtn.removeEventListener("click", enterExperience);
        dom.brand.removeEventListener("click", returnToExploreIntro);
        dom.soundBtn.removeEventListener("click", togglePaused);
      },
      runIntroPageLineEffects,
      replaySocialLineEffect,
    };
  }

  // Animation
  let raf = 0;
  function animate() {
    raf = requestAnimationFrame(animate);

    if (
      dom.modelLoadPct.classList.contains("model-loading") &&
      !dom.modelLoadPct.classList.contains("model-load-exit")
    ) {
      const nowMs = performance.now();
      const dt = Math.min(
        0.05,
        Math.max(1 / 144, (nowMs - lastModelLoadUiMs) / 1000),
      );
      lastModelLoadUiMs = nowMs;

      // modelLoadTargetPct là % thật (từ GLTFLoader), dao động 0 -> 100.
      const real = Math.min(99, modelLoadTargetPct);

      // 1. Chảy số "thật" (realFloor) - bám theo real nhưng không được nhảy vọt.
      const floorK = 1 - Math.exp(-dt * 6);
      modelLoadRealFloor += (real - modelLoadRealFloor) * floorK;

      // 2. Chảy số "ảo" (crawl) - luôn tiến về phía trước một chút để không bị khựng khi mạng đứng.
      // Càng gần 99 crawlRate càng chậm lại.
      const crawlRemaining = 99 - modelLoadCrawlPct;
      const baseCrawlSpeed = modelLoadCrawlPct < 50 ? 15 : 8;
      const crawlRate = (crawlRemaining / 99) * baseCrawlSpeed + 0.5;
      modelLoadCrawlPct = Math.min(99, modelLoadCrawlPct + dt * crawlRate);

      // 3. Display là giá trị lớn nhất giữa thực (đã làm mượt) và ảo (crawling).
      const targetDisplay = Math.max(modelLoadRealFloor, modelLoadCrawlPct);

      // 4. Nội suy display cuối cùng để chuyển động mượt mà hoàn toàn.
      const followK = 1 - Math.exp(-dt * 4);
      modelLoadDisplayPct += (targetDisplay - modelLoadDisplayPct) * followK;

      // Càng về sau số càng chậm nên cần đảm bảo display không bao giờ giảm.
      modelLoadDisplayPct = Math.min(
        99,
        Math.max(modelLoadDisplayPct, lastRenderedLoadPct),
      );

      const shown = Math.floor(modelLoadDisplayPct);
      if (shown !== lastRenderedLoadPct) {
        lastRenderedLoadPct = shown;
        dom.modelLoadPct.textContent = String(shown);
      }
    }

    if (isPaused) return;

    let experienceEntryProgress = 1;
    if (experienceEntryActive) {
      const elapsed = performance.now() - experienceEntryStartMs;
      experienceEntryProgress = Math.min(1, elapsed / EXPERIENCE_ENTRY_MS);
      if (experienceEntryProgress >= 1) experienceEntryActive = false;
    }

    let startupIntroSpinProgress = 1;
    if (startupIntroSpinActive) {
      const elapsed = performance.now() - startupIntroSpinStartMs;
      startupIntroSpinProgress = Math.min(1, elapsed / STARTUP_INTRO_SPIN_MS);
      if (startupIntroSpinProgress >= 1) {
        startupIntroSpinActive = false;
      }
    }

    let exitProgress = 0;
    if (experienceExitActive) {
      exitProgress = Math.min(
        1,
        (performance.now() - experienceExitStartMs) / EXPERIENCE_EXIT_MS,
      );
    }

    drawParticles();
    if (experienceExitActive) {
      const s0 = exitScroll0;
      const sp = EXPERIENCE_EXIT_UNDERSHOOT_SPLIT;
      const deep = Math.min(
        s0 - EXPERIENCE_EXIT_MIN_SCROLL_TRAVEL,
        EXPERIENCE_EXIT_SCROLL_DEEP_CAP,
      );
      if (exitProgress < sp) {
        const u = smootherstep01(exitProgress / sp);
        scrollCurrent = lerp(s0, deep, u);
      } else {
        const u = smootherstep01((exitProgress - sp) / (1 - sp));
        scrollCurrent = lerp(deep, 0, u);
      }
      scrollTarget = 0;
      scrollVel = 0;
      const rewindStrength = Math.min(1, (Math.abs(s0) + Math.abs(deep)) / 14);
      scrollVelVis =
        -0.022 * rewindStrength * (1 - smootherstep01(exitProgress));
    } else {
      scrollVel *= 0.82;
      scrollTarget = Math.max(0, Math.min(N - 1, scrollTarget + scrollVel));
      scrollCurrent = lerp(scrollCurrent, scrollTarget, 0.12);
      scrollVelVis = lerp(scrollVelVis, scrollVel, 0.1);
    }

    let camX = 0;
    let camY = 0.5;
    let camLookAtY = 0.3;
    let camZ = 11;
    if (introActive && startupIntroSpinActive) {
      // Single continuous arc (C1-smooth) to avoid jerk at segment boundaries.
      const x = smootherstep01(startupIntroSpinProgress);
      // End at exactly 0.0 to match the idle camera defaults (0, 0.5, 11)
      const theta = lerp(-2.45, 0, x);
      const radius = lerp(12.9, 11.0, x);
      camX = Math.sin(theta) * radius;
      camZ = Math.cos(theta) * radius;
      camY = lerp(3.6, 0.5, x);
      // Keep gaze around torso/rock center to avoid "punching into the head".
      camLookAtY = lerp(0.0, 0.3, x);
    }
    cam.position.set(camX, camY, camZ);
    cam.lookAt(0, camLookAtY, 0);

    const t = Date.now() * 0.001;
    const entryScrollBlend =
      !introActive && experienceEntryProgress < 1
        ? smootherstep01(experienceEntryProgress)
        : 1;
    let scrollForLayout = scrollCurrent;
    if (!introActive && experienceEntryProgress < 1 && !experienceExitActive) {
      scrollForLayout = lerp(entryScrollFrom, entryScrollTo, entryScrollBlend);
    }
    scrollForLayoutLast = scrollForLayout;
    const sn = scrollForLayout / (N - 1);

    if (bg.camera) {
      const TAU = Math.PI * 2;
      let yaw: number;
      if (experienceExitActive) {
        const m = smootherstep01(exitProgress);
        if (exitWasEntryMidSpin) {
          // TH2: bg giảm tương ứng model tăng — cùng chiều thị giác
          const modelTravel = exitFigRot1 - exitFigRot0;
          yaw = exitBgYaw0 - modelTravel * m;
        } else {
          // TH1/TH3: xoay chiều âm, kết thúc tại k·2π (≡ yaw=0 thị giác) — không giật khi intro
          const targetYaw = Math.floor(exitBgYaw0 / TAU - 1e-9) * TAU;
          yaw = exitBgYaw0 + (targetYaw - exitBgYaw0) * m;
        }
      } else if (introActive && startupIntroSpinActive) {
        const blend = smootherstep01(startupIntroSpinProgress);
        yaw = lerp(-TAU * 1.35, 0, blend);
      } else if (!introActive && experienceEntryProgress < 1) {
        // Entry: bg xoay theo chiều dương (ngược model để đúng hướng)
        const endSn = entryScrollTo / (N - 1);
        const finalYaw = endSn * TAU * 1.25;
        const spin = (1 - entryScrollBlend) * TAU;
        yaw = finalYaw - spin;
      } else {
        const orbitBlend = introActive ? 0 : 1;
        const baseYaw = introActive ? 0 : sn * TAU * 1.25 * orbitBlend;
        yaw = baseYaw + scrollVelVis * 0.15;
      }
      const radius = 5;
      bg.camera.position.set(Math.sin(yaw) * radius, 0, Math.cos(yaw) * radius);
      bg.camera.lookAt(0, 0.2, 0);
      bgYawLast = yaw;
    }
    bg.material.uniforms.uOffsetX.value = 0;

    if (figureGroup) {
      if (experienceExitActive) {
        const m = smootherstep01(exitProgress);
        /**
         * Nội suy tới `exitFigRot1` (≡ 0 mod 2π) với quãng ≥ một vòng — không đứng yên
         * khi góc gần 0; kết thúc pose intro vẫn là 0 khi exit xong (snap ở khối dưới).
         */
        figRotY = THREE.MathUtils.lerp(exitFigRot0, exitFigRot1, m);
        figureGroup.rotation.y = figRotY;
        figureGroup.rotation.x = 0;
        figPosY = THREE.MathUtils.lerp(exitFigPosY0, -0.8, m);
        figScale = THREE.MathUtils.lerp(exitFigScale0, 2.6, m);
        figureGroup.position.set(0, figPosY, 0);
        figureGroup.scale.setScalar(figScale);
      } else {
        const targetRotY = introActive ? 0 : sn * -Math.PI * 2;
        const targetPosY = introActive ? -0.8 : -0.8 - sn * 1.2;
        const targetScale = introActive ? 2.6 : 2.6 + sn * 0.6;

        if (introActive && startupIntroSpinActive) {
          // Multi-shot startup: camera reveals details, figure rotates gently.
          const x = smootherstep01(startupIntroSpinProgress);
          const spin = lerp(Math.PI * 1.9, 0, x);
          
          const startupScale = lerp(STARTUP_INTRO_MODEL_SCALE_FROM, 2.6, x);
          const startupY = lerp(STARTUP_INTRO_MODEL_Y_FROM, -0.8, x);
          const startupZ = lerp(STARTUP_INTRO_MODEL_Z_FROM, 0, x);
          
          // Smoother breathing: start fading in the idle motion as the spin settles
          const breathing = Math.sin(t * 0.6) * 0.015 * x;

          figRotY = 0;
          figPosY = startupY; // Keep base position clean
          figScale = startupScale;
          
          figureGroup.rotation.x = 0;
          figureGroup.rotation.y = spin;
          // Apply breathing only at the point of setting, just like the idle loop does
          figureGroup.position.set(0, figPosY + breathing, startupZ);
          figureGroup.scale.setScalar(figScale);
        } else if (!introActive && experienceEntryProgress < 1) {
          const endSn = entryScrollTo / (N - 1);
          const baseRotAtEnd = endSn * -Math.PI * 2;
          const spin = (1 - entryScrollBlend) * Math.PI * 2;
          const fixedPosY = -0.8 - endSn * 1.2;
          const fixedScale = 2.6 + endSn * 0.6;
          figPosY = fixedPosY;
          figScale = fixedScale;
          figureGroup.rotation.x = 0;
          figureGroup.rotation.y = baseRotAtEnd + spin;
          figRotY = baseRotAtEnd;
          figureGroup.position.set(0, fixedPosY, 0);
          figureGroup.scale.setScalar(fixedScale);
        } else {
          figRotY = lerp(figRotY, targetRotY, 0.08);
          figureGroup.rotation.y = figRotY;
          figureGroup.rotation.x = 0;

          figPosY = lerp(figPosY, targetPosY, 0.04);
          figureGroup.position.set(0, figPosY + Math.sin(t * 0.6) * 0.015, 0);

          figScale = lerp(figScale, targetScale, 0.04);
          figureGroup.scale.setScalar(figScale);
        }
      }
    }

    const scrollForEdge = Math.max(0, Math.min(N - 1, scrollForLayout));
    const edgeFade = Math.min(
      scrollForEdge / 0.3,
      (N - 1 - scrollForEdge) / 0.3,
      1.0,
    );
    const stretchVal = Math.max(-1, Math.min(1, scrollVelVis * 45)) * edgeFade;

    raycaster.setFromCamera(mouse, cam);
    const visibleMeshes = panels.map((p) => p.mesh).filter((m) => m.visible);
    const intersects = raycaster.intersectObjects(visibleMeshes);
    const hoveredMesh =
      intersects.length > 0 ? (intersects[0].object as THREE.Mesh) : null;
    const centerIndex = Math.max(
      0,
      Math.min(N - 1, Math.round(scrollForLayout)),
    );

    const panelExitMul = 1;

    /** Sau điểm undershoot: không render panel (kể cả khi scroll từ xa về 0). */
    const exitHidePanelsAfterUndershoot =
      experienceExitActive && exitProgress >= EXPERIENCE_EXIT_UNDERSHOOT_SPLIT;

    panels.forEach((p, i) => {
      p.hoverVal ??= 0;
      p.targetHover =
        p.mesh === hoveredMesh &&
        !introActive &&
        !experienceExitActive &&
        i === centerIndex
          ? 1
          : 0;
      p.hoverVal = lerp(p.hoverVal, p.targetHover, 0.1);
      p.mat.uniforms.uHover.value = p.hoverVal;
      p.mat.uniforms.uTime.value = t;
      p.capMat.uniforms.uHover.value = p.hoverVal;
      p.capMat.uniforms.uTime.value = t;

      if (introActive) {
        p.mesh.visible = false;
        p.capMesh.visible = false;
        return;
      }

      if (exitHidePanelsAfterUndershoot) {
        p.mesh.visible = false;
        p.capMesh.visible = false;
        return;
      }

      const spacing = 0.65;
      const delta = (scrollForLayout - i) * spacing;
      const step = C + delta;
      if (step < -0.1 || step > 14.1) {
        p.mesh.visible = false;
        return;
      }

      let fadeOp = 1;
      if (step < 0.4) fadeOp = Math.max(0, step / 0.4);
      if (step > 13.6) fadeOp = Math.max(0, (14 - step) / 0.4);

      const tr = lerpPath(step);
      if (tr.z > 0) {
        const spread = (tr.z / 4.9) * 0.55;
        tr.x += tr.x * spread;
      }

      const op = tr.op * fadeOp * panelExitMul;
      p.pivot.position.set(tr.x, tr.y, tr.z);
      const distCenter = Math.min(1, Math.abs(step - C) / 3);
      const totalRoll = 0.6 * distCenter * -1;
      p.pivot.rotation.set(tr.rx, Math.atan2(tr.x, tr.z + 0.001), totalRoll);
      p.mat.uniforms.uOpacity.value = op;
      p.mat.uniforms.uCurvature.value = tr.cv * 0.3;
      p.mat.uniforms.uStretch.value = stretchVal;
      p.mesh.scale.set(tr.W / PW, tr.H / PH, 1);
      p.mesh.visible = op > 0.02;

      const absDist = Math.abs(step - C);
      const textFade = Math.max(0, 1.0 - absDist * 3.0);
      const textOp = op * textFade * panelExitMul;
      p.capMat.uniforms.uOpacity.value = textOp;
      p.capMat.uniforms.uCurvature.value = tr.cv * 0.3;
      p.capMat.uniforms.uStretch.value = stretchVal;
      p.capMesh.scale.set(tr.W / PW, tr.H / PH, 1);
      const sideT = Math.min(1, Math.abs(step - C) / 3);
      p.capMesh.position.z = 0.04 + sideT * 0.14;
      p.capMesh.visible = textOp > 0.01;
    });

    if (!introActive && !experienceExitActive) {
      const fi = centerIndex;
      const progress = Math.max(0, Math.min(1, scrollForLayout / (N - 1)));
      dom.tlProgress.style.width = progress * 100 + "%";

      const monthIndex = fi % 12;
      const isScrollSettled =
        Math.abs(scrollTarget - scrollCurrent) < 0.02 &&
        Math.abs(scrollVel) < 0.0004;
      if (lastMonthIndex === null) {
        lastMonthIndex = monthIndex;
        lastFiForMonth = fi;
        dom.month.textContent = MONTHS[monthIndex] ?? "Jan";
        if (timelineDatesVisible) dom.month.classList.add("date-show");
        nextMonthSwitchAt = performance.now();
      } else {
        if (monthIndex !== lastMonthIndex) {
          pendingMonthIndex = monthIndex;
          pendingFiForMonth = fi;
        }
        const nowMs = performance.now();
        const canSwitch =
          pendingMonthIndex !== null && nowMs >= nextMonthSwitchAt;
        if (isScrollSettled && pendingMonthIndex !== null) {
          lastMonthIndex = pendingMonthIndex;
          lastFiForMonth = pendingFiForMonth ?? fi;
          pendingMonthIndex = null;
          pendingFiForMonth = null;
          dom.month.textContent = MONTHS[lastMonthIndex] ?? "Jan";
          if (timelineDatesVisible) dom.month.classList.add("date-show");
        } else if (canSwitch) {
          const targetMonthIndex = pendingMonthIndex!;
          const targetFi = pendingFiForMonth ?? fi;
          pendingMonthIndex = null;
          pendingFiForMonth = null;
          nextMonthSwitchAt = nowMs + MONTH_SWITCH_COOLDOWN_MS;
          const dir =
            lastFiForMonth !== null && targetFi < lastFiForMonth ? -1 : 1;
          lastFiForMonth = targetFi;

          dom.monthGhost.textContent = MONTHS[lastMonthIndex] ?? "Jan";
          dom.monthGhost.classList.remove("leave-left", "leave-right");
          void dom.monthGhost.offsetWidth;
          dom.monthGhost.classList.add(dir > 0 ? "leave-left" : "leave-right");

          dom.month.textContent = MONTHS[targetMonthIndex] ?? "Jan";
          if (timelineDatesVisible) dom.month.classList.add("date-show");
          dom.month.classList.remove("enter-left", "enter-right");
          void dom.month.offsetWidth;
          dom.month.classList.add(dir > 0 ? "enter-left" : "enter-right");
          lastMonthIndex = targetMonthIndex;
        }
      }
    }

    if (experienceExitActive && exitProgress >= 1) {
      experienceExitActive = false;
      introActive = true;
      figRotY = 0;
      figPosY = -0.8;
      figScale = 2.6;
      if (figureGroup) {
        figureGroup.rotation.set(0, 0, 0);
        figureGroup.position.set(0, -0.8, 0);
        figureGroup.scale.setScalar(2.6);
      }
      scrollCurrent = 0;
      scrollTarget = 0;
      scrollVel = 0;
      scrollVelVis = 0;
      dom.tlProgress.style.width = "0%";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          completeExploreReturnToIntroUi();
        });
      });
    }

    bg.render();
    renderer.render(scene, cam);
  }

  initParticles();
  buildPanels();
  const experienceEvents = bindEvents();

  function completeExploreReturnToIntroUi() {
    dom.introLeft.classList.remove("intro-lines-reveal", "lines-animated");
    dom.introRight.classList.remove("lines-animated");
    dom.social.classList.remove("social-lines-animated");
    void dom.introLeft.offsetHeight;
    dom.introLeft.classList.remove("hidden");
    dom.introRight.classList.remove("hidden");
    dom.bgName.classList.remove("hidden");
    dom.social.classList.remove("hidden");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        experienceEvents.runIntroPageLineEffects();
      });
    });
  }

  /** Intro copy is `opacity: 0` until `experience-loading` is removed — run lines after it is visible. */
  function scheduleIntroLinesWhenUiVisible() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        experienceEvents.runIntroPageLineEffects();
      });
    });
  }

  void loadModels()
    .then(() => {
      dom.introLeft.classList.add("hidden");
      dom.introRight.classList.add("hidden");
      dom.bgName.classList.add("hidden");
      dom.social.classList.add("hidden");
      document.documentElement.classList.remove("experience-loading");
      dom.bgName.classList.add("model-ready");
      dom.modelLoadPct.setAttribute("aria-busy", "false");
      dom.modelLoadPct.textContent = "99";
      dom.modelLoadPct.classList.add("model-load-exit");
      let exitFinished = false;
      const finishLoadHud = () => {
        if (exitFinished) return;
        exitFinished = true;
        dom.modelLoadPct.classList.remove("model-loading", "model-load-exit");
      };
      dom.modelLoadPct.addEventListener("animationend", finishLoadHud, {
        once: true,
      });
      window.setTimeout(finishLoadHud, 1200);
      if (figureGroup) {
        startupIntroSpinStartMs = performance.now();
        startupIntroSpinActive = true;
        completeExploreReturnToIntroUi();
      } else {
        scheduleIntroLinesWhenUiVisible();
      }
    })
    .catch((err: unknown) => {
      console.error("Failed to load 3D models", err);
      document.documentElement.classList.remove("experience-loading");
      dom.modelLoadPct.setAttribute("aria-busy", "false");
      dom.modelLoadPct.classList.remove("model-loading", "model-load-exit");
      scheduleIntroLinesWhenUiVisible();
    });
  animate();

  return () => {
    cancelAnimationFrame(raf);
    experienceEvents.teardown();
    renderer.dispose();
    bg.renderer.dispose();
  };
}
