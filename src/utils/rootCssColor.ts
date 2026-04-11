/**
 * Reads `:root` custom properties for Canvas/WebGL (no CSS classes there).
 * Color literals live only in `globals.css`; this file has no palette.
 */

function readVarOnRoot(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Resolved value for `--color-web-*` (unwraps one `var(--palette-*)` if needed). */
export function readRootCssVar(cssVar: string): string {
  if (typeof document === "undefined") return "";
  let v = readVarOnRoot(cssVar);
  const varRef = v.match(/^var\(\s*(--[^)]+)\s*\)$/);
  if (varRef) v = readVarOnRoot(varRef[1]);
  return v;
}

function parseCssColorToRgb(color: string): [number, number, number] {
  const s = color.trim();
  if (!s) return [0, 0, 0];
  if (s.startsWith("#")) {
    let h = s.slice(1);
    if (h.length === 3) {
      h = h
        .split("")
        .map((c) => c + c)
        .join("");
    }
    if (h.length === 8) {
      const n = parseInt(h, 16);
      if (Number.isNaN(n)) return [0, 0, 0];
      return [(n >> 24) & 255, (n >> 16) & 255, (n >> 8) & 255];
    }
    if (h.length === 6) {
      const n = parseInt(h, 16);
      if (Number.isNaN(n)) return [0, 0, 0];
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    return [0, 0, 0];
  }
  const commaRgb = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (commaRgb) {
    return [
      Number(commaRgb[1]),
      Number(commaRgb[2]),
      Number(commaRgb[3]),
    ];
  }
  const spaceRgb = s.match(/rgba?\(\s*(\d+)\s+(\d+)\s+(\d+)/);
  if (spaceRgb) {
    return [
      Number(spaceRgb[1]),
      Number(spaceRgb[2]),
      Number(spaceRgb[3]),
    ];
  }
  return [0, 0, 0];
}

export function rootCssVarToRgba(cssVar: string, alpha: number): string {
  const raw = readRootCssVar(cssVar);
  const [r, g, b] = parseCssColorToRgb(raw);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Hex 0xRRGGBB for THREE-style APIs (e.g. Color.setHex). */
export function rootCssVarToHexInt(cssVar: string): number {
  const raw = readRootCssVar(cssVar);
  const [r, g, b] = parseCssColorToRgb(raw);
  return ((r << 16) | (g << 8) | b) >>> 0;
}
