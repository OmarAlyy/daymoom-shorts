// Deterministic versions of the bible's CSS keyframes (brand/character-bible.html).
// Every value is a pure function of time in seconds, so any frame renders on its own.
import { Easing } from 'remotion';

export type EaseFn = (t: number) => number;
export const EIO: EaseFn = Easing.bezier(0.42, 0, 0.58, 1); // CSS ease-in-out
export const EOUT: EaseFn = Easing.bezier(0, 0, 0.58, 1); // CSS ease-out
export const EIN: EaseFn = Easing.bezier(0.42, 0, 1, 1); // CSS ease-in
export const ENTER: EaseFn = Easing.bezier(0.2, 0.9, 0.3, 1.3); // bible "enter" overshoot

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const mod = (a: number, n: number) => ((a % n) + n) % n;

/** CSS `alternate` loop: 0→1→0 over 2×dur, eased each way. */
export const alt = (t: number, dur: number, ease: EaseFn = EIO, delay = 0) => {
  const u = mod(t - delay, 2 * dur) / dur;
  return ease(u <= 1 ? u : 2 - u);
};

/** CSS `normal` loop: raw 0..1 phase. Returns -1 before the delay has elapsed. */
export const phase = (t: number, dur: number, delay = 0) => (t < delay ? -1 : mod(t - delay, dur) / dur);

/** Keyframe interpolation with the timing function applied per segment, like CSS. */
export const kf = (u: number, stops: [number, number][], ease: EaseFn = EIO) => {
  if (u <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    const [a, va] = stops[i - 1];
    const [b, vb] = stops[i];
    if (u <= b) return lerp(va, vb, ease((u - a) / (b - a || 1)));
  }
  return stops[stops.length - 1][1];
};

export type Xf = { tx: number; ty: number; rot: number; sx: number; sy: number };
export const ID: Xf = { tx: 0, ty: 0, rot: 0, sx: 1, sy: 1 };
export const mixXf = (a: Xf, b: Xf, k: number): Xf => ({
  tx: lerp(a.tx, b.tx, k), ty: lerp(a.ty, b.ty, k), rot: lerp(a.rot, b.rot, k), sx: lerp(a.sx, b.sx, k), sy: lerp(a.sy, b.sy, k),
});
/** SVG transform string for an Xf about pivot (ox, oy). Order matches CSS translate→rotate→scale. */
export const xfStr = (x: Xf, ox: number, oy: number) =>
  `translate(${ox + x.tx} ${oy + x.ty}) rotate(${x.rot}) scale(${x.sx} ${x.sy}) translate(${-ox} ${-oy})`;

export type BodyAnim = 'float' | 'bounce' | 'jitter' | 'sink' | 'breathe' | 'tilt' | 'pulse' | 'drift' | 'scan';

/** Body-group motion, pivot (120, 218). Durations from BODY_ANIM in the bible. */
export const bodyXf = (anim: BodyAnim, t: number): Xf => {
  switch (anim) {
    case 'float': { const p = alt(t, 3.2); return { ...ID, ty: -9 * p }; }
    case 'bounce': {
      const u = phase(t, 1.1);
      const S = (vals: number[]) => kf(u, [[0, vals[0]], [0.25, vals[1]], [0.5, vals[2]], [0.65, vals[3]], [0.8, vals[4]], [1, vals[5]]], EOUT);
      return { tx: 0, ty: S([0, -28, 0, -6, 0, 0]), rot: 0, sx: S([1, 0.95, 1.07, 1, 1.02, 1]), sy: S([1, 1.06, 0.93, 1, 0.98, 1]) };
    }
    case 'jitter': { const u = phase(t, 0.18); return { ...ID, tx: kf(u, [[0, 0], [0.25, -2], [0.75, 2], [1, 0]]) }; }
    case 'sink': { const p = alt(t, 3); return { ...ID, ty: 12 * p, rot: -4 * p }; }
    case 'breathe': { const p = alt(t, 3.6); return { ...ID, sx: 1 + 0.03 * p, sy: 1 - 0.04 * p }; }
    case 'tilt': { const p = alt(t, 2.6); return { ...ID, rot: -5 + 10 * p }; }
    case 'pulse': { const p = alt(t, 0.9); return { ...ID, sx: 1 + 0.045 * p, sy: 1 + 0.045 * p }; }
    case 'drift': { const p = alt(t, 2.4); return { ...ID, tx: 10 * p, ty: -16 * p, rot: 4 * p }; }
    case 'scan': { const p = alt(t, 1.6); return { ...ID, tx: -9 + 18 * p, rot: -3 + 6 * p }; }
    default: return ID;
  }
};
