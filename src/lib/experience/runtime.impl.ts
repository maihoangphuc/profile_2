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
  month: HTMLElement;
  monthGhost: HTMLElement;
  timeline: HTMLElement;
  tlProgress: HTMLElement;
  introLeft: HTMLElement;
  introRight: HTMLElement;
  bgName: HTMLElement;
  soundBtn: HTMLElement;
  social: HTMLElement;
  sline: HTMLElement;
  exploreBtn: HTMLElement;
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
    month: must("month-lbl"),
    monthGhost: must("month-lbl-ghost"),
    timeline: must("timeline"),
    tlProgress: must("tl-progress"),
    introLeft: must("intro-left"),
    introRight: must("intro-right"),
    bgName: must("bg-name"),
    soundBtn: must("sound-btn"),
    social: must("social"),
    sline: must("sline"),
    exploreBtn: must("explore-btn"),
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

  // HDR env (lazy loader)
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  void import("three/examples/jsm/loaders/RGBELoader.js").then(
    ({ RGBELoader }) => {
      new RGBELoader()
        .setDataType(THREE.UnsignedByteType)
        .load(
          "https://threejs.org/examples/textures/equirectangular/royal_esplanade_1k.hdr",
          (texture) => {
            const envMap = pmremGenerator.fromEquirectangular(texture).texture;
            scene.environment = envMap;
            texture.dispose();
            pmremGenerator.dispose();
          },
        );
    },
  );

  scene.add(new THREE.AmbientLight(rootCssVarToHexInt("--color-web-white"), 0.3));
  const sun = new THREE.DirectionalLight(rootCssVarToHexInt("--color-web-white"), 1.2);
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
  const back = new THREE.DirectionalLight(rootCssVarToHexInt("--color-web-white"), 0.6);
  back.position.set(-5, 3, -5);
  scene.add(back);
  const rim1 = new THREE.DirectionalLight(rootCssVarToHexInt("--color-web-white"), 1.5);
  rim1.position.set(-10, 5, -10);
  scene.add(rim1);
  const rim2 = new THREE.DirectionalLight(rootCssVarToHexInt("--color-web-white"), 1.0);
  rim2.position.set(10, 5, -10);
  scene.add(rim2);

  // Models (concurrent)
  let figureGroup: THREE.Group | null = null;
  const clayMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.95,
    metalness: 0.0,
    reflectivity: 0.5,
    envMapIntensity: 0.5,
    clearcoat: 0.0,
  });

  function syncClayMaterialColorFromCss() {
    const hex =
      rootCssVarToHexInt("--color-web-scene-neutral") ||
      rootCssVarToHexInt("--palette-web-scene-neutral");
    if (hex !== 0) clayMaterial.color.setHex(hex);
  }

  queueMicrotask(() => syncClayMaterialColorFromCss());

  async function loadModels() {
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
    const loadGLB = (url: string) =>
      new Promise<import("three/examples/jsm/loaders/GLTFLoader.js").GLTF>(
        (resolve, reject) => {
          loader.load(url, resolve, undefined, reject);
        },
      );

    const [figure, rock] = await Promise.all([
      loadGLB("/3d.glb"),
      loadGLB("/rock.glb"),
    ]);

    syncClayMaterialColorFromCss();

    const group = new THREE.Group();

    figure.scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = clayMaterial;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
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
      });

      const mesh = new THREE.Mesh(sharedGeo, mat);
      const capMesh = new THREE.Mesh(capGeo, capMat);
      capMesh.position.z = 0.01;
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

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2(-10, -10);

  function positionSocialLine(target: HTMLElement, widthFactor = 1) {
    const x = target.offsetLeft;
    dom.sline.style.transform = `translateX(${x}px) scaleX(${widthFactor})`;
    dom.sline.style.opacity = "0.85";
  }

  function bindEvents() {
    const links = Array.from(dom.social.querySelectorAll<HTMLElement>(".soc"));
    const socDefault = dom.social.querySelector<HTMLElement>(
      '.soc[data-key="fb"]',
    );
    let activeSocialLink = socDefault ?? links[0];
    if (activeSocialLink)
      requestAnimationFrame(() => positionSocialLine(activeSocialLink, 0.6));
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
      if (introActive) return;
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
      if (isDragging && !introActive) {
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
      introActive = false;
      dom.introLeft.classList.add("hidden");
      dom.introRight.classList.add("hidden");
      dom.bgName.classList.add("hidden");
      dom.timeline.classList.add("date-show");
      document.getElementById("year-lbl")?.classList.add("date-show");
      dom.month.classList.add("date-show");
      lastMonthIndex = null;
      lastFiForMonth = null;
      pendingMonthIndex = null;
      pendingFiForMonth = null;
      nextMonthSwitchAt = 0;
      dom.month.classList.remove("enter-left", "enter-right");
      dom.monthGhost.classList.remove("leave-left", "leave-right");
    };
    dom.exploreBtn.addEventListener("click", enterExperience);

    const onResize = () => {
      cam.aspect = innerWidth / innerHeight;
      cam.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
      resizeParticles();
      bg.resize();
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      dom.exploreBtn.removeEventListener("click", enterExperience);
      dom.soundBtn.removeEventListener("click", togglePaused);
    };
  }

  // Animation
  let raf = 0;
  function animate() {
    raf = requestAnimationFrame(animate);
    if (isPaused) return;

    drawParticles();
    scrollVel *= 0.82;
    scrollTarget = Math.max(0, Math.min(N - 1, scrollTarget + scrollVel));
    scrollCurrent = lerp(scrollCurrent, scrollTarget, 0.12);
    scrollVelVis = lerp(scrollVelVis, scrollVel, 0.1);

    cam.position.set(0, 0.5, 11);
    cam.lookAt(0, 0.3, 0);

    const t = Date.now() * 0.001;
    const sn = scrollCurrent / (N - 1);

    if (bg.camera) {
      const TAU = Math.PI * 2;
      const baseYaw = introActive ? 0 : sn * TAU * 1.25;
      const yaw = baseYaw + scrollVelVis * 0.15;
      const radius = 5;
      bg.camera.position.set(Math.sin(yaw) * radius, 0, Math.cos(yaw) * radius);
      bg.camera.lookAt(0, 0.2, 0);
    }
    bg.material.uniforms.uOffsetX.value = 0;

    if (figureGroup) {
      const targetRotY = introActive ? 0 : sn * -Math.PI * 2;
      figRotY = lerp(figRotY, targetRotY, 0.08);
      figureGroup.rotation.y = figRotY;
      figureGroup.rotation.x = 0;

      const targetPosY = introActive ? -0.8 : -0.8 - sn * 1.2;
      figPosY = lerp(figPosY, targetPosY, 0.04);
      figureGroup.position.set(0, figPosY + Math.sin(t * 0.6) * 0.015, 0);

      const targetScale = introActive ? 2.6 : 2.6 + sn * 0.6;
      figScale = lerp(figScale, targetScale, 0.04);
      figureGroup.scale.setScalar(figScale);
    }

    const edgeFade = Math.min(
      scrollCurrent / 0.3,
      (N - 1 - scrollCurrent) / 0.3,
      1.0,
    );
    const stretchVal = Math.max(-1, Math.min(1, scrollVelVis * 45)) * edgeFade;

    raycaster.setFromCamera(mouse, cam);
    const visibleMeshes = panels.map((p) => p.mesh).filter((m) => m.visible);
    const intersects = raycaster.intersectObjects(visibleMeshes);
    const hoveredMesh =
      intersects.length > 0 ? (intersects[0].object as THREE.Mesh) : null;
    const centerIndex = Math.max(0, Math.min(N - 1, Math.round(scrollCurrent)));

    panels.forEach((p, i) => {
      p.hoverVal ??= 0;
      p.targetHover =
        p.mesh === hoveredMesh && !introActive && i === centerIndex ? 1 : 0;
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

      const spacing = 0.65;
      const delta = (scrollCurrent - i) * spacing;
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

      const op = tr.op * fadeOp;
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
      const textOp = op * textFade;
      p.capMat.uniforms.uOpacity.value = textOp;
      p.capMat.uniforms.uCurvature.value = tr.cv * 0.3;
      p.capMat.uniforms.uStretch.value = stretchVal;
      p.capMesh.scale.set(tr.W / PW, tr.H / PH, 1);
      p.capMesh.visible = textOp > 0.01;
    });

    if (!introActive) {
      const fi = centerIndex;
      const progress = scrollCurrent / (N - 1);
      dom.tlProgress.style.width = progress * 100 + "%";

      const monthIndex = fi % 12;
      const isScrollSettled =
        Math.abs(scrollTarget - scrollCurrent) < 0.02 &&
        Math.abs(scrollVel) < 0.0004;
      if (lastMonthIndex === null) {
        lastMonthIndex = monthIndex;
        lastFiForMonth = fi;
        dom.month.textContent = MONTHS[monthIndex] ?? "Jan";
        dom.month.classList.add("date-show");
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
          dom.month.classList.add("date-show");
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
          dom.month.classList.add("date-show");
          dom.month.classList.remove("enter-left", "enter-right");
          void dom.month.offsetWidth;
          dom.month.classList.add(dir > 0 ? "enter-left" : "enter-right");
          lastMonthIndex = targetMonthIndex;
        }
      }
    }

    bg.render();
    renderer.render(scene, cam);
  }

  initParticles();
  buildPanels();
  const teardownEvents = bindEvents();

  void loadModels()
    .then(() => {
      dom.bgName.classList.add("model-ready");
    })
    .catch((err: unknown) => {
      console.error("Failed to load 3D models", err);
    });
  animate();

  return () => {
    cancelAnimationFrame(raf);
    teardownEvents?.();
    renderer.dispose();
    bg.renderer.dispose();
  };
}
