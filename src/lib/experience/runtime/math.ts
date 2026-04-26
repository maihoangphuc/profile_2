import { PATH, type PathPoint } from "@/constants/experience";

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number) {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

export function lerpPath(step: number): PathPoint {
  const s = Math.max(0, Math.min(14, step));
  const i = Math.min(13, Math.floor(s));
  const t = s - i;

  const i0 = Math.max(0, i - 1);
  const i1 = i;
  const i2 = Math.min(14, i + 1);
  const i3 = Math.min(14, i + 2);

  const a = PATH[i0];
  const b = PATH[i1];
  const c = PATH[i2];
  const d = PATH[i3];

  const cr = (k: keyof PathPoint) => catmullRom(a[k], b[k], c[k], d[k], t);
  return {
    x: cr("x"),
    y: cr("y"),
    z: cr("z"),
    rx: cr("rx"),
    rz: cr("rz"),
    W: cr("W"),
    H: cr("H"),
    op: cr("op"),
    cv: cr("cv"),
  };
}

/** Gentle in/out (zero 1st & 2nd derivative at 0 and 1) for explore entry. */
export function smootherstep01(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
}

/** Cinematic startup: approach quickly, then settle softly. */
export function startupApproachSettle01(t: number) {
  const x = Math.min(1, Math.max(0, t));
  const settleStart = 0.72;
  if (x <= settleStart) {
    return { approach: smootherstep01(x / settleStart), settle: 0 };
  }
  return {
    approach: 1,
    settle: Math.pow(
      smootherstep01((x - settleStart) / (1 - settleStart)),
      0.85,
    ),
  };
}

/**
 * Góc tương đương 0 (k·2π) sao cho đích luôn lớn hơn start ít nhất một vòng
 * (xoay trái → phải).
 */
export function exitRotationTargetAtLeastOneTurn(start: number): number {
  const TAU = Math.PI * 2;
  if (!Number.isFinite(start)) return TAU;
  const k = Math.ceil((start + TAU) / TAU + 1e-9);
  return k * TAU;
}
