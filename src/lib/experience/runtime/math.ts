export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

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
