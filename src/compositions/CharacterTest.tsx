// Rig v2 acting test (not a post) + expression sheet still.
import React from 'react';
import { AbsoluteFill, Audio, getStaticFiles, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { BalloonRig, P, pose, type Key } from '../rig/Balloon';
import { NightSky } from '../components/Kit';
import { SafeGuides } from '../components/SafeGuides';
import { COL, FONT_TEXT, SAFE_CX } from '../theme';
import spec from '../videos/00-character-test.json';

const BEATS: { at: number; name: string; pose: ReturnType<typeof pose> }[] = [
  { at: 0, name: '', pose: pose(P.calm) },
  { at: 0.6, name: 'هادي', pose: pose(P.smile) },
  { at: 1.4, name: 'بيسلّم', pose: pose(P.wave) },
  { at: 3.0, name: 'بيفكّر', pose: pose(P.think) },
  { at: 4.6, name: 'اتفاجئ', pose: pose(P.surprised) },
  { at: 5.8, name: 'زعلان', pose: pose(P.sad) },
  { at: 7.6, name: 'مصمم', pose: pose(P.determined, { hold: 'flame' }) },
  { at: 9.0, name: 'فرحان', pose: pose(P.joy) },
  { at: 10.4, name: 'كول', pose: pose(P.cool) },
];
const KEYS: Key[] = BEATS.map((b) => ({ at: b.at, pose: b.pose }));
const FRIEND: Key[] = [{ at: 0, pose: pose(P.smile) }, { at: 9.0, pose: pose(P.joy) }, { at: 10.4, pose: pose(P.smile) }];
const CAMS = [{ at: 0, s: 1 }, { at: 3.0, s: 1.28, y: 60 }, { at: 4.6, s: 1.0 }, { at: 5.8, s: 1.15, y: -30 }, { at: 7.6, s: 1.0 }, { at: 9.0, s: 0.9 }, { at: 10.4, s: 1.2, y: 40 }];

export const CharacterTest: React.FC<{ guides?: boolean }> = ({ guides }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  // camera: spring between keys
  let s = 1, y = 0;
  for (let i = 0; i < CAMS.length; i++) {
    if (t < CAMS[i].at) break;
    const k = i === 0 ? 1 : spring({ frame: frame - CAMS[i].at * fps, fps, config: { damping: 20, stiffness: 60 } });
    s = s + (CAMS[i].s - s) * k; y = y + ((CAMS[i].y ?? 0) - y) * k;
  }
  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 70 } });
  const friendIn = spring({ frame: frame - 8.8 * fps, fps, config: { damping: 14, stiffness: 70 } });
  const beat = [...BEATS].reverse().find((b) => t >= b.at);
  const audio = `audio/${spec.id}.wav`;
  const hasAudio = getStaticFiles().some((f) => f.name === audio);
  return (
    <AbsoluteFill>
      <NightSky />
      <div style={{ position: 'absolute', left: SAFE_CX, top: 960, transform: `scale(${s}) translate(0px, ${y}px)` }}>
        {t >= 8.8 ? (
          <div style={{ position: 'absolute', left: -300 - 400 * (1 - friendIn), top: 120 }}>
            <BalloonRig keys={FRIEND} color="coral" size={250} />
          </div>
        ) : null}
        <div style={{ position: 'absolute', left: 0, top: 900 * (1 - enter) }}>
          <BalloonRig keys={KEYS} color="blue" size={470} glints={spec.glints} />
        </div>
      </div>
      {beat && beat.name ? (
        <div dir="rtl" style={{ position: 'absolute', top: 300, left: 60, width: 870, textAlign: 'center', fontFamily: FONT_TEXT, fontWeight: 700, fontSize: 64, color: COL.paper, opacity: 0.85 }}>{beat.name}</div>
      ) : null}
      {hasAudio ? <Audio src={staticFile(audio)} /> : null}
      {guides ? <SafeGuides /> : null}
    </AbsoluteFill>
  );
};

const SHEET: [string, keyof typeof P, object?][] = [
  ['هادي', 'smile'], ['كول', 'cool'], ['ضحكة', 'grin'], ['فرحان', 'joy'],
  ['بيفكّر', 'think'], ['مش مصدّق', 'doubt'], ['اتفاجئ', 'surprised'], ['قلقان', 'worried'],
  ['زعلان', 'sad'], ['مصمم', 'determined', { hold: 'flame' }], ['بيحضن', 'hug'], ['نايم', 'sleep'],
];
export const ExpressionSheet: React.FC = () => (
  <AbsoluteFill>
    <NightSky moon={{ x: 980, y: 140, r: 46 }} />
    <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(4, 1fr)', padding: '60px 20px' }}>
      {SHEET.map(([name, key, extra], i) => (
        <div key={i} style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '50%', top: '44%' }}>
            <BalloonRig keys={[{ at: 0, pose: pose(P[key], extra || {}) }]} size={210} floatAmp={0} color={i === 10 ? 'coral' : 'blue'} />
          </div>
          <div dir="rtl" style={{ position: 'absolute', bottom: 18, width: '100%', textAlign: 'center', fontFamily: FONT_TEXT, fontWeight: 700, fontSize: 38, color: COL.paper }}>{name}</div>
        </div>
      ))}
    </div>
  </AbsoluteFill>
);
