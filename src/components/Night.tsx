// Scene kit for the night style (brand/reference/*, brand/flow-prompt-pack.txt).
import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { clamp, lerp } from '../character/anim';
import { H, SAFE, SAFE_W, W } from '../theme';

export const N = {
  ground: '#080C24', glow: '#22337A', moon: '#F4E7C2', cream: '#F4EFE6', gold: '#F2BE4A',
  success: '#86D1B0', lightBlue: '#7FB7E6', card: '#121A3A', card2: '#1A2350', ink: '#1C1814', body: '#4A86D4',
};
export const F_HEAD = "'Bricolage Grotesque', 'Manrope', sans-serif";
export const F_CAP = "'Manrope', sans-serif";

const useT = () => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return { frame, fps, t: frame / fps }; };

// deterministic star field
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const STARS = Array.from({ length: 90 }, (_, i) => ({ x: rnd(i) * W, y: rnd(i + 500) * H * 1.3 - H * 0.15, r: 1.2 + rnd(i + 900) * 2.2, o: 0.35 + rnd(i + 1300) * 0.35, sp: 1.2 + rnd(i + 1700) * 2.5, depth: 0.3 + rnd(i + 2100) * 0.7 }));

/** Night sky: navy ground, soft blue glow in the centre, cream stars (35–70%), the moon upper right with a halo. */
export const Sky: React.FC<{ drift?: number; moonY?: number }> = ({ drift = 0, moonY = 0 }) => {
  const { t } = useT();
  return (
    <div style={{ position: 'absolute', inset: 0, background: N.ground, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 62% 42% at 50% 40%, ${N.glow} 0%, rgba(34,51,122,0.55) 35%, rgba(8,12,36,0) 100%)` }} />
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        {STARS.map((s, i) => {
          const y = ((s.y + drift * s.depth) % (H * 1.3) + H * 1.3) % (H * 1.3) - H * 0.15;
          return <circle key={i} cx={s.x} cy={y} r={s.r} fill={N.cream} opacity={s.o * (0.7 + 0.3 * Math.sin(t * s.sp + i))} />;
        })}
        <defs>
          <radialGradient id="halo"><stop offset="0%" stopColor={N.moon} stopOpacity={0.35} /><stop offset="100%" stopColor={N.moon} stopOpacity={0} /></radialGradient>
        </defs>
        <circle cx={923} cy={193 + moonY} r={130} fill="url(#halo)" />
        <circle cx={923} cy={193 + moonY} r={59} fill={N.moon} />
      </svg>
    </div>
  );
};

/** Headline (top band): Bricolage Grotesque 800, cream; `*word*` in gold. */
export const Headline: React.FC<{ text: string; from: number; to: number; size?: number; y?: number }> = ({ text, from, to, size = 104, y = 300 }) => {
  const { t, frame, fps } = useT();
  if (t < from || t >= to) return null;
  const k = from === 0 ? 1 : spring({ frame: frame - from * fps, fps, config: { damping: 14, stiffness: 160 } });
  const out = clamp((to - t) / 0.2);
  return (
    <div style={{ position: 'absolute', left: SAFE.left, top: y, width: SAFE_W, textAlign: 'center', fontFamily: F_HEAD, fontWeight: 800, fontSize: size, lineHeight: 1.02, letterSpacing: -1.5, color: N.cream,
      transform: `translateY(${lerp(30, 0, k)}px) scale(${lerp(0.9, 1, k)})`, opacity: Math.min(from === 0 ? 1 : clamp(k * 2), out), textWrap: 'balance' } as React.CSSProperties}>
      {text.split(/(\*[^*]+\*)/).filter(Boolean).map((p, i) => p.startsWith('*') ? <span key={i} style={{ color: N.gold }}>{p.slice(1, -1)}</span> : <span key={i}>{p}</span>)}
    </div>
  );
};

/** Caption (lower third): Manrope 800, cream, word by word; `*word*` in gold. */
export const Cap: React.FC<{ text: string; from: number; to: number; y?: number }> = ({ text, from, to, y = 1365 }) => {
  const { t, fps } = useT();
  if (t < from || t >= to) return null;
  const words = text.split(/\s+/);
  const per = Math.min(0.28, ((to - from) * 0.62) / words.length);
  let inKey = false;
  return (
    <div style={{ position: 'absolute', left: SAFE.left + 20, top: y, width: SAFE_W - 40, textAlign: 'center', fontFamily: F_CAP, fontWeight: 800, fontSize: 58, lineHeight: 1.2, color: N.cream, textShadow: '0 2px 18px rgba(8,12,36,0.9)', textWrap: 'balance' } as React.CSSProperties}>
      {words.map((w, i) => {
        const startKey = w.startsWith('*'); if (startKey) inKey = true;
        const key = inKey; if (w.endsWith('*') || w.endsWith('*.') || w.endsWith('*,') || w.endsWith('*?')) inKey = false;
        const d = (t - (from + i * per)) * fps;
        const k = clamp(d / 5);
        return <span key={i} style={{ display: 'inline-block', marginInline: 9, opacity: d < 0 ? 0 : 0.35 + 0.65 * k, transform: `translateY(${lerp(10, 0, k)}px)`, color: key ? N.gold : N.cream }}>{w.replace(/\*/g, '')}</span>;
      })}
    </div>
  );
};

/** Semi-transparent dark glass card (lists, counters, sources). */
export const Glass: React.FC<{ x: number; y: number; from: number; to?: number; children: React.ReactNode; anchor?: 'center' | 'left' }> = ({ x, y, from, to = 1e9, children, anchor = 'center' }) => {
  const { t, frame, fps } = useT();
  if (t < from || t >= to) return null;
  const k = spring({ frame: frame - from * fps, fps, config: { damping: 15, stiffness: 170 } });
  const out = clamp((to - t) / 0.25);
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `translate(${anchor === 'center' ? '-50%' : '0'}, 0) scale(${lerp(0.85, 1, k)})`, opacity: Math.min(clamp(k * 1.5), out),
      background: 'rgba(26,35,80,0.55)', border: '1.5px solid rgba(244,239,230,0.16)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
      borderRadius: 30, padding: '18px 30px', fontFamily: F_CAP, color: N.cream, whiteSpace: 'nowrap' }}>
      {children}
    </div>
  );
};

/** Green check bubble that pops in. */
export const Check: React.FC<{ x: number; y: number; at: number; size?: number }> = ({ x, y, at, size = 92 }) => {
  const { frame, fps, t } = useT();
  if (t < at) return null;
  const k = spring({ frame: frame - at * fps, fps, config: { damping: 9, stiffness: 180 } });
  const bob = Math.sin((t - at) * 3) * 6;
  return (
    <svg style={{ position: 'absolute', left: x - size / 2, top: y - size / 2 + bob, overflow: 'visible' }} width={size} height={size} viewBox="-50 -50 100 100">
      <g transform={`scale(${k})`}>
        <circle r={46} fill={N.success} opacity={0.22} />
        <circle r={34} fill={N.success} />
        <path d="M-15 1l10 11l20 -22" stroke={N.ground} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
};

/** Translucent shield bubble around the Balloon. */
export const ShieldBubble: React.FC<{ cx: number; cy: number; r: number; from: number; to: number }> = ({ cx, cy, r, from, to }) => {
  const { frame, fps, t } = useT();
  if (t < from || t >= to) return null;
  const k = spring({ frame: frame - from * fps, fps, config: { damping: 10, stiffness: 120 } });
  const out = clamp((to - t) / 0.4);
  const pulse = 1 + 0.02 * Math.sin((t - from) * 5);
  return (
    <svg style={{ position: 'absolute', left: cx - r * 1.2, top: cy - r * 1.2, overflow: 'visible' }} width={r * 2.4} height={r * 2.4} viewBox={`${-r * 1.2} ${-r * 1.2} ${r * 2.4} ${r * 2.4}`}>
      <g transform={`scale(${k * pulse})`} opacity={out}>
        <circle r={r} fill={N.lightBlue} opacity={0.14} />
        <circle r={r} fill="none" stroke={N.lightBlue} strokeWidth={5} opacity={0.65} />
        <path d={`M${-r * 0.55} ${-r * 0.62}A${r * 0.85} ${r * 0.85} 0 0 1 ${r * 0.3} ${-r * 0.82}`} stroke={N.cream} strokeWidth={7} fill="none" strokeLinecap="round" opacity={0.5} />
      </g>
    </svg>
  );
};

/** Gold sparkle burst. */
export const Sparkles: React.FC<{ cx: number; cy: number; at: number; n?: number; radius?: number }> = ({ cx, cy, at, n = 10, radius = 260 }) => {
  const { t } = useT();
  const d = t - at;
  if (d < 0 || d > 1.4) return null;
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width={W} height={H}>
      {Array.from({ length: n }).map((_, i) => {
        const a = (i / n) * Math.PI * 2 + rnd(i) * 0.4;
        const rr = radius * (0.55 + rnd(i + 40) * 0.45) * (1 - Math.pow(1 - clamp(d / 0.7), 3));
        const s = Math.sin(clamp(d / 1.4) * Math.PI) * (10 + rnd(i + 80) * 12);
        const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
        return <path key={i} transform={`translate(${x} ${y}) rotate(${d * 120})`} fill={N.gold} d={`M0 ${-s}Q${s * 0.12} ${-s * 0.12} ${s} 0Q${s * 0.12} ${s * 0.12} 0 ${s}Q${-s * 0.12} ${s * 0.12} ${-s} 0Q${-s * 0.12} ${-s * 0.12} 0 ${-s}Z`} />;
      })}
    </svg>
  );
};

/** The wordmark: "daym" + sunglasses as the "oo" + "m" (brand/reference/wordmark.webp). */
export const Wordmark: React.FC<{ size?: number }> = ({ size = 150 }) => {
  const r = size * 0.31;
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', fontFamily: F_HEAD, fontWeight: 800, fontSize: size, color: N.cream, letterSpacing: -size * 0.03, lineHeight: 1 }}>
      <span>daym</span>
      <svg width={r * 4.25} height={r * 2} viewBox={`${-r * 2.12} ${-r} ${r * 4.25} ${r * 2}`} style={{ margin: `0 ${size * 0.02}px`, transform: `translateY(${size * 0.02}px)` }}>
        {[-1, 1].map((sd) => (
          <g key={sd} transform={`translate(${sd * r * 1.07} 0)`}>
            <circle r={r} fill={N.cream} />
            <path d={`M${-r * 0.55} ${-r * 0.1}L${-r * 0.15} ${-r * 0.5}`} stroke="#77767E" strokeWidth={r * 0.13} strokeLinecap="round" />
            <circle cx={r * 0.35} cy={r * 0.42} r={r * 0.08} fill="#9C9A9E" />
          </g>
        ))}
        <path d={`M${-r * 0.12} ${-r * 0.32}Q0 ${-r * 0.48} ${r * 0.12} ${-r * 0.32}`} stroke={N.cream} strokeWidth={r * 0.12} fill="none" />
      </svg>
      <span>m</span>
    </div>
  );
};

/** End card: wordmark + tagline (+ the idea credit). */
export const EndCardNight: React.FC<{ from: number; credit?: string }> = ({ from, credit }) => {
  const { frame, fps } = useT();
  if (frame < from * fps) return null;
  const k = spring({ frame: frame - from * fps, fps, config: { damping: 14, stiffness: 150 } });
  const k2 = spring({ frame: frame - from * fps - 5, fps, config: { damping: 14, stiffness: 150 } });
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Sky />
      <div style={{ position: 'absolute', left: SAFE.left, width: SAFE_W, top: 760, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34 }}>
        <div style={{ transform: `scale(${lerp(0.88, 1, k)})`, opacity: clamp(k * 2) }}><Wordmark size={156} /></div>
        <div style={{ fontFamily: F_CAP, fontWeight: 700, fontSize: 44, color: N.cream, opacity: clamp(k2 * 2), transform: `translateY(${lerp(16, 0, k2)}px)`, textAlign: 'center' }}>
          Tiny goals. Every day. <span style={{ color: N.gold }}>Better with friends.</span>
        </div>
        {credit ? <div style={{ fontFamily: F_CAP, fontWeight: 600, fontSize: 30, color: N.cream, opacity: 0.6 * clamp(k2 * 2) }}>{credit}</div> : null}
      </div>
    </div>
  );
};
