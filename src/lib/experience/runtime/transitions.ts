import { RuntimeContext } from "@/lib/experience/runtime/types";
import { EXPERIENCE_ENTRY_MS, EXPERIENCE_EXIT_MS, EXPERIENCE_EXIT_MIN_SCROLL_TRAVEL, EXPERIENCE_EXIT_SCROLL_DEEP_CAP, EXPERIENCE_EXIT_UNDERSHOOT_SPLIT } from "@/lib/experience/runtime/world";
import { exitRotationTargetAtLeastOneTurn } from "@/lib/experience/runtime/math";
import { runIntroPageLineEffects, replaySocialLineEffect } from "@/lib/experience/runtime/effects";

export function enterExperience(ctx: RuntimeContext) {
  const { dom, state, animFlags, timers } = ctx;
  if (!state.introActive || animFlags.exploreCommitPending) return;
  animFlags.exploreCommitPending = true;
  dom.social.classList.add("hidden");
  if (timers.introLineReveal !== undefined) {
    clearTimeout(timers.introLineReveal);
    timers.introLineReveal = undefined;
  }
  const waitMs = Math.max(0, Math.ceil(animFlags.introLinesAnimEndMs - performance.now()));
  const proceed = () => {
    timers.exploreCommit = undefined;
    animFlags.exploreCommitPending = false;
    state.introActive = false;
    state.experienceEntryActive = true;
    state.experienceEntryStartMs = performance.now();
    state.entryScrollTo = state.scrollTarget;
    state.entryScrollFrom = state.scrollTarget - 8;
    if (timers.introLineReveal !== undefined) {
      clearTimeout(timers.introLineReveal);
      timers.introLineReveal = undefined;
    }
    if (timers.timelineReveal !== undefined) {
      clearTimeout(timers.timelineReveal);
      timers.timelineReveal = undefined;
    }
    state.timelineDatesVisible = false;
    dom.timeline.classList.remove("date-show");
    document.getElementById("year-lbl")?.classList.remove("date-show");
    dom.month.classList.remove("date-show");
    dom.introLeft.classList.remove("intro-lines-reveal", "lines-animated");
    dom.introLeft.classList.add("hidden");
    dom.introRight.classList.add("hidden");
    dom.bgName.classList.add("hidden");
    state.lastMonthIndex = null;
    state.lastFiForMonth = null;
    state.pendingMonthIndex = null;
    state.pendingFiForMonth = null;
    state.nextMonthSwitchAt = 0;
    dom.month.classList.remove("enter-left", "enter-right");
    dom.monthGhost.classList.remove("leave-left", "leave-right");
    timers.timelineReveal = window.setTimeout(() => {
      timers.timelineReveal = undefined;
      state.timelineDatesVisible = true;
      dom.timeline.classList.add("date-show");
      dom.social.classList.remove("hidden");
      replaySocialLineEffect(ctx);
      document.getElementById("year-lbl")?.classList.add("date-show");
      dom.month.classList.add("date-show");
    }, EXPERIENCE_ENTRY_MS);
  };
  if (waitMs > 0) timers.exploreCommit = window.setTimeout(proceed, waitMs);
  else proceed();
}

export function returnToExploreIntro(ctx: RuntimeContext) {
  const { dom, state, animFlags, timers, figureGroup } = ctx;
  if (state.introActive || state.experienceExitActive) return;
  if (timers.exploreCommit !== undefined) {
    clearTimeout(timers.exploreCommit);
    timers.exploreCommit = undefined;
  }
  animFlags.exploreCommitPending = false;
  if (timers.timelineReveal !== undefined) {
    clearTimeout(timers.timelineReveal);
    timers.timelineReveal = undefined;
  }
  state.timelineDatesVisible = false;
  if (timers.introLineReveal !== undefined) {
    clearTimeout(timers.introLineReveal);
    timers.introLineReveal = undefined;
  }
  dom.timeline.classList.remove("date-show");
  dom.social.classList.add("hidden");
  document.getElementById("year-lbl")?.classList.remove("date-show");
  dom.month.classList.remove("date-show");
  state.lastMonthIndex = null;
  state.lastFiForMonth = null;
  state.pendingMonthIndex = null;
  state.pendingFiForMonth = null;
  state.nextMonthSwitchAt = 0;
  dom.month.classList.remove("enter-left", "enter-right");
  dom.monthGhost.classList.remove("leave-left", "leave-right");

  state.exitScroll0 = state.experienceEntryActive ? state.scrollForLayoutLast : state.scrollCurrent;
  state.exitFigRot0 = figureGroup.value ? figureGroup.value.rotation.y : state.figRotY;
  state.exitWasEntryMidSpin = state.experienceEntryActive;
  if (state.exitWasEntryMidSpin) {
    const TAU = Math.PI * 2;
    state.exitFigRot1 = Math.ceil(state.exitFigRot0 / TAU + 1e-9) * TAU;
  } else if (Math.abs(state.scrollCurrent) < 0.1) {
    state.exitFigRot1 = state.exitFigRot0 + Math.PI * 2;
  } else {
    state.exitFigRot1 = exitRotationTargetAtLeastOneTurn(state.exitFigRot0);
  }
  state.exitFigPosY0 = state.figPosY;
  state.exitFigScale0 = state.figScale;
  state.exitBgYaw0 = state.bgYawLast;
  state.experienceExitStartMs = performance.now();
  state.experienceExitActive = true;
  state.experienceEntryActive = false;
  state.scrolled = false;
  state.scrollVel = 0;
  state.scrollVelVis = 0;
  state.scrollTarget = 0;
}

export function completeExploreReturnToIntroUi(ctx: RuntimeContext) {
  const { dom } = ctx;
  dom.introLeft.classList.remove("intro-lines-reveal", "lines-animated");
  void dom.introLeft.offsetHeight;
  dom.introLeft.classList.remove("hidden");
  dom.introRight.classList.remove("hidden");
  dom.bgName.classList.remove("hidden");
  dom.social.classList.remove("hidden");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      runIntroPageLineEffects(ctx);
    });
  });
}

export function scheduleIntroLinesWhenUiVisible(ctx: RuntimeContext) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      runIntroPageLineEffects(ctx);
    });
  });
}
