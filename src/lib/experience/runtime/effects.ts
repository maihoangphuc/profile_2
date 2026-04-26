import { RuntimeContext } from "@/lib/experience/runtime/types";
import { positionSocialLine } from "@/lib/experience/runtime/ui";

export function introLinesDurationMs() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--intro-lines-duration").trim();
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return 2540;
  const ms = raw.endsWith("ms") ? Math.round(n) : Math.round(n * 1000);
  return ms + 40;
}

export function runIntroPageLineEffects(ctx: RuntimeContext) {
  const { dom, timers, animFlags, events } = ctx;
  if (timers.introLineReveal !== undefined) {
    clearTimeout(timers.introLineReveal);
    timers.introLineReveal = undefined;
  }
  dom.introLeft.classList.remove("intro-lines-reveal", "lines-animated");
  void dom.introLeft.offsetHeight;
  dom.social.classList.remove("social-line-entry");
  void dom.sline.offsetHeight;

  const links = Array.from(dom.social.querySelectorAll<HTMLElement>(".soc"));
  const wf = 0.6;

  if (links.length >= 2) {
    const first = links[0]!;
    const last = links[links.length - 1]!;
    const xFirst = first.offsetLeft;
    const xLast = last.offsetLeft;
    dom.social.style.setProperty("--sline-x-from", `${xLast}px`);
    dom.social.style.setProperty("--sline-x-to", `${xFirst}px`);
    dom.social.style.setProperty("--sline-x-wf", String(wf));
  } else if (links.length === 1) {
    dom.sline.style.transition = "none";
    positionSocialLine(dom, links[0]!, wf);
    void dom.sline.offsetHeight;
    dom.sline.style.transition = "";
  }

  const tw = dom.introRuleTrack.offsetWidth;
  dom.introRuleTrack.style.setProperty("--intro-rule-final-scale", tw > 0 ? String(15 / tw) : "0.04");

  dom.introLeft.classList.add("lines-animated", "intro-lines-reveal");
  const revealMs = introLinesDurationMs();
  animFlags.introLinesAnimEndMs = performance.now() + revealMs;
  // Previously we removed 'intro-lines-reveal' here, but we now keep it
  // to ensure the orchestrated sequence (which may exceed revealMs) stays visible.
  timers.introLineReveal = window.setTimeout(() => {
    timers.introLineReveal = undefined;
  }, revealMs);

  if (links.length >= 2) {
    const handler = (ev: AnimationEvent) => {
      if (ev.target !== dom.sline || ev.animationName !== "social-line-draw") return;
      positionSocialLine(dom, events.getActiveSocialLink()!, wf);
      dom.social.classList.remove("social-line-entry");
      dom.sline.removeEventListener("animationend", handler);
    };
    dom.sline.addEventListener("animationend", handler);
    dom.social.classList.add("social-lines-animated", "social-line-entry");
  } else if (links.length === 1) {
    dom.social.classList.add("social-lines-animated");
  }
}

export function replaySocialLineEffect(ctx: RuntimeContext) {
  const { dom, events } = ctx;
  const links = Array.from(dom.social.querySelectorAll<HTMLElement>(".soc"));
  if (links.length === 0) return;
  const wf = 0.6;
  dom.social.classList.add("social-lines-animated");
  dom.social.classList.remove("social-line-entry");
  void dom.sline.offsetHeight;
  positionSocialLine(dom, events.getActiveSocialLink()!, wf);
  const handler = (ev: AnimationEvent) => {
    if (ev.target !== dom.sline || ev.animationName !== "social-line-draw") return;
    positionSocialLine(dom, events.getActiveSocialLink()!, wf);
    dom.social.classList.remove("social-line-entry");
    dom.sline.removeEventListener("animationend", handler);
  };
  dom.sline.addEventListener("animationend", handler);
  dom.social.classList.add("social-line-entry");
}
