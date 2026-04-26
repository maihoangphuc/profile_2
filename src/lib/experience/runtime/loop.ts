import * as THREE from "three";
import { RuntimeContext } from "@/lib/experience/runtime/types";
import { C, MONTHS, N, PH, PW } from "@/constants/experience";
import { EXPERIENCE_ENTRY_MS, EXPERIENCE_EXIT_MS, EXPERIENCE_EXIT_MIN_SCROLL_TRAVEL, EXPERIENCE_EXIT_SCROLL_DEEP_CAP, EXPERIENCE_EXIT_UNDERSHOOT_SPLIT, MONTH_SWITCH_COOLDOWN_MS } from "@/lib/experience/runtime/world";
import { lerp, lerpPath, smootherstep01 } from "@/lib/experience/runtime/math";
import { drawParticles } from "@/lib/experience/runtime/particles";
import { completeExploreReturnToIntroUi } from "@/lib/experience/runtime/transitions";

export function createAnimateLoop(ctx: RuntimeContext) {
  const { dom, state, bg, scene, cam, renderer, raycaster, mouse, pCtx, pState, panels, figureGroup } = ctx;
  let raf = 0;

  function animate() {
    raf = requestAnimationFrame(animate);

    if (dom.modelLoadPct.classList.contains("model-loading") && !dom.modelLoadPct.classList.contains("model-load-exit")) {
      const nowMs = performance.now();
      const dt = Math.min(0.05, Math.max(1 / 144, (nowMs - state.lastModelLoadUiMs) / 1000));
      state.lastModelLoadUiMs = nowMs;
      const real = Math.min(99, state.modelLoadTargetPct);
      const floorK = 1 - Math.exp(-dt * 6);
      state.modelLoadRealFloor += (real - state.modelLoadRealFloor) * floorK;
      const crawlRemaining = 99 - state.modelLoadCrawlPct;
      const baseCrawlSpeed = state.modelLoadCrawlPct < 50 ? 15 : 8;
      const crawlRate = (crawlRemaining / 99) * baseCrawlSpeed + 0.5;
      state.modelLoadCrawlPct = Math.min(99, state.modelLoadCrawlPct + dt * crawlRate);
      const targetDisplay = Math.max(state.modelLoadRealFloor, state.modelLoadCrawlPct);
      const followK = 1 - Math.exp(-dt * 4);
      state.modelLoadDisplayPct += (targetDisplay - state.modelLoadDisplayPct) * followK;
      state.modelLoadDisplayPct = Math.min(99, Math.max(state.modelLoadDisplayPct, state.lastRenderedLoadPct));
      const shown = Math.floor(state.modelLoadDisplayPct);
      if (shown !== state.lastRenderedLoadPct) {
        state.lastRenderedLoadPct = shown;
        dom.modelLoadPct.textContent = String(shown);
      }
    }

    if (state.isPaused) return;

    let experienceEntryProgress = 1;
    if (state.experienceEntryActive) {
      const elapsed = performance.now() - state.experienceEntryStartMs;
      experienceEntryProgress = Math.min(1, elapsed / EXPERIENCE_ENTRY_MS);
      if (experienceEntryProgress >= 1) {
        state.experienceEntryActive = false;
        state.scrollCurrent = state.entryScrollTo;
      }
    }

    let exitProgress = 0;
    if (state.experienceExitActive) {
      exitProgress = Math.min(1, (performance.now() - state.experienceExitStartMs) / EXPERIENCE_EXIT_MS);
    }

    drawParticles(dom, pCtx, pState);

    if (state.experienceExitActive) {
      const s0 = state.exitScroll0;
      const sp = EXPERIENCE_EXIT_UNDERSHOOT_SPLIT;
      const deep = Math.min(s0 - EXPERIENCE_EXIT_MIN_SCROLL_TRAVEL, EXPERIENCE_EXIT_SCROLL_DEEP_CAP);
      if (exitProgress < sp) {
        const u = smootherstep01(exitProgress / sp);
        state.scrollCurrent = lerp(s0, deep, u);
      } else {
        const u = smootherstep01((exitProgress - sp) / (1 - sp));
        state.scrollCurrent = lerp(deep, 0, u);
      }
      state.scrollTarget = 0;
      state.scrollVel = 0;
      const rewindStrength = Math.min(1, (Math.abs(s0) + Math.abs(deep)) / 14);
      state.scrollVelVis = -0.022 * rewindStrength * (1 - smootherstep01(exitProgress));
    } else {
      state.scrollVel *= 0.82;
      state.scrollTarget = Math.max(0, Math.min(N - 1, state.scrollTarget + state.scrollVel));
      state.scrollCurrent = lerp(state.scrollCurrent, state.scrollTarget, 0.12);
      state.scrollVelVis = lerp(state.scrollVelVis, state.scrollVel, 0.1);
    }

    const theta = -0.12;
    const radius = 11;
    let camX = Math.sin(theta) * radius, camY = 0.5, camLookAtY = 0.3, camZ = Math.cos(theta) * radius;
    cam.position.set(camX, camY, camZ);
    cam.lookAt(0, camLookAtY, 0);

    const t = Date.now() * 0.001;
    const entryScrollBlend = (!state.introActive && experienceEntryProgress < 1) ? smootherstep01(experienceEntryProgress) : 1;
    let scrollForLayout = state.scrollCurrent;
    if (!state.introActive && experienceEntryProgress < 1 && !state.experienceExitActive) {
      scrollForLayout = lerp(state.entryScrollFrom, state.entryScrollTo, entryScrollBlend);
    }
    state.scrollForLayoutLast = scrollForLayout;
    const sn = scrollForLayout / (N - 1);

    if (bg.camera) {
      const TAU = Math.PI * 2;
      let yaw: number;
      if (state.experienceExitActive) {
        const m = smootherstep01(exitProgress);
        if (state.exitWasEntryMidSpin) {
          const modelTravel = state.exitFigRot1 - state.exitFigRot0;
          yaw = state.exitBgYaw0 - modelTravel * m;
        } else {
          const targetYaw = Math.floor(state.exitBgYaw0 / TAU - 1e-9) * TAU;
          yaw = state.exitBgYaw0 + (targetYaw - state.exitBgYaw0) * m;
        }
      } else {
        yaw = (state.introActive ? 0 : sn * TAU * 1.25) + state.scrollVelVis * 0.15;
      }
      const r = 5;
      bg.camera.position.set(Math.sin(yaw) * r, 0, Math.cos(yaw) * r);
      bg.camera.lookAt(0, 0.2, 0);
      state.bgYawLast = yaw;
    }

    if (figureGroup.value) {
      if (state.experienceExitActive) {
        const m = smootherstep01(exitProgress);
        state.figRotY = THREE.MathUtils.lerp(state.exitFigRot0, state.exitFigRot1, m);
        figureGroup.value.rotation.y = state.figRotY;
        figureGroup.value.rotation.x = 0;
        state.figPosY = THREE.MathUtils.lerp(state.exitFigPosY0, -0.8, m);
        state.figScale = THREE.MathUtils.lerp(state.exitFigScale0, 2.6, m);
        figureGroup.value.position.set(0, state.figPosY, 0);
        figureGroup.value.scale.setScalar(state.figScale);
      } else if (!state.introActive && experienceEntryProgress < 1) {
        const endSn = state.entryScrollTo / (N - 1);
        const baseRotAtEnd = endSn * -Math.PI * 2;
        const spin = (1 - entryScrollBlend) * Math.PI * 2;
        state.figPosY = -0.8 - endSn * 1.2;
        state.figScale = 2.6 + endSn * 0.6;
        figureGroup.value.rotation.set(0, baseRotAtEnd + spin, 0);
        state.figRotY = baseRotAtEnd;
        figureGroup.value.position.set(0, state.figPosY, 0);
        figureGroup.value.scale.setScalar(state.figScale);
      } else {
        state.figRotY = lerp(state.figRotY, state.introActive ? 0 : sn * -Math.PI * 2, 0.08);
        figureGroup.value.rotation.set(0, state.figRotY, 0);
        state.figPosY = lerp(state.figPosY, state.introActive ? -0.8 : -0.8 - sn * 1.2, 0.04);
        figureGroup.value.position.set(0, state.figPosY + Math.sin(t * 0.6) * 0.015, 0);
        state.figScale = lerp(state.figScale, state.introActive ? 2.6 : 2.6 + sn * 0.6, 0.04);
        figureGroup.value.scale.setScalar(state.figScale);
      }
    }

    const scrollForEdge = Math.max(0, Math.min(N - 1, scrollForLayout));
    const edgeFade = Math.min(scrollForEdge / 0.3, (N - 1 - scrollForEdge) / 0.3, 1.0);
    const stretchVal = Math.max(-1, Math.min(1, state.scrollVelVis * 45)) * edgeFade;

    mouse.x = state.mouseX;
    mouse.y = state.mouseY;
    raycaster.setFromCamera(mouse, cam);
    const visibleMeshes = panels.map(p => p.mesh).filter(m => m.visible);
    const intersects = raycaster.intersectObjects(visibleMeshes);
    const hoveredMesh = intersects.length > 0 ? (intersects[0].object as THREE.Mesh) : null;
    const centerIndex = Math.max(0, Math.min(N - 1, Math.round(scrollForLayout)));

    const exitHidePanels = state.experienceExitActive && exitProgress >= EXPERIENCE_EXIT_UNDERSHOOT_SPLIT;

    panels.forEach((p, i) => {
      p.hoverVal ??= 0;
      p.targetHover = (p.mesh === hoveredMesh && !state.introActive && !state.experienceExitActive && i === centerIndex) ? 1 : 0;
      p.hoverVal = lerp(p.hoverVal, p.targetHover, 0.1);
      p.mat.uniforms.uHover.value = p.hoverVal;
      p.mat.uniforms.uTime.value = t;
      p.capMat.uniforms.uHover.value = p.hoverVal;
      p.capMat.uniforms.uTime.value = t;

      if (state.introActive || exitHidePanels) {
        p.mesh.visible = false; p.capMesh.visible = false; return;
      }

      const spacing = 0.65;
      const delta = (scrollForLayout - i) * spacing;
      const step = C + delta;
      if (step < -0.1 || step > 14.1) { p.mesh.visible = false; return; }

      let fadeOp = 1;
      if (step < 0.4) fadeOp = Math.max(0, step / 0.4);
      if (step > 13.6) fadeOp = Math.max(0, (14 - step) / 0.4);

      const tr = lerpPath(step);
      if (tr.z > 0) tr.x += tr.x * (tr.z / 4.9) * 0.55;

      const op = tr.op * fadeOp;
      p.pivot.position.set(tr.x, tr.y, tr.z);
      p.pivot.rotation.set(tr.rx, Math.atan2(tr.x, tr.z + 0.001), 0.6 * Math.min(1, Math.abs(step - C) / 3) * -1);
      p.mat.uniforms.uOpacity.value = op;
      p.mat.uniforms.uCurvature.value = tr.cv * 0.3;
      p.mat.uniforms.uStretch.value = stretchVal;
      p.mesh.scale.set(tr.W / PW, tr.H / PH, 1);
      p.mesh.visible = op > 0.02;

      const textOp = op * Math.max(0, 1.0 - Math.abs(step - C) * 3.0);
      p.capMat.uniforms.uOpacity.value = textOp;
      p.capMat.uniforms.uCurvature.value = tr.cv * 0.3;
      p.capMat.uniforms.uStretch.value = stretchVal;
      p.capMesh.scale.set(tr.W / PW, tr.H / PH, 1);
      p.capMesh.position.z = 0.04 + Math.min(1, Math.abs(step - C) / 3) * 0.14;
      p.capMesh.visible = textOp > 0.01;
    });

    if (!state.introActive && !state.experienceExitActive) {
      const fi = centerIndex;
      dom.tlProgress.style.width = (Math.max(0, Math.min(1, scrollForLayout / (N - 1))) * 100) + "%";
      const monthIndex = fi % 12;
      const settled = Math.abs(state.scrollTarget - state.scrollCurrent) < 0.02 && Math.abs(state.scrollVel) < 0.0004;
      if (state.lastMonthIndex === null) {
        state.lastMonthIndex = monthIndex; state.lastFiForMonth = fi;
        dom.month.textContent = MONTHS[monthIndex] ?? "Jan";
        if (state.timelineDatesVisible) dom.month.classList.add("date-show");
        state.nextMonthSwitchAt = performance.now();
      } else {
        if (monthIndex !== state.lastMonthIndex) { state.pendingMonthIndex = monthIndex; state.pendingFiForMonth = fi; }
        const now = performance.now();
        if (settled && state.pendingMonthIndex !== null) {
          state.lastMonthIndex = state.pendingMonthIndex; state.lastFiForMonth = state.pendingFiForMonth ?? fi;
          state.pendingMonthIndex = null; state.pendingFiForMonth = null;
          dom.month.textContent = MONTHS[state.lastMonthIndex] ?? "Jan";
          if (state.timelineDatesVisible) dom.month.classList.add("date-show");
        } else if (state.pendingMonthIndex !== null && now >= state.nextMonthSwitchAt) {
          const target = state.pendingMonthIndex!; const targetFi = state.pendingFiForMonth ?? fi;
          state.pendingMonthIndex = null; state.pendingFiForMonth = null;
          state.nextMonthSwitchAt = now + MONTH_SWITCH_COOLDOWN_MS;
          const dir = (state.lastFiForMonth !== null && targetFi < state.lastFiForMonth) ? -1 : 1;
          state.lastFiForMonth = targetFi;
          dom.monthGhost.textContent = MONTHS[state.lastMonthIndex] ?? "Jan";
          dom.monthGhost.classList.remove("leave-left", "leave-right");
          void dom.monthGhost.offsetWidth;
          dom.monthGhost.classList.add(dir > 0 ? "leave-left" : "leave-right");
          dom.month.textContent = MONTHS[target] ?? "Jan";
          if (state.timelineDatesVisible) dom.month.classList.add("date-show");
          dom.month.classList.remove("enter-left", "enter-right");
          void dom.month.offsetWidth;
          dom.month.classList.add(dir > 0 ? "enter-left" : "enter-right");
          state.lastMonthIndex = target;
        }
      }
    }

    if (state.experienceExitActive && exitProgress >= 1) {
      state.experienceExitActive = false; state.introActive = true;
      state.figRotY = 0; state.figPosY = -0.8; state.figScale = 2.6;
      if (figureGroup.value) {
        figureGroup.value.rotation.set(0, 0, 0);
        figureGroup.value.position.set(0, -0.8, 0);
        figureGroup.value.scale.setScalar(2.6);
      }
      state.scrollCurrent = 0; state.scrollTarget = 0; state.scrollVel = 0; state.scrollVelVis = 0;
      dom.tlProgress.style.width = "0%";
      requestAnimationFrame(() => requestAnimationFrame(() => completeExploreReturnToIntroUi(ctx)));
    }

    bg.render();
    renderer.render(scene, cam);
  }

  animate();

  return () => {
    cancelAnimationFrame(raf);
  };
}
