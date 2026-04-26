import * as THREE from "three";

export type Dom = {
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

export type State = {
  introActive: boolean;
  startupIntroSpinActive: boolean;
  startupIntroSpinStartMs: number;
  experienceEntryActive: boolean;
  experienceEntryStartMs: number;
  timelineDatesVisible: boolean;
  entryScrollFrom: number;
  entryScrollTo: number;
  isPaused: boolean;
  scrolled: boolean;
  scrollCurrent: number;
  scrollTarget: number;
  scrollVel: number;
  scrollVelVis: number;
  figRotY: number;
  figScale: number;
  figPosY: number;
  lastMonthIndex: number | null;
  lastFiForMonth: number | null;
  pendingMonthIndex: number | null;
  pendingFiForMonth: number | null;
  nextMonthSwitchAt: number;
  experienceExitActive: boolean;
  experienceExitStartMs: number;
  exitScroll0: number;
  exitFigRot0: number;
  exitFigRot1: number;
  exitWasEntryMidSpin: boolean;
  scrollForLayoutLast: number;
  exitFigPosY0: number;
  exitFigScale0: number;
  exitBgYaw0: number;
  bgYawLast: number;
  modelLoadTargetPct: number;
  modelLoadRealFloor: number;
  modelLoadCrawlPct: number;
  modelLoadDisplayPct: number;
  lastRenderedLoadPct: number;
  lastModelLoadUiMs: number;
  isDragging: boolean;
  lastX: number;
  mouseX: number;
  mouseY: number;
};

export type GretaBackground = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  material: THREE.ShaderMaterial;
  resize: () => void;
  render: () => void;
};

export type PanelData = {
  mesh: THREE.Mesh;
  capMesh: THREE.Mesh;
  mat: THREE.ShaderMaterial;
  capMat: THREE.ShaderMaterial;
  pivot: THREE.Group;
  hoverVal?: number;
  targetHover?: number;
};

export type RuntimeContext = {
  dom: Dom;
  state: State;
  bg: GretaBackground;
  scene: THREE.Scene;
  cam: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  raycaster: THREE.Raycaster;
  mouse: THREE.Vector2;
  pCtx: CanvasRenderingContext2D;
  pState: any;
  panels: PanelData[];
  figureGroup: { value: THREE.Group | null };
  timers: {
    introLineReveal?: number;
    exploreCommit?: number;
    timelineReveal?: number;
  };
  animFlags: {
    introLinesAnimEndMs: number;
    exploreCommitPending: boolean;
  };
  events: any;
};
