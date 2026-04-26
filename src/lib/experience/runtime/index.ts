import * as THREE from "three";
import { initGretaBackground } from "@/lib/experience/background/index";
import { bindEvents } from "@/lib/experience/runtime/events";
import { initScene } from "@/lib/experience/runtime/scene";
import { initParticles, createParticlesState, resizeParticles } from "@/lib/experience/runtime/particles";
import { loadModels } from "@/lib/experience/runtime/models";
import { buildPanels } from "@/lib/experience/runtime/panels";
import { getDom, positionSocialLine } from "@/lib/experience/runtime/ui";
import { createExperienceState } from "@/lib/experience/runtime/world";
import { RuntimeContext } from "@/lib/experience/runtime/types";
import { runIntroPageLineEffects, replaySocialLineEffect, introLinesDurationMs } from "@/lib/experience/runtime/effects";
import { enterExperience, returnToExploreIntro, completeExploreReturnToIntroUi, scheduleIntroLinesWhenUiVisible } from "@/lib/experience/runtime/transitions";
import { createAnimateLoop } from "@/lib/experience/runtime/loop";

export function startExperience() {
  const dom = getDom();
  const state = {
    ...createExperienceState(),
    isDragging: false,
    lastX: 0,
    mouseX: -10,
    mouseY: -10,
  };

  const bg = initGretaBackground(dom.bg);
  const pCtx = dom.particles.getContext("2d")!;
  const pState = createParticlesState();
  const { scene, cam, renderer } = initScene(dom);
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2(-10, -10);

  const ctx: RuntimeContext = {
    dom,
    state,
    bg,
    scene,
    cam,
    renderer,
    raycaster,
    mouse,
    pCtx,
    pState,
    panels: buildPanels(scene),
    figureGroup: { value: null },
    timers: {},
    animFlags: {
      introLinesAnimEndMs: 0,
      exploreCommitPending: false,
      socialLineAnimated: false,
    },
    events: null,
  };

  ctx.events = bindEvents(dom, state, {
    onResize: () => {
      cam.aspect = innerWidth / innerHeight;
      cam.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
      resizeParticles(dom);
      bg.resize();
    },
    onTogglePaused: () => {
      state.isPaused = !state.isPaused;
      dom.soundBtn.classList.toggle("paused", state.isPaused);
    },
    runIntroPageLineEffects: () => runIntroPageLineEffects(ctx),
    replaySocialLineEffect: () => replaySocialLineEffect(ctx),
  });

  dom.exploreBtn.addEventListener("click", () => enterExperience(ctx));
  dom.brand.addEventListener("click", () => returnToExploreIntro(ctx));

  const cleanupLoop = createAnimateLoop(ctx);

  initParticles(dom, pState);
  void loadModels(scene, (pct) => { state.modelLoadTargetPct = pct; })
    .then((group) => {
      ctx.figureGroup.value = group;
      document.documentElement.classList.remove("experience-loading");
      dom.bgName.classList.add("model-ready");
      dom.modelLoadPct.setAttribute("aria-busy", "false");
      dom.modelLoadPct.textContent = "99";
      dom.modelLoadPct.classList.add("model-load-exit");

      let finished = false;
      const hud = () => {
        if (finished) return;
        finished = true;
        dom.modelLoadPct.classList.remove("model-loading", "model-load-exit");
      };
      dom.modelLoadPct.addEventListener("animationend", hud, { once: true });
      window.setTimeout(hud, 1200);

      completeExploreReturnToIntroUi(ctx);
    })
    .catch((err) => {
      console.error(err);
      document.documentElement.classList.remove("experience-loading");
      dom.modelLoadPct.setAttribute("aria-busy", "false");
      dom.modelLoadPct.classList.remove("model-loading", "model-load-exit");
      scheduleIntroLinesWhenUiVisible(ctx);
    });

  return () => {
    cleanupLoop();
    ctx.events.teardown();
    renderer.dispose();
    bg.renderer.dispose();
  };
}
