// Shared building blocks for every video in the owner's style (brand/style-prompts.md).
import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { Balloon, AppIcon, type TrackItem } from '../character/Balloon';
import { ENTER, EIO, clamp, lerp } from '../character/anim';
import { COL, FONT_CAPTION, FONT_DISPLAY, FONT_TEXT, PAL, SAFE, SAFE_W, SAFE_CX, W, H } from '../theme';
import type { PalName } from '../character/states';
import { alt } from '../character/anim';
import type { Lang } from '../types';

const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return { frame, fps, t: frame / fps };
};

/** Piecewise camera: each key eases in over 0.5s. */
export const camAt = (cams: { at: number; s: number; x?: number; y?: number }[], t: number) => {
  let i = 0;
  for (let j = 0; j < cams.length; j++) if (cams[j].at <= t) i = j;
  const a = cams[Math.max(0, i - 1)], b = cams[i];
  const k = i === 0 ? 1 : EIO(clamp((t - b.at) / 0.5));
  return { s: lerp(a.s, b.s, k), x: lerp(a.x ?? 0, b.x ?? 0, k), y: lerp(a.y ?? 0, b.y ?? 0, k) };
};

/** The Balloon placed by its body centre (cx, cy) in frame px. */
export const BalloonAt: React.FC<{
  track: TrackItem[]; cx: number; cy: number; size: number; cam: { s: number; x: number; y: number };
  glints?: number[]; lens?: React.ReactNode; pal?: PalName;
}> = ({ track, cx, cy, size, cam, glints, lens, pal = PAL }) => {
  const u = size / 280;
  return (
    <div style={{
      position: 'absolute', left: cx - 140 * u, top: cy - 160 * u, width: size,
      transformOrigin: `${140 * u}px ${160 * u}px`, transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.s})`,
    }}>
      <Balloon track={track} size={size} pal={pal} dark glints={glints} lens={lens} />
    </div>
  );
};

/**
 * Caption in the lower third: bold white rounded sans with a black outline,
 * word by word; `*word*` is the key word, in the Balloon's colour.
 * Drawn as two stacked layers (outline behind, clean fill on top) so the
 * outline never eats into the Arabic letterforms.
 */
export const Caption: React.FC<{ text: string; from: number; to: number; lang: Lang; y?: number; size?: number; wordsBy?: number }> = ({
  text, from, to, lang, y = 1330, size = 96, wordsBy,
}) => {
  const { t, fps } = useT();
  if (t < from || t >= to) return null;
  const words = text.split(/\s+/);
  const per = wordsBy ?? Math.min(0.32, ((to - from) * 0.5) / words.length);
  const layer = (outline: boolean) => (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{
      position: outline ? 'relative' : 'absolute', inset: 0,
      fontFamily: FONT_CAPTION, fontWeight: 800, fontSize: size, lineHeight: 1.3, textAlign: 'center', textWrap: 'balance',
      color: outline ? COL.ink : COL.white,
      WebkitTextStroke: outline ? `${size * 0.2}px ${COL.ink}` : undefined,
    } as React.CSSProperties}>
      {words.map((w, i) => {
        const d = (t - (from + i * per)) * fps;
        const k = ENTER(clamp(d / 7));
        const key = w.includes('*');
        return (
          <span key={i} style={{ display: 'inline-block', opacity: d < 0 ? 0 : 1, transform: `scale(${lerp(0.7, 1, k)})`, marginInline: size * 0.1, color: outline ? COL.ink : key ? COL.body : COL.white }}>
            {w.replace(/\*/g, '')}
          </span>
        );
      })}
    </div>
  );
  return (
    <div style={{ position: 'absolute', left: SAFE.left, top: y, width: SAFE_W }}>
      <div style={{ position: 'relative' }}>{layer(true)}{layer(false)}</div>
    </div>
  );
};

/** Small clean card: counters ("أيوه: 7") and source cards ("1930 · Keynes"). */
export const Card: React.FC<{ label: string; value?: string | number; x: number; y: number; from?: number; punchAt?: number; dim?: boolean; gold?: boolean; lang: Lang }> = ({
  label, value, x, y, from = 0, punchAt, dim, gold, lang,
}) => {
  const { t, fps } = useT();
  if (t < from) return null;
  const d = (t - from) * fps;
  const k = from === 0 ? 1 : ENTER(clamp(d / 12));
  const p = punchAt !== undefined && t >= punchAt ? 1 + 0.16 * Math.max(0, 1 - (t - punchAt) * fps / 8) : 1;
  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{
      position: 'absolute', left: x, top: y, transform: `translate(-50%, 0) scale(${lerp(0.86, 1, k) * p})`, opacity: from === 0 ? 1 : clamp((d + 1) / 4),
      background: COL.card2, borderRadius: 28, padding: '10px 30px 14px',
      fontFamily: FONT_TEXT, fontWeight: 700, fontSize: 58, color: COL.paper, whiteSpace: 'nowrap', display: 'flex', gap: 16, alignItems: 'baseline',
    }}>
      <span style={{ opacity: dim ? 0.6 : 1 }}>{label}</span>
      {value !== undefined ? <span style={{ fontVariantNumeric: 'tabular-nums', color: gold ? COL.gold : COL.paper, opacity: dim ? 0.45 : 1 }}>{value}</span> : null}
    </div>
  );
};

/** A small speech bubble ("?" asking, check = got a yes). Sits above a friend balloon. */
export const Bubble: React.FC<{ x: number; y: number; kind: '?' | 'ok'; k: number }> = ({ x, y, kind, k }) => {
  const s = ENTER(clamp(k));
  if (s <= 0) return null;
  return (
    <svg style={{ position: 'absolute', left: x - 60, top: y - 60, overflow: 'visible' }} width={120} height={120} viewBox="-60 -60 120 120">
      <g transform={`scale(${s * 1.5})`}>
        <path d="M-34 -30Q-34 -44 -20 -44L20 -44Q34 -44 34 -30L34 4Q34 18 20 18L-6 18L-20 32L-18 18L-20 18Q-34 18 -34 4Z" fill={COL.card2} />
        {kind === '?' ? <text x={0} y={2} textAnchor="middle" fontFamily={FONT_DISPLAY} fontSize={44} fill={COL.paper}>?</text>
          : <path d="M-13 -12l9 10l17 -19" stroke={COL.success} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
      </g>
    </svg>
  );
};

/** Night sky: navy ground, radial glow, the moon with craters, a few cream stars (35–70%). */
const STARS: [number, number, number, number][] = [
  [120, 330, 3, 0.7], [300, 250, 2.5, 0.45], [520, 300, 2, 0.35], [880, 280, 3, 0.6], [960, 520, 2.5, 0.4],
  [90, 760, 2, 0.5], [1000, 900, 3, 0.55], [140, 1250, 2.5, 0.4], [980, 1380, 2, 0.35], [260, 1600, 3, 0.6],
  [820, 1700, 2.5, 0.45], [660, 180, 2, 0.5], [40, 1050, 2.5, 0.65], [720, 560, 2, 0.35],
];
export const NightSky: React.FC<{ moon?: { x: number; y: number; r: number } }> = ({ moon = { x: 175, y: 520, r: 62 } }) => {
  const { t } = useT();
  return (
    <AbsoluteFillDiv>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 75% 55% at 50% 52%, ${COL.glow} 0%, ${COL.ground} 100%)` }} />
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        {STARS.map(([x, y, r, o], i) => <circle key={i} cx={x} cy={y} r={r * 1.6} fill={COL.paper} opacity={o * (0.75 + 0.25 * alt(t, 1.7 + (i % 5) * 0.4))} />)}
        <g>
          <circle cx={moon.x} cy={moon.y} r={moon.r} fill={COL.moon} />
          <circle cx={moon.x - moon.r * 0.3} cy={moon.y - moon.r * 0.2} r={moon.r * 0.18} fill={COL.crater} />
          <circle cx={moon.x + moon.r * 0.28} cy={moon.y + moon.r * 0.25} r={moon.r * 0.13} fill={COL.crater} />
          <circle cx={moon.x + moon.r * 0.2} cy={moon.y - moon.r * 0.38} r={moon.r * 0.08} fill={COL.crater} />
        </g>
      </svg>
    </AbsoluteFillDiv>
  );
};
const AbsoluteFillDiv: React.FC<{ children: React.ReactNode }> = ({ children }) => <div style={{ position: 'absolute', inset: 0 }}>{children}</div>;

/** Brand end card (<= 1.5s): the app_icon state + the name. No CTA for now (owner decision). */
export const EndCard: React.FC<{ from: number }> = ({ from }) => {
  const { frame, fps } = useT();
  const d = frame - from * fps;
  if (d < 0) return null;
  const k = ENTER(clamp(d / 13.5)), k2 = ENTER(clamp((d - 4) / 13.5));
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <NightSky />
      <div style={{ position: 'absolute', left: SAFE_CX, top: 930, transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 36 }}>
        <div style={{ transform: `scale(${lerp(0.86, 1, k)}) translateY(${lerp(14, 0, k)}px)`, opacity: clamp((d + 1) / 3) }}><AppIcon size={340} pal={PAL} /></div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 104, color: COL.paper, transform: `translateY(${lerp(14, 0, k2)}px)`, opacity: clamp((d - 3) / 4) }}>Daymoom</div>
      </div>
    </div>
  );
};
