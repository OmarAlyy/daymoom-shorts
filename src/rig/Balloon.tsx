// Daymoom Balloon — character rig v2.
// Drawn from the owner's style guide (brand/style-guide.md): flat vector, no outline,
// no gradient, no shadow; egg body wider at the top (width ≈ 83% of height);
// big touching black sunglasses, never any eyes or nose; short expressive brows;
// a simple mouth line; thin noodle arms with dot hands; a thin wavy string about
// half the body height.
//
// Acting is parametric instead of a fixed set of states: every pose is a set of
// numbers (brows, mouth, hands, tilt, lean, air…) and the rig springs between
// them with overlap — brows lead, mouth follows 2 frames later, arms 4 frames
// later — so motion reads as a thought, not a cut.
import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const INK = '#1C1814';
export const CREAM = '#F4EFE6';
export const BODY = {
  blue: { body: '#4A86D4', knot: '#3469B0' },
  coral: { body: '#F2867A', knot: '#D4675C' },
  mint: { body: '#86D1B0', knot: '#62B08F' },
  sun: { body: '#F2BE4A', knot: '#D29F2E' },
  lilac: { body: '#A98BD0', knot: '#8B6DB4' },
  teal: { body: '#2FA59B', knot: '#1F8077' },
  orange: { body: '#D9431E', knot: '#B8381A' },
} as const;
export type BodyColor = keyof typeof BODY;

// ---------------------------------------------------------------- pose model
export type Brow = { y: number; a: number; c: number }; // lift (−up), inner-end angle (+ = inner up / worried), arch
export type Pose = {
  browL: Brow; browR: Brow;
  mouth: { w: number; c: number; open: number; skew: number; y: number }; // width, curve (+smile), open 0..1, skew (+ = right side up)
  handL: [number, number]; handR: [number, number]; // hand targets in body space
  waveL: number; waveR: number; // wave amplitude (deg-ish)
  tilt: number; lean: number; lift: number; // whole-body rotation, x shift, y shift
  air: number; // 1 = full, < 1 = deflating (uniform shrink + droop)
  glasses: { tilt: number; y: number };
  hold?: 'none' | 'flame' | 'shield' | 'phone' | 'trophy' | 'clock';
  slack: number; // 0 taut string, 1 limp
};

const B = (y: number, a: number, c: number): Brow => ({ y, a, c });
const REST_L: [number, number] = [-98, 64], REST_R: [number, number] = [98, 64];
export const NEUTRAL: Pose = {
  browL: B(0, 0, 2), browR: B(0, 0, 2),
  mouth: { w: 30, c: 5, open: 0, skew: 0, y: 0 },
  handL: REST_L, handR: REST_R, waveL: 0, waveR: 0,
  tilt: 0, lean: 0, lift: 0, air: 1, glasses: { tilt: 0, y: 0 }, hold: 'none', slack: 0,
};

/** A library of expressions/poses. Free to extend per video — these are starting points. */
export const P: Record<string, Partial<Pose>> = {
  calm: {},
  smile: { mouth: { w: 34, c: 9, open: 0, skew: 0, y: 0 }, browL: B(-2, -3, 4), browR: B(-2, -3, 4) },
  cool: { mouth: { w: 28, c: 6, open: 0, skew: 5, y: 0 }, browL: B(1, -4, 1), browR: B(-5, 2, 4), tilt: 3, lean: 6 },
  grin: { mouth: { w: 40, c: 14, open: 0.8, skew: 0, y: 0 }, browL: B(-6, -6, 6), browR: B(-6, -6, 6) },
  joy: { mouth: { w: 44, c: 16, open: 1, skew: 0, y: 0 }, browL: B(-10, -4, 7), browR: B(-10, -4, 7), handL: [-120, -70], handR: [120, -70], lift: -12 },
  wave: { mouth: { w: 34, c: 10, open: 0.25, skew: 0, y: 0 }, browL: B(-5, -3, 5), browR: B(-5, -3, 5), handR: [122, -60], waveR: 1, tilt: -3 },
  think: { mouth: { w: 18, c: 0, open: 0, skew: -4, y: 2 }, browL: B(-8, 4, 5), browR: B(2, -8, 0), handR: [26, 58], tilt: 5, glasses: { tilt: 4, y: 0 } },
  doubt: { mouth: { w: 22, c: -2, open: 0, skew: 6, y: 0 }, browL: B(2, -6, 0), browR: B(-9, 3, 5), tilt: -4 },
  surprised: { mouth: { w: 14, c: 0, open: 1, skew: 0, y: 3 }, browL: B(-14, 0, 7), browR: B(-14, 0, 7), handL: [-112, 10], handR: [112, 10], lift: -10 },
  worried: { mouth: { w: 26, c: -3, open: 0.15, skew: 0, y: 2 }, browL: B(-2, 16, 1), browR: B(-2, 16, 1), handL: [-40, 66], handR: [40, 66] },
  sad: { mouth: { w: 24, c: -8, open: 0, skew: 0, y: 4 }, browL: B(3, 18, 0), browR: B(3, 18, 0), handL: [-86, 92], handR: [86, 92], tilt: -6, air: 0.86, lift: 26, glasses: { tilt: -6, y: 3 }, slack: 1 },
  determined: { mouth: { w: 26, c: 3, open: 0, skew: 4, y: 0 }, browL: B(4, -16, 0), browR: B(4, -16, 0), handR: [104, -40], lean: 4 },
  proud: { mouth: { w: 38, c: 12, open: 0.5, skew: 0, y: 0 }, browL: B(-6, -6, 5), browR: B(-6, -6, 5), handL: [-118, -76], handR: [118, -76], lift: -16 },
  shrug: { mouth: { w: 24, c: 0, open: 0, skew: -5, y: 0 }, browL: B(-10, 4, 5), browR: B(-10, 4, 5), handL: [-122, 2], handR: [122, 2], tilt: 3 },
  point: { mouth: { w: 30, c: 7, open: 0.2, skew: 0, y: 0 }, browL: B(-4, -2, 4), browR: B(-4, -2, 4), handR: [138, 18] },
  hug: { mouth: { w: 26, c: 6, open: 0, skew: 0, y: 0 }, browL: B(-1, 12, 2), browR: B(-1, 12, 2), handL: [-40, 40], handR: [40, 40], tilt: -3 },
  listen: { mouth: { w: 20, c: 3, open: 0, skew: 0, y: 0 }, browL: B(-6, 6, 4), browR: B(-6, 6, 4), tilt: 8, lean: -6 },
  sleep: { mouth: { w: 14, c: 3, open: 0, skew: 0, y: 2 }, browL: B(4, -2, -2), browR: B(4, -2, -2), tilt: -8, glasses: { tilt: 0, y: 5 }, lift: 6 },
};

export const pose = (...parts: Partial<Pose>[]): Pose => Object.assign({}, NEUTRAL, ...parts);

export type Key = { at: number; pose: Pose };

// ---------------------------------------------------------------- blending
type Num = number;
const mixN = (a: Num, b: Num, k: number) => a + (b - a) * k;
const mixBrow = (a: Brow, b: Brow, k: number): Brow => ({ y: mixN(a.y, b.y, k), a: mixN(a.a, b.a, k), c: mixN(a.c, b.c, k) });
const mixPose = (a: Pose, b: Pose, k: { face: number; mouth: number; arms: number; body: number }): Pose => ({
  browL: mixBrow(a.browL, b.browL, k.face), browR: mixBrow(a.browR, b.browR, k.face),
  mouth: { w: mixN(a.mouth.w, b.mouth.w, k.mouth), c: mixN(a.mouth.c, b.mouth.c, k.mouth), open: mixN(a.mouth.open, b.mouth.open, k.mouth), skew: mixN(a.mouth.skew, b.mouth.skew, k.mouth), y: mixN(a.mouth.y, b.mouth.y, k.mouth) },
  handL: [mixN(a.handL[0], b.handL[0], k.arms), mixN(a.handL[1], b.handL[1], k.arms)],
  handR: [mixN(a.handR[0], b.handR[0], k.arms), mixN(a.handR[1], b.handR[1], k.arms)],
  waveL: mixN(a.waveL, b.waveL, k.arms), waveR: mixN(a.waveR, b.waveR, k.arms),
  tilt: mixN(a.tilt, b.tilt, k.body), lean: mixN(a.lean, b.lean, k.body), lift: mixN(a.lift, b.lift, k.body),
  air: mixN(a.air, b.air, k.body), slack: mixN(a.slack, b.slack, k.body),
  glasses: { tilt: mixN(a.glasses.tilt, b.glasses.tilt, k.face), y: mixN(a.glasses.y, b.glasses.y, k.face) },
  hold: k.arms > 0.5 ? b.hold : a.hold,
});

/** Evaluate the keyed performance at a frame: springs between keys, with face-first overlap. */
export const usePerformance = (keys: Key[]) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  let cur = keys[0].pose;
  let squash = 0;
  for (let i = 1; i < keys.length; i++) {
    const f0 = keys[i].at * fps;
    if (frame < f0) break;
    const sp = (lag: number, damping = 13, stiffness = 140) => spring({ frame: frame - f0 - lag, fps, config: { damping, stiffness, mass: 0.9 } });
    const k = { face: sp(0, 16, 200), mouth: sp(2, 16, 200), arms: sp(4, 11, 120), body: sp(1, 12, 110) };
    // anticipation squash at each change: volume-kept, ≤ 3%
    const d = frame - f0;
    squash = d < 10 ? Math.sin((d / 10) * Math.PI) * 0.03 : squash;
    cur = mixPose(cur, keys[i].pose, k);
  }
  return { p: cur, squash, frame, fps };
};

// ---------------------------------------------------------------- geometry
const EGG_H = 100; // half height
const EGG = (() => {
  // x = a·cos t·(1 − k·sin t), y = b·sin t (y down → wider at the top)
  const k = 0.13, n = 72;
  const raw = Array.from({ length: n }, (_, i) => { const t = (i / n) * Math.PI * 2; return [Math.cos(t) * (1 - k * Math.sin(t)), Math.sin(t)]; });
  const maxX = Math.max(...raw.map((p) => p[0]));
  const a = (0.83 * EGG_H) / maxX; // width = 83% of height
  return raw.map(([x, y]) => [x * a, y * EGG_H]);
})();
const smoothClosed = (pts: number[][]) => {
  // Catmull-Rom → cubic Bézier, closed
  const n = pts.length;
  let d = `M${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(2)} ${c1[1].toFixed(2)} ${c2[0].toFixed(2)} ${c2[1].toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d + 'Z';
};
const BODY_PATH = smoothClosed(EGG);
const halfWidthAt = (y: number) => {
  let best = 0;
  for (const [x, yy] of EGG) if (Math.abs(yy - y) < 9 && x > best) best = x;
  return best;
};

const LENS_R = 27, LENS_X = 28.5, GLASS_Y = -22;

type RigProps = {
  keys: Key[];
  color?: BodyColor;
  dark?: boolean; // dark ground → cream arms and string
  size?: number; // rendered body height in px
  glints?: number[]; // seconds: signature glint
  lens?: React.ReactNode; // reflection in the lenses (lens space, r = LENS_R)
  floatAmp?: number;
};

/** The rig. Rendered centred on its body centre; place it with a wrapper. */
export const BalloonRig: React.FC<RigProps> = ({ keys, color = 'blue', dark = true, size = 420, glints = [], lens, floatAmp = 7 }) => {
  const { p, squash, frame, fps } = usePerformance(keys);
  const t = frame / fps;
  const C = BODY[color];
  const LN = dark ? CREAM : INK;
  const uid = React.useId().replace(/:/g, '');

  // idle life: float, breathing, brow "blinks" (a quick flick every few seconds)
  const float = Math.sin(t * 2 * Math.PI / 3.4) * floatAmp;
  const vel = Math.cos(t * 2 * Math.PI / 3.4); // for string follow-through
  const blinkPhase = (t + 0.7) % 3.9;
  const blink = blinkPhase < 0.22 ? Math.sin((blinkPhase / 0.22) * Math.PI) * -4 : 0;
  const air = p.air;
  const sx = air * (1 + squash), sy = air * (1 - squash);

  // ---- brows
  const brow = (side: -1 | 1, b: Brow) => {
    const cx = side * LENS_X, by = GLASS_Y - LENS_R - 11 + b.y + blink;
    const half = 13;
    const inner = [cx - side * half, by - b.a * 0.45], outer = [cx + side * half, by + b.a * 0.45];
    const ctrl = [(inner[0] + outer[0]) / 2, (inner[1] + outer[1]) / 2 - b.c];
    return <path d={`M${inner[0]} ${inner[1]}Q${ctrl[0]} ${ctrl[1]} ${outer[0]} ${outer[1]}`} stroke={INK} strokeWidth={5.5} strokeLinecap="round" fill="none" />;
  };
  // ---- mouth
  const m = p.mouth, my = 36 + m.y;
  const l = [-m.w / 2, my + m.skew / 2], r = [m.w / 2, my - m.skew / 2]; // +skew lifts the right corner
  const mouthTop = `M${l[0]} ${l[1]}Q0 ${my + m.c} ${r[0]} ${r[1]}`;
  const mouth = m.open > 0.05 && m.w < 20
    ? <ellipse cx={0} cy={my + 4} rx={4 + m.w * 0.35} ry={5 + 9 * m.open} fill={INK} />
    : m.open > 0.05
    ? <path d={`${mouthTop}Q0 ${my + m.c + 6 + 18 * m.open} ${l[0]} ${l[1]}Z`} fill={INK} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    : <path d={mouthTop} stroke={INK} strokeWidth={5} strokeLinecap="round" fill="none" />;

  // ---- glasses (+ signature glint)
  const sig = glints.map((g) => t - g).filter((d) => d >= 0 && d < 0.55).sort((a, b) => a - b)[0];
  const shineOp = sig !== undefined ? 0.55 + 0.45 * Math.sin((sig / 0.55) * Math.PI) : 0.55;
  const sweep = sig !== undefined ? (sig / 0.55) : -1; // a bright band sweeping across the lenses
  const lensEl = (cx: number) => (
    <g key={cx}>
      <circle cx={cx} cy={GLASS_Y} r={LENS_R} fill={INK} />
      <clipPath id={`${uid}c${cx}`}><circle cx={cx} cy={GLASS_Y} r={LENS_R - 1} /></clipPath>
      <g clipPath={`url(#${uid}c${cx})`}>
        {lens ? <g transform={`translate(${cx} ${GLASS_Y})`}>{lens}</g> : null}
        {sweep >= 0 ? <rect x={cx - 60 + sweep * 120} y={GLASS_Y - 40} width={10} height={80} fill={CREAM} opacity={0.5} transform={`rotate(35 ${cx} ${GLASS_Y})`} /> : null}
      </g>
      <path d={`M${cx - 17} ${GLASS_Y - 2}L${cx - 6} ${GLASS_Y - 14}`} stroke={CREAM} strokeWidth={3.4} strokeLinecap="round" opacity={shineOp} />
      <path d={`M${cx - 13} ${GLASS_Y + 6}L${cx + 1} ${GLASS_Y - 9}`} stroke={CREAM} strokeWidth={2.4} strokeLinecap="round" opacity={shineOp * 0.8} />
      <circle cx={cx + 12} cy={GLASS_Y + 12} r={2.2} fill={CREAM} opacity={0.35} />
      <circle cx={cx + 17} cy={GLASS_Y + 6} r={1.4} fill={CREAM} opacity={0.35} />
    </g>
  );
  const sparkle = sig === undefined ? null : (() => {
    const u = sig / 0.55, s = Math.sin(Math.min(1, u * 1.4) * Math.PI) * 1.1, x = LENS_X + 22, y = GLASS_Y - 24;
    return <path transform={`translate(${x} ${y}) rotate(${u * 90}) scale(${s})`} fill={CREAM}
      d="M0 -14Q1.5 -1.5 14 0Q1.5 1.5 0 14Q-1.5 1.5 -14 0Q-1.5 -1.5 0 -14Z" />;
  })();

  // ---- arms: noodle from shoulder to hand target, sagging control points
  const arm = (side: -1 | 1, target: [number, number], wave: number) => {
    const sh = [side * (halfWidthAt(18) - 3), 18];
    let [hx, hy] = target;
    if (wave > 0.01) { // wave: hand swings around a point above the shoulder
      const w = Math.sin(t * 2 * Math.PI * 2.4) * 18 * wave;
      hx += w; hy += Math.abs(w) * 0.25;
    }
    hx += side * 0; hy += float * 0.25; // hands lag the float a little
    const dx = hx - sh[0], dy = hy - sh[1];
    const len = Math.hypot(dx, dy);
    // noodle: an S-curve whose bend grows as the arm gets shorter, with a slow wobble
    const sag = Math.max(10, 40 - len * 0.2);
    const wob = Math.sin(t * 3.1 + side) * 3;
    const nx = -dy / (len || 1), ny = dx / (len || 1); // normal
    const bend = side * sag * 0.7;
    const c1 = [sh[0] + dx * 0.3 + nx * bend + wob, sh[1] + dy * 0.3 + ny * bend + sag * 0.5];
    const c2 = [sh[0] + dx * 0.72 - nx * bend * 0.45, sh[1] + dy * 0.72 - ny * bend * 0.45 + sag * 0.25];
    return (
      <g key={side}>
        <path d={`M${sh[0]} ${sh[1]}C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${hx} ${hy}`} stroke={LN} strokeWidth={5.5} strokeLinecap="round" fill="none" />
        <circle cx={hx} cy={hy} r={7.5} fill={LN} />
        {side === 1 ? holdItem(p.hold, hx, hy, LN) : null}
      </g>
    );
  };

  // ---- string: wavy, ~half the body height, follows the motion
  const n = 14, L = 100 * (0.9 + 0.1 * air);
  const pts: number[][] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const wave = Math.sin(t * 2.6 - u * 6.5) * (2.5 + 5 * u + 6 * p.slack * u);
    const drag = -vel * 6 * u * u - p.lean * 0.6 * u;
    pts.push([wave + drag + p.slack * 10 * Math.sin(u * 7), 108 + u * L * (1 - 0.2 * p.slack)]);
  }
  let sd = `M0 106`;
  for (let i = 1; i < pts.length; i++) sd += `L${pts[i][0].toFixed(2)} ${pts[i][1].toFixed(2)}`;

  return (
    <svg width={size * 1.9} height={size * 1.9} viewBox="-190 -190 380 380" style={{ overflow: 'visible', position: 'absolute', left: -size * 0.95, top: -size * 0.95 }}>
      <g transform={`translate(${p.lean} ${p.lift + float}) rotate(${p.tilt} 0 100)`}>
        <path d={sd} stroke={LN} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <g transform={`translate(0 ${100 * (1 - air)}) scale(${sx} ${sy})`}>
          <path d="M-7 98L7 98L4.5 108L-4.5 108Z" fill={C.knot} />
          <path d={BODY_PATH} fill={C.body} />
          <ellipse cx={-46} cy={-52} rx={11} ry={24} transform="rotate(-28 -46 -52)" fill={CREAM} opacity={0.42} />
          {arm(-1, p.handL, p.waveL)}
          {arm(1, p.handR, p.waveR)}
          {brow(-1, p.browL)}{brow(1, p.browR)}
          <g transform={`translate(0 ${p.glasses.y}) rotate(${p.glasses.tilt} 0 ${GLASS_Y})`}>
            <path d={`M-4 ${GLASS_Y - 6}Q0 ${GLASS_Y - 11} 4 ${GLASS_Y - 6}`} stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
            {lensEl(-LENS_X)}{lensEl(LENS_X)}
            {sparkle}
          </g>
          {mouth}
        </g>
      </g>
    </svg>
  );
};

// held objects (no fingers unless holding something — the hand wraps the item)
const holdItem = (hold: Pose['hold'], x: number, y: number, LN: string) => {
  if (!hold || hold === 'none') return null;
  if (hold === 'flame') return (
    <g transform={`translate(${x} ${y - 4})`}>
      <path d="M0 0C-16 -8 -15 -32 0 -56C3 -43 17 -38 15 -19C14 -8 7 0 0 0Z" fill="#F2BE4A" />
      <path d="M0 -3C-8 -8 -8 -21 0 -32C6 -21 9 -12 0 -3Z" fill={CREAM} />
      <circle cx={0} cy={2} r={7.5} fill={LN} />
    </g>
  );
  if (hold === 'shield') return (
    <g transform={`translate(${x + 8} ${y - 8})`}>
      <path d="M-22 -30Q0 -22 22 -30L22 -4Q22 18 0 28Q-22 18 -22 -4Z" fill="#86D1B0" />
      <path d="M-9 -3l7 8l13 -15" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
  if (hold === 'trophy') return (
    <g transform={`translate(${x} ${y - 6})`}>
      <path d="M-17 -46L17 -46L13 -24Q0 -12 -13 -24Z" fill="#F2BE4A" />
      <rect x={-3} y={-17} width={6} height={10} fill="#F2BE4A" />
      <rect x={-12} y={-8} width={24} height={7} rx={2} fill="#F2BE4A" />
    </g>
  );
  if (hold === 'phone') return (
    <g transform={`translate(${x} ${y - 30})`}>
      <rect x={-15} y={-26} width={30} height={52} rx={6} fill="#1A2350" />
      <rect x={-11} y={-20} width={22} height={38} rx={3} fill="#7FB7E6" opacity={0.85} />
    </g>
  );
  if (hold === 'clock') return (
    <g transform={`translate(${x} ${y - 26})`}>
      <circle r={22} fill={CREAM} />
      <path d="M0 0L0 -14M0 0L10 4" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
    </g>
  );
  return null;
};
