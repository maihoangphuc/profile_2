import { Dom } from "@/lib/experience/runtime/types";
import { positionSocialLine } from "@/lib/experience/runtime/ui";
import { exitRotationTargetAtLeastOneTurn } from "@/lib/experience/runtime/math";
import { EXPERIENCE_ENTRY_MS, EXPERIENCE_EXIT_MS } from "@/lib/experience/runtime/world";

export function bindEvents(
  dom: Dom,
  state: any, // Use proper state type in index.ts
  callbacks: {
    onResize: () => void;
    onTogglePaused: () => void;
    runIntroPageLineEffects: () => void;
    replaySocialLineEffect: () => void;
  }
) {
  const links = Array.from(dom.social.querySelectorAll<HTMLElement>(".soc"));
  const socDefault = dom.social.querySelector<HTMLElement>('.soc[data-key="fb"]');
  let activeSocialLink = socDefault ?? links[0];

  links.forEach((el) => {
    el.addEventListener("mouseenter", () => positionSocialLine(dom, el, 1));
    el.addEventListener("focus", () => {
      activeSocialLink = el;
      positionSocialLine(dom, activeSocialLink, 0.6);
    });
    el.addEventListener("pointerdown", () => {
      activeSocialLink = el;
      positionSocialLine(dom, activeSocialLink, 0.6);
    });
  });

  dom.social.addEventListener("mouseleave", () => {
    if (activeSocialLink) positionSocialLine(dom, activeSocialLink, 0.6);
    dom.sline.style.opacity = "0.85";
  });

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (!state.scrolled) state.scrolled = true;
    if (state.introActive || state.experienceExitActive || state.experienceEntryActive) return;
    state.scrollVel += e.deltaY * 0.00045;
  };
  window.addEventListener("wheel", onWheel, { passive: false });

  const onMouseDown = (e: MouseEvent) => {
    state.isDragging = true;
    state.lastX = e.clientX;
    if (!state.scrolled) state.scrolled = true;
  };
  const onMouseUp = () => {
    state.isDragging = false;
  };
  const onMouseMove = (e: MouseEvent) => {
    state.mouseX = (e.clientX / innerWidth) * 2 - 1;
    state.mouseY = -(e.clientY / innerHeight) * 2 + 1;
    if (state.isDragging && !state.introActive && !state.experienceExitActive && !state.experienceEntryActive) {
      const dx = state.lastX - e.clientX;
      state.lastX = e.clientX;
      state.scrollVel += dx * 0.002;
    }
  };
  window.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mouseup", onMouseUp);
  window.addEventListener("mousemove", onMouseMove);

  dom.soundBtn.addEventListener("click", callbacks.onTogglePaused);
  dom.soundBtn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      callbacks.onTogglePaused();
    }
  });

  window.addEventListener("resize", callbacks.onResize);

  return {
    onWheel,
    onMouseDown,
    onMouseUp,
    onMouseMove,
    teardown: () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", callbacks.onResize);
      dom.soundBtn.removeEventListener("click", callbacks.onTogglePaused);
    },
    getActiveSocialLink: () => activeSocialLink,
    setActiveSocialLink: (val: HTMLElement) => { activeSocialLink = val; }
  };
}
