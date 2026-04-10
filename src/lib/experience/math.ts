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

