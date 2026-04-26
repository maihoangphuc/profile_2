import * as THREE from "three";
import { N } from "@/constants/experience";

export function createExperienceState() {
  return {
    introActive: true,
    startupIntroSpinActive: false,
    startupIntroSpinStartMs: 0,
    experienceEntryActive: false,
    experienceEntryStartMs: 0,
    timelineDatesVisible: false,
    entryScrollFrom: 0,
    entryScrollTo: 0,
    isPaused: false,
    scrolled: false,
    scrollCurrent: 0,
    scrollTarget: 0,
    scrollVel: 0,
    scrollVelVis: 0,
    figRotY: 0,
    figScale: 2.6,
    figPosY: -0.8,
    lastMonthIndex: null as number | null,
    lastFiForMonth: null as number | null,
    pendingMonthIndex: null as number | null,
    pendingFiForMonth: null as number | null,
    nextMonthSwitchAt: 0,
    experienceExitActive: false,
    experienceExitStartMs: 0,
    exitScroll0: 0,
    exitFigRot0: 0,
    exitFigRot1: 0,
    exitWasEntryMidSpin: false,
    scrollForLayoutLast: 0,
    exitFigPosY0: -0.8,
    exitFigScale0: 2.6,
    exitBgYaw0: 0,
    bgYawLast: 0,
    modelLoadTargetPct: 0,
    modelLoadRealFloor: 0,
    modelLoadCrawlPct: 0,
    modelLoadDisplayPct: 0,
    lastRenderedLoadPct: -1,
    lastModelLoadUiMs: 0,
  };
}

export const STARTUP_INTRO_SPIN_MS = 6800;
export const STARTUP_INTRO_MODEL_SCALE_FROM = 1.75;
export const STARTUP_INTRO_MODEL_SCALE_OVERSHOOT = 2.71;
export const STARTUP_INTRO_MODEL_Y_FROM = -1.24;
export const STARTUP_INTRO_MODEL_Y_OVERSHOOT = -0.76;
export const STARTUP_INTRO_MODEL_Z_FROM = -1.35;
export const STARTUP_INTRO_MODEL_Z_OVERSHOOT = 0.08;
export const EXPERIENCE_ENTRY_MS = 2650;
export const EXPERIENCE_EXIT_MS = 2650;
export const EXPERIENCE_EXIT_MIN_SCROLL_TRAVEL = 5;
export const EXPERIENCE_EXIT_SCROLL_DEEP_CAP = -12;
export const EXPERIENCE_EXIT_UNDERSHOOT_SPLIT = 0.99;
export const MONTH_SWITCH_COOLDOWN_MS = 620;
