// 01 · One percent a day — from the owner's Flow prompt pack (brand/flow-prompt-pack.txt),
// built in code instead of Veo. Script: scripts/01-one-percent.md
import React from 'react';
import { AbsoluteFill, Audio, getStaticFiles, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { BalloonRig, P, pose, type Key } from '../rig/Balloon';
import { Sky, Headline, Cap, Glass, Check, ShieldBubble, Sparkles, EndCardNight, N, F_HEAD, F_CAP } from '../components/Night';
import { SafeGuides } from '../components/SafeGuides';
import { EIO, clamp, lerp } from '../character/anim';
import spec from '../videos/01-one-percent.json';

type Span = { from: number; to: number; text: string };
const S = spec as unknown as { id: string; glints: number[]; captions: Span[]; headlines: Span[]; endCardAt: number; credit: string };

// ---------------------------------------------------------------- performance
const k = (at: number, ...parts: object[]): Key => ({ at, pose: pose(...(parts as never[])) });
const KEYS: Key[] = [
  k(0, P.surprised),
  k(0.55, P.cool),
  k(2.0, P.pointCam),
  k(3.4, P.smile),
  k(5.1, P.shrugOpen),
  // clip 2 · back to zero
  k(8.0, P.sad),
  k(8.6, P.sad, { air: 0.74, lift: 50 }),
  k(11.0, P.sad, { air: 0.74, lift: 50, tilt: -12 }),
  k(11.35, P.sad, { air: 0.74, lift: 50, tilt: 7 }),
  k(11.7, P.sad, { air: 0.74, lift: 50, tilt: -5 }),
  k(12.1, P.sad, { air: 0.74, lift: 50, tilt: 2 }),
  k(13.0, P.lopsided, { air: 0.78, lift: 40, slack: 0.6 }),
  // clip 3 · the secret
  k(16.0, P.surprised, { lift: -40 }),
  k(16.45, P.cool),
  k(18.2, P.cool, { lean: 12, tilt: 6 }),
  k(21.2, P.pointUp),
  // clip 4 · the climb
  k(24.0, P.smile),
  k(27.0, P.grin),
  k(29.0, P.joy),
  k(30.6, P.proud),
  // clip 5 · the valley
  k(32.0, P.worried),
  k(35.0, P.worried, { glasses: { tilt: 0, y: 4 }, tilt: -7, lean: -4 }),
  k(37.2, P.flex),
  // clip 6 · tiny steps
  k(40.0, P.smile),
  k(40.5, P.grin),
  k(43.2, P.thumbsUp),
  k(46.2, P.waveOpen),
];

// the climb: an exponential path toward the moon
const path = (u: number) => ({ x: 250 + 550 * u, y: 1560 - 920 * ((Math.exp(3 * u) - 1) / (Math.exp(3) - 1)) });
const PATH_D = (() => { let d = ''; for (let i = 0; i <= 60; i++) { const p = path(i / 60); d += `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`; } return d; })();

// balloon placement keys (screen px of the body centre, body height px)
type Place = { at: number; x: number; y: number; size: number };
const PLACES: Place[] = [
  { at: 0, x: 540, y: 880, size: 470 },
  { at: 8.0, x: 540, y: 900, size: 470 },
  { at: 16.0, x: 540, y: 870, size: 470 },
  { at: 32.0, x: 540, y: 930, size: 440 },
  { at: 37.2, x: 540, y: 840, size: 450 },
  { at: 40.0, x: 540, y: 880, size: 450 },
  { at: 46.2, x: 540, y: 880, size: 380 },
];
const CAMS = [
  { at: 0, s: 0.92 }, { at: 2.0, s: 1.0 }, { at: 5.0, s: 1.12, y: 30 }, { at: 8.0, s: 1.05 }, { at: 11.0, s: 1.25, y: -10 }, { at: 13.0, s: 1.1 },
  { at: 16.0, s: 0.95 }, { at: 18.2, s: 1.32, y: 40 }, { at: 21.2, s: 1.0 }, { at: 24.0, s: 1.0 }, { at: 32.0, s: 1.0 }, { at: 35.0, s: 1.12, y: -40 },
  { at: 37.2, s: 1.0 }, { at: 40.0, s: 1.0 }, { at: 43.2, s: 1.05 }, { at: 46.2, s: 0.92 },
];

const springTo = <T extends { at: number }>(keys: T[], frame: number, fps: number, get: (k: T) => number, damping = 18, stiffness = 90) => {
  let v = get(keys[0]);
  for (let i = 1; i < keys.length; i++) {
    if (frame < keys[i].at * fps) break;
    const kk = spring({ frame: frame - keys[i].at * fps, fps, config: { damping, stiffness } });
    v = v + (get(keys[i]) - v) * kk;
  }
  return v;
};

export const OnePercent: React.FC<{ guides?: boolean }> = ({ guides }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // camera
  const camS = springTo(CAMS, frame, fps, (c) => c.s, 20, 60);
  const camY = springTo(CAMS, frame, fps, (c) => (c as { y?: number }).y ?? 0, 20, 60);

  // balloon placement
  let bx = springTo(PLACES, frame, fps, (p) => p.x);
  let by = springTo(PLACES, frame, fps, (p) => p.y);
  let bs = springTo(PLACES, frame, fps, (p) => p.size);
  // clip 1: drop in from the top, already in frame on frame 1
  const drop = spring({ frame, fps, config: { damping: 9, stiffness: 120, mass: 0.8 } });
  by += lerp(-170, 0, drop);
  // clip 4: ride the path
  const c4 = t >= 23.6 && t < 32.4;
  const draw = clamp((t - 24.0) / 1.2);
  if (c4) {
    const u = EIO(clamp((t - 24.8) / 4.2));
    const p = path(u);
    const into = spring({ frame: frame - 23.6 * fps, fps, config: { damping: 18, stiffness: 90 } });
    const outk = spring({ frame: frame - 31.6 * fps, fps, config: { damping: 18, stiffness: 90 } });
    const tx = p.x, ty = p.y - 215, ts = 270;
    bx = lerp(bx, tx, into * (1 - outk)); by = lerp(by, ty, into * (1 - outk)); bs = lerp(bs, ts, into * (1 - outk));
  }
  const pathOn = t >= 24.0 && t < 32.4 ? clamp((32.4 - t) / 0.4) : 0;
  const valleyOn = t >= 31.8 && t < 40.4 ? Math.min(clamp((t - 31.8) / 0.5), clamp((40.4 - t) / 0.4)) : 0;

  // landing squash on the drop (volume kept)
  const land = t > 0.35 && t < 0.75 ? Math.sin(((t - 0.35) / 0.4) * Math.PI) * 0.05 : 0;

  // clip 2 counter
  const streak = t < 10.2 ? 21 : Math.max(0, Math.round(lerp(21, 0, EIO(clamp((t - 10.2) / 0.6)))));

  const drift = t >= 24 && t < 32 ? (t - 24) * 70 : t >= 32 ? 560 : 0;
  const audio = `audio/${spec.id}.wav`;
  const hasAudio = getStaticFiles().some((f) => f.name === audio);

  return (
    <AbsoluteFill style={{ background: N.ground }}>
      <Sky drift={drift} moonY={c4 ? -(t - 24) * 4 : 0} />

      {/* world (camera) */}
      <div style={{ position: 'absolute', inset: 0, transformOrigin: '540px 960px', transform: `scale(${camS}) translateY(${camY}px)` }}>
        {/* clip 4 path */}
        {pathOn > 0 ? (
          <svg style={{ position: 'absolute', inset: 0 }} width={1080} height={1920} opacity={pathOn}>
            <path d={PATH_D} stroke={N.gold} strokeWidth={30} opacity={0.18} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
            <path d={PATH_D} stroke={N.gold} strokeWidth={9} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
          </svg>
        ) : null}
        {/* clip 5 valley */}
        {valleyOn > 0 ? (
          <svg style={{ position: 'absolute', inset: 0 }} width={1080} height={1920} opacity={valleyOn}>
            <path d="M-100 1920L-100 1150C160 1120 300 1330 540 1360C780 1330 920 1120 1180 1150L1180 1920Z" fill={N.card2} transform={`translate(0 ${lerp(60, 0, valleyOn)})`} />
            <path d="M-100 1920L-100 1290C200 1260 330 1460 540 1490C750 1460 880 1260 1180 1290L1180 1920Z" fill={N.card} transform={`translate(0 ${lerp(90, 0, valleyOn)})`} />
          </svg>
        ) : null}

        {/* the Balloon */}
        <div style={{ position: 'absolute', left: bx, top: by, transform: `scale(${1 + land}, ${1 - land})`, transformOrigin: '0 0' }}>
          <BalloonRig keys={KEYS} size={bs} glints={S.glints} />
        </div>

        {/* clip 6 */}
        <Check x={220} y={700} at={40.5} />
        <Check x={860} y={760} at={41.3} />
        <Check x={230} y={1080} at={42.1} />
        <ShieldBubble cx={540} cy={900} r={310} from={43.2} to={46.0} />
        <Sparkles cx={bx} cy={by} at={29.0} radius={240} n={12} />
        <Sparkles cx={540} cy={900} at={37.2} radius={300} n={8} />
      </div>

      {/* overlays (not affected by the camera) */}
      {S.headlines.map((h, i) => <Headline key={i} {...h} />)}
      <Glass x={540} y={560} from={8.4} to={16.0}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <span style={{ fontWeight: 700, fontSize: 52, opacity: 0.75 }}>Streak</span>
          <span style={{ fontFamily: F_HEAD, fontWeight: 800, fontSize: 110, color: streak === 0 ? N.cream : N.gold, opacity: streak === 0 ? 0.6 : 1, minWidth: 100, textAlign: 'center' }}>{streak}</span>
          <span style={{ fontWeight: 700, fontSize: 52, opacity: 0.75 }}>days</span>
        </div>
      </Glass>
      <Glass x={90} y={330} from={27.0} to={32.0} anchor="left">
        <div style={{ fontFamily: F_HEAD, fontWeight: 800, fontSize: 120, color: N.gold, lineHeight: 1 }}>37×</div>
        <div style={{ fontFamily: F_CAP, fontWeight: 700, fontSize: 34, opacity: 0.85, marginTop: 6 }}>1.01<sup style={{ fontSize: 22 }}>365</sup> ≈ 37.8</div>
        <div style={{ fontFamily: F_CAP, fontWeight: 600, fontSize: 26, opacity: 0.6, marginTop: 10 }}>Atomic Habits · James Clear</div>
      </Glass>
      {S.captions.map((c, i) => <Cap key={i} {...c} />)}
      <EndCardNight from={S.endCardAt} credit={S.credit} />
      {hasAudio ? <Audio src={staticFile(audio)} /> : null}
      {guides ? <SafeGuides /> : null}
    </AbsoluteFill>
  );
};
