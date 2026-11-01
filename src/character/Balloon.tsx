// The Balloon, ported from the bible's React component (brand/character-bible.html)
// to frame-driven SVG. Same paths, anchor points, angles and timings; CSS keyframes
// replaced by pure functions of time so Remotion can render any frame.
//
// State changes follow the bible's video rules:
//   brows switch first (frame F), mouth 2 frames later, arms/hands/props/body
//   motion 4 frames later; the body squashes (1.05, 0.95) over 3 frames and
//   returns with the `enter` overshoot. Nothing ever hard-cuts.
import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import {
  alt, phase, kf, clamp, lerp, EIO, EOUT, EIN, ENTER, bodyXf, mixXf, xfStr, ID, type Xf,
} from './anim';
import {
  S, PALS, INK, PAPER, GOLD, SAGE, P_FULL, P_DEFL, STRING_TAUT, STRING_SLACK, MOUTH, BROWS,
  type StateId, type StateDef, type PalName, type Prop,
} from './states';

export type TrackItem = { at: number; state: StateId };

const NUM = /-?\d*\.?\d+/g;
const morph = (a: string, b: string, k: number) => {
  if (k <= 0) return a;
  if (k >= 1) return b;
  const nb = (b.match(NUM) || []).map(Number);
  let i = 0;
  return a.replace(NUM, (m) => String(+lerp(Number(m), nb[i++], k).toFixed(2)));
};

const st = (id: StateId): StateDef => S[id] as StateDef;
const armAngle = (s: StateDef, side: -1 | 1, t: number) => {
  const sw = side < 0 ? s.lsw : s.rsw;
  if (sw) return lerp(sw[0], sw[1], alt(t, sw[2]));
  if (side < 0) return s.la ?? 25;
  return s.ra ?? -25;
};

type Props = {
  track: TrackItem[];
  size?: number;
  pal?: PalName;
  dark?: boolean;
  /** Seconds at which the signature glint fires (after a punchline / key line). */
  glints?: number[];
  /** What the black lenses reflect: drawn in lens space (centre 0,0, radius 21), clipped to each lens. */
  lens?: React.ReactNode;
};

export const Balloon: React.FC<Props> = ({ track, size = 600, pal = 'blue', dark = true, glints = [], lens }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const C = PALS[pal];
  const LN = dark ? PAPER : INK;

  // Which track entry is active for a given lag (frames after the change).
  const idxAt = (lag: number) => {
    let k = 0;
    for (let i = 0; i < track.length; i++) if (track[i].at * fps + lag <= frame) k = i;
    return k;
  };
  const iBrow = idxAt(0), iMouth = idxAt(2), iBody = idxAt(4);
  const sBrow = st(track[iBrow].state), sMouth = st(track[iMouth].state);
  const sBody = st(track[iBody].state);
  const sPrev = st(track[Math.max(0, iBody - 1)].state);
  const bodyStartF = track[iBody].at * fps + 4;
  const dB = frame - bodyStartF; // frames since the body switched
  const kArm = iBody === 0 ? 1 : EIO(clamp(dB / 5));
  const kMotion = iBody === 0 ? 1 : EIO(clamp(dB / 8));
  const kDefl = iBody === 0 ? 1 : EIO(clamp(dB / 18));
  const tLocal = (frame - bodyStartF) / fps; // FX and one-shot props start when the state lands

  // Squash on every change (anchored at the brow switch, frame F).
  const dF = frame - track[iBrow].at * fps;
  let sq = { x: 1, y: 1 };
  if (iBrow > 0 && dF < 3) { const k = dF / 3; sq = { x: lerp(1, 1.05, k), y: lerp(1, 0.95, k) }; }
  else if (iBrow > 0 && dF < 3 + 13.5) { const k = ENTER((dF - 3) / 13.5); sq = { x: lerp(1.05, 1, k), y: lerp(0.95, 1, k) }; }

  // Continuous parameters, blended from the previous state.
  const defl = lerp(sPrev.body === 'defl' ? 1 : 0, sBody.body === 'defl' ? 1 : 0, kDefl);
  const fy = 40 * defl;
  const shY = 140 + 18 * defl, shL = 50 + 16 * defl, shR = 190 - 16 * defl, L = 40;
  const tilt = lerp(sPrev.tilt || 0, sBody.tilt || 0, kMotion);
  const grot = lerp(sPrev.grot || 0, sBody.grot || 0, kMotion);
  const gdy = lerp(sPrev.gdy || 0, sBody.gdy || 0, kMotion);
  const slack = lerp(sPrev.slack ? 1 : 0, sBody.slack ? 1 : 0, kDefl);
  const motion: Xf = mixXf(bodyXf(sPrev.anim || 'float', t), bodyXf(sBody.anim || 'float', t), kMotion);
  const la = lerp(armAngle(sPrev, -1, t), armAngle(sBody, -1, t), kArm);
  const ra = lerp(armAngle(sPrev, 1, t), armAngle(sBody, 1, t), kArm);

  const sw = (w: number) => ({ stroke: INK, strokeWidth: w, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });

  // ---- face
  // Idle glint every 4.4s (bible) + the signature glint: full flash and a sparkle for 0.5s after a key line.
  const sig = glints.map((g) => t - g).filter((d) => d >= 0 && d < 0.5).sort((a, b) => a - b)[0];
  const glintOp = sig !== undefined ? kf(sig / 0.5, [[0, 0.55], [0.15, 1], [0.7, 1], [1, 0.55]]) : kf(phase(t, 4.4), [[0, 0.55], [0.82, 0.55], [0.88, 1], [0.94, 0.2], [1, 0.55]]);
  const sparkle = sig === undefined ? null : (() => {
    const u = sig / 0.5, sc = kf(u, [[0, 0], [0.3, 1.15], [1, 0]], EOUT), r = 90 * u;
    const x = 158, y = 97;
    return <path transform={xfStr({ ...ID, rot: r, sx: sc, sy: sc }, x, y)} fill="#FFFFFF" stroke={INK} strokeWidth={1.6} strokeLinejoin="round"
      d={`M${x} ${y - 13}Q${x} ${y} ${x + 13} ${y}Q${x} ${y} ${x} ${y + 13}Q${x} ${y} ${x - 13} ${y}Q${x} ${y} ${x} ${y - 13}Z`} />;
  })();
  const uid = React.useId().replace(/:/g, '');
  const glare = (x: number) => <path d={`M${x - 12} 106L${x - 3} 97`} stroke={PAPER} strokeWidth={3.5} strokeLinecap="round" opacity={glintOp} />;
  const glasses = (
    <g transform={`translate(0 ${fy + gdy}) rotate(${grot} 120 112)`}>
      <path d="M114 109Q120 102 126 109" stroke={INK} strokeWidth={4.5} fill="none" />
      <circle cx={96} cy={112} r={21} fill={INK} />
      <circle cx={144} cy={112} r={21} fill={INK} />
      {lens ? [96, 144].map((cx) => (
        <g key={cx}>
          <clipPath id={`${uid}l${cx}`}><circle cx={cx} cy={112} r={20} /></clipPath>
          <g clipPath={`url(#${uid}l${cx})`}><g transform={`translate(${cx} 112)`}>{lens}</g></g>
        </g>
      )) : null}
      {glare(96)}{glare(144)}
      <circle cx={104} cy={121} r={2} fill={PAPER} opacity={0.35} />
      <circle cx={152} cy={121} r={2} fill={PAPER} opacity={0.35} />
      {sparkle}
    </g>
  );
  const m = sMouth.mouth ? MOUTH[sMouth.mouth] : null;
  const mouth = !m ? null : m[0] === 'o'
    ? <ellipse cx={120} cy={155 + fy} rx={6} ry={7.5} fill={INK} />
    : m[0] === 'f'
      ? <path d={m[1]} fill={INK} transform={`translate(0 ${fy})`} />
      : <path d={m[1]} {...sw(4.5)} transform={`translate(0 ${fy})`} />;
  const bw = sBrow.brows ? BROWS[sBrow.brows] : null;
  const brows = bw ? <g transform={`translate(0 ${fy})`}>{bw.map((d, i) => <path key={i} d={d} {...sw(4.5)} />)}</g> : null;

  // ---- body
  const bodyPath = <path d={morph(P_FULL, P_DEFL, defl)} fill={C.body} />;
  const hl = (
    <ellipse cx={lerp(82, 88, defl)} cy={lerp(72, 114, defl)} rx={lerp(9, 7, defl)} ry={lerp(20, 14, defl)}
      transform={`rotate(-28 ${lerp(82, 88, defl)} ${lerp(72, 114, defl)})`} fill={PAPER} opacity={lerp(0.42, 0.4, defl)} />
  );
  const wrinkles = defl > 0.01 ? <path d="M80 124Q88 132 82 142M160 120Q152 130 158 138" stroke={C.shade} strokeWidth={3} fill="none" strokeLinecap="round" opacity={defl} /> : null;
  const knot = <path d="M114 209L126 209L123 218L117 218Z" fill={C.shade} />;
  const sway = -5 + 10 * alt(t, 2.8);
  const string = (
    <g transform={`rotate(${sway} 120 218)`}>
      <path d={morph(STRING_TAUT, STRING_SLACK, slack)} stroke={LN} strokeWidth={2.5} fill="none" strokeLinecap="round" />
    </g>
  );

  // ---- props (stay upright: counter-rotated inside the arm)
  const prop = (type: Prop, x: number, y: number) => {
    if (type === 'flame') {
      const p = alt(t, 0.45);
      const xf: Xf = { tx: 0, ty: 0, rot: -3 + 6 * p, sx: lerp(1, 0.92, p), sy: lerp(1, 1.1, p) };
      return (
        <g transform={xfStr(xf, x, y)}>
          <path d={`M${x} ${y - 2}C${x - 15} ${y - 10} ${x - 14} ${y - 30} ${x} ${y - 52}C${x + 3} ${y - 40} ${x + 16} ${y - 36} ${x + 14} ${y - 18}C${x + 13} ${y - 8} ${x + 6} ${y - 2} ${x} ${y - 2}Z`} fill={GOLD} />
          <path d={`M${x} ${y - 4}C${x - 7} ${y - 9} ${x - 7} ${y - 20} ${x} ${y - 30}C${x + 6} ${y - 20} ${x + 8} ${y - 12} ${x} ${y - 4}Z`} fill={PAPER} />
        </g>
      );
    }
    if (type === 'bell') {
      const r = kf(phase(t, 1.4), [[0, 0], [0.2, 16], [0.4, -14], [0.6, 9], [0.8, -5], [1, 0]]);
      return (
        <g>
          <path d={`M${x - 27} ${y - 32}l-7 -5M${x + 27} ${y - 32}l7 -5M${x - 30} ${y - 18}l-8 0M${x + 30} ${y - 18}l8 0`} stroke={LN} strokeWidth={3} strokeLinecap="round" />
          <g transform={`rotate(${r} ${x} ${y - 38})`}>
            <circle cx={x} cy={y - 38} r={3.5} fill={LN} />
            <path d={`M${x - 14} ${y - 8}Q${x - 15} ${y - 34} ${x} ${y - 36}Q${x + 15} ${y - 34} ${x + 14} ${y - 8}L${x + 18} ${y - 3}L${x - 18} ${y - 3}Z`} fill={GOLD} stroke={LN} strokeWidth={2.5} strokeLinejoin="round" />
            <circle cx={x} cy={y + 1} r={4} fill={LN} />
          </g>
        </g>
      );
    }
    if (type === 'magnifier') return (
      <g>
        <path d={`M${x} ${y}L${x + 10} ${y - 14}`} stroke={LN} strokeWidth={6} strokeLinecap="round" />
        <circle cx={x + 21} cy={y - 29} r={15} fill={PAPER} fillOpacity={0.6} stroke={LN} strokeWidth={5} />
        <path d={`M${x + 13} ${y - 33}Q${x + 15} ${y - 39} ${x + 21} ${y - 40}`} stroke="#FFFFFF" strokeWidth={3} fill="none" strokeLinecap="round" />
      </g>
    );
    if (type === 'shield') {
      const p = alt(t, 1.2), s = 1 + 0.045 * p;
      return (
        <g transform={xfStr({ ...ID, sx: s, sy: s }, x + 6, y - 8)}>
          <path d={`M${x - 12} ${y - 34}Q${x + 6} ${y - 27} ${x + 24} ${y - 34}L${x + 24} ${y - 10}Q${x + 24} ${y + 10} ${x + 6} ${y + 19}Q${x - 12} ${y + 10} ${x - 12} ${y - 10}Z`} fill={SAGE} stroke={LN} strokeWidth={3} strokeLinejoin="round" />
          <path d={`M${x - 1} ${y - 8}l6 7l11 -13`} stroke={PAPER} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    }
    if (type === 'trophy') return (
      <g>
        <path d={`M${x - 13} ${y - 40}q-12 2 -9 12q3 7 11 6M${x + 13} ${y - 40}q12 2 9 12q-3 7 -11 6`} stroke={LN} strokeWidth={3} fill="none" />
        <path d={`M${x - 15} ${y - 44}L${x + 15} ${y - 44}L${x + 12} ${y - 24}Q${x} ${y - 13} ${x - 12} ${y - 24}Z`} fill={GOLD} stroke={LN} strokeWidth={2.5} strokeLinejoin="round" />
        <rect x={x - 3} y={y - 16} width={6} height={9} fill={LN} />
        <rect x={x - 11} y={y - 8} width={22} height={7} rx={2} fill={LN} />
      </g>
    );
    return null;
  };

  // ---- arms
  const arm = (side: -1 | 1, th: number, hand: StateDef['lh'], poke: boolean, pr?: Prop) => {
    const sx = side < 0 ? shL : shR, sy = shY, hx = sx, hy = sy + L;
    const pk = poke ? kf(phase(tLocal, 0.9), [[0, 0], [0.25, 9], [0.55, 0], [1, 0]]) : 0;
    const kids: React.ReactNode[] = [
      <path key="a" d={`M${sx} ${sy}q${side * -4} ${L / 2} 0 ${L}`} stroke={LN} strokeWidth={5} fill="none" strokeLinecap="round" />,
    ];
    const propEl = pr ? <g key="pr" transform={`rotate(${-th} ${hx} ${hy})`}>{prop(pr, hx, hy)}</g> : null;
    const propOnTop = pr === 'shield' || pr === 'magnifier';
    if (propEl && !propOnTop) kids.push(propEl);
    if (hand === 'open') kids.push(<path key="f" d={`M${hx} ${hy}l-8 9M${hx} ${hy}l-2.5 11.5M${hx} ${hy}l2.5 11.5M${hx} ${hy}l8 9`} stroke={LN} strokeWidth={3.2} strokeLinecap="round" />);
    if (hand === 'palm') {
      kids.push(<ellipse key="h" cx={hx} cy={hy + 4} rx={7.5} ry={10} fill={LN} />);
      kids.push(<circle key="t" cx={hx + side * 7.5} cy={hy - 1} r={3.6} fill={LN} />);
    } else if (hand === 'thumb') {
      kids.push(
        <g key="h" transform={`rotate(${-th} ${hx} ${hy})`}>
          <rect x={hx - 8.5} y={hy - 4} width={17} height={14} rx={6} fill={LN} />
          <rect x={hx - 8.5} y={hy - 17} width={7.5} height={16} rx={3.75} fill={LN} />
          <path d={`M${hx - 1} ${hy + 1}L${hx + 6} ${hy + 1}M${hx - 1} ${hy + 5.5}L${hx + 6} ${hy + 5.5}`} stroke={dark ? INK : PAPER} strokeWidth={1.4} strokeLinecap="round" opacity={0.5} />
        </g>,
      );
    } else if (hand !== 'open') {
      kids.push(<circle key="h" cx={hx} cy={hy} r={6.5} fill={LN} />);
    }
    if (propEl && propOnTop) kids.push(propEl);
    return <g key={'arm' + side} transform={`translate(${pk} 0) rotate(${th} ${sx} ${sy})`}>{kids}</g>;
  };
  const flexArm = (side: -1 | 1) => {
    const sx = side < 0 ? shL : shR, ex = sx + side * 30, ey = shY - 4, fx2 = ex + side * 2, fy2 = shY - 40;
    return (
      <g key={'fx' + side}>
        <path d={`M${sx} ${shY}Q${sx + side * 16} ${shY + 6} ${ex} ${ey}Q${ex + side * 8} ${ey - 18} ${fx2} ${fy2}`} stroke={LN} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M${sx + side * 10} ${shY + 1}Q${sx + side * 20} ${shY - 14} ${ex - side * 2} ${ey - 6}`} stroke={LN} strokeWidth={4} fill="none" strokeLinecap="round" />
        <circle cx={fx2} cy={fy2} r={9.5} fill={LN} />
      </g>
    );
  };
  const arms = sBody.flex
    ? (() => { const s = 1 + 0.045 * alt(t, 0.9); return <g transform={xfStr({ ...ID, sx: s, sy: s }, 120, 140)}>{flexArm(-1)}{flexArm(1)}</g>; })()
    : [arm(-1, la, sBody.lh, false), arm(1, ra, sBody.rh, !!sBody.poke, sBody.prop)];

  // ---- FX (outside the body group)
  const fxEls = (sBody.fx || []).map((f) => {
    const tl = tLocal;
    if (f === 'zzz') return (
      <g key={f}>
        {([[176, 64, 16, 0], [190, 42, 21, 0.8], [204, 18, 26, 1.6]] as const).map(([x, y, z, d], i) => {
          const u = phase(tl, 2.4, d);
          if (u < 0) return null;
          const op = kf(u, [[0, 0], [0.3, 1], [1, 0]], EOUT);
          const k = EOUT(u);
          return <text key={i} x={x + 10 * k} y={y + lerp(8, -16, k)} fontSize={z} fontFamily="Young Serif" fill={LN} opacity={op}>z</text>;
        })}
      </g>
    );
    if (f === 'sweat') {
      const u = phase(tl, 1.6);
      return <path key={f} d="M178 66Q171 80 178 85Q185 80 178 66Z" fill="#FFFFFF" stroke={LN} strokeWidth={2.5}
        opacity={kf(u, [[0, 0], [0.2, 1], [1, 0]], EIN)} transform={`translate(0 ${lerp(-4, 14, EIN(u))})`} />;
    }
    if (f === 'stars') return (
      <g key={f}>
        {([[18, 30, 0], [214, 8, 0.4], [226, 150, 0.9], [10, 170, 1.3]] as const).map(([x, y, d], i) => {
          const u = phase(tl, 1.4, d);
          if (u < 0) return null;
          const s = kf(u, [[0, 0.3], [0.5, 1.1], [1, 0.3]]);
          const r = kf(u, [[0, 0], [0.5, 45], [1, 0]]);
          const op = kf(u, [[0, 0.2], [0.5, 1], [1, 0.2]]);
          return <path key={i} opacity={op} transform={xfStr({ ...ID, rot: r, sx: s, sy: s }, x, y)}
            d={`M${x} ${y - 11}Q${x} ${y} ${x + 11} ${y}Q${x} ${y} ${x} ${y + 11}Q${x} ${y} ${x - 11} ${y}Q${x} ${y} ${x} ${y - 11}Z`} fill={GOLD} />;
        })}
      </g>
    );
    if (f === 'q') {
      const p = alt(tl, 1.1);
      return <text key={f} x={196} y={52} fontSize={40} fontFamily="Young Serif" fill={LN}
        transform={xfStr({ ...ID, ty: -8 * p, rot: -6 + 12 * p }, 207, 38)}>?</text>;
    }
    if (f === 'heart') {
      const u = phase(tl, 2.2);
      const op = kf(u, [[0, 0], [0.25, 1], [1, 0]], EOUT);
      const ty = kf(u, [[0, 10], [0.25, 0], [1, -22]], EOUT);
      const s = kf(u, [[0, 0.6], [0.25, 1], [1, 0.9]], EOUT);
      return <path key={f} d="M120 6C104 -6 108 -20 120 -12C132 -20 136 -6 120 6Z" fill={C.body} opacity={op}
        transform={xfStr({ ...ID, ty, sx: s, sy: s }, 120, -4)} />;
    }
    if (f === 'lines') return <path key={f} d="M244 126l10 -5M247 141l13 0M244 156l10 5" stroke={LN} strokeWidth={3} strokeLinecap="round" opacity={glintOpAt(tl, 0.9)} />;
    if (f === 'wifi') return (
      <g key={f} stroke={LN} strokeWidth={3.5} fill="none" strokeLinecap="round">
        <path d="M182 22Q198 8 214 22M188 30Q198 22 208 30" />
        <circle cx={198} cy={37} r={2.5} fill={LN} stroke="none" />
        <path d="M184 8L212 42" stroke={C.body} />
      </g>
    );
    if (f === 'burst') {
      const u = phase(tl, 0.8);
      const op = kf(u, [[0, 0], [0.4, 1], [1, 0]]), s = kf(u, [[0, 0.6], [0.4, 1.1], [1, 0.6]]);
      return <path key={f} d="M214 76l8 -10M224 92l12 -3M200 66l1 -12M226 108l10 4" stroke={LN} strokeWidth={3.5} strokeLinecap="round"
        opacity={op} transform={xfStr({ ...ID, sx: s, sy: s }, 218, 81)} />;
    }
    return null;
  });

  const motionSq: Xf = { ...motion, sx: motion.sx * sq.x, sy: motion.sy * sq.y };
  return (
    <svg width={size} height={(size * 340) / 280} viewBox="-20 -40 280 340" style={{ overflow: 'visible' }}>
      <g transform={`rotate(${tilt} 120 218)`}>
        <g transform={xfStr(motionSq, 120, 218)}>
          {string}{knot}{bodyPath}{hl}{wrinkles}
          {arms}
          {brows}{glasses}{mouth}
        </g>
        {fxEls}
      </g>
    </svg>
  );
};

const glintOpAt = (t: number, dur: number) => kf(phase(t, dur), [[0, 0.55], [0.82, 0.55], [0.88, 1], [0.94, 0.2], [1, 0.55]]);

/** The `app_icon` state: the glasses alone on a body-colour square, corners 19%. */
export const AppIcon: React.FC<{ size?: number; pal?: PalName }> = ({ size = 300, pal = 'blue' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = glintOpAt(frame / fps, 4.4);
  const C = PALS[pal];
  const glare = (x: number) => <path d={`M${x - 12} 106L${x - 3} 97`} stroke={PAPER} strokeWidth={3.5} strokeLinecap="round" opacity={op} />;
  return (
    <div style={{ width: size * 0.78, height: size * 0.78, borderRadius: size * 0.19, background: C.body, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size * 0.62} height={size * 0.62 * 0.5} viewBox="70 86 100 52">
        <path d="M114 109Q120 102 126 109" stroke={INK} strokeWidth={4.5} fill="none" />
        <circle cx={96} cy={112} r={21} fill={INK} />
        <circle cx={144} cy={112} r={21} fill={INK} />
        {glare(96)}{glare(144)}
        <circle cx={104} cy={121} r={2} fill={PAPER} opacity={0.35} />
        <circle cx={152} cy={121} r={2} fill={PAPER} opacity={0.35} />
      </svg>
    </div>
  );
};
