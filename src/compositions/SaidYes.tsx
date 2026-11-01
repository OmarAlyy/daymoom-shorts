// 01 · Said yes — silent version (music + SFX + counters + one line at the end).
// Script: scripts/01-said-yes.md · data: src/videos/01-said-yes.json
import React from 'react';
import { AbsoluteFill, Audio, staticFile, getStaticFiles, useCurrentFrame, useVideoConfig } from 'remotion';
import { BalloonAt, Bubble, Caption, Card, EndCard, NightSky, camAt } from '../components/Kit';
import { SafeGuides } from '../components/SafeGuides';
import { EIO, EOUT, clamp, lerp } from '../character/anim';
import { PALS } from '../character/states';
import { FRIENDS } from '../theme';
import spec from '../videos/01-said-yes.json';
import type { VideoMeta } from '../types';

const S = spec as unknown as VideoMeta & {
  requests: number[]; noAt: number; ownGoalAt: number; endLine: { from: number; to: number; text: string };
};
const CX = 540, CY = 990, SIZE = 580; // the Balloon
const FS = 360, FY = 1090; // friend balloons
const FX_LEFT = 200, FX_RIGHT = 830;
const ID_CAM = { s: 1, x: 0, y: 0 };

export const SaidYes: React.FC<{ guides?: boolean }> = ({ guides }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cam = camAt(S.cam, t);

  // ---- friends asking for a favour: come in from the left (0.35s), nudge, get a yes at +0.45, float off from +0.7
  const friends = S.requests.map((a, i) => {
    const d = t - a;
    if (d < 0 || d > 1.3) return null;
    const inK = a === 0 ? 1 : EOUT(clamp(d / 0.35));
    const outK = EIO(clamp((d - 0.75) / 0.5));
    const x = lerp(-220, FX_LEFT, inK) - 320 * outK;
    const y = FY - 260 * outK;
    return { i, a, d, x, y, pal: FRIENDS[i % FRIENDS.length] };
  }).filter((f): f is NonNullable<typeof f> => f !== null);

  // ---- the one it says no to: from the right, bumps the shield, drifts back, leaves without a tick
  const nd = t - S.noAt;
  const hit = 1.35; // just after the shield lands
  let noFriend: { x: number; y: number } | null = null;
  if (nd >= 0 && nd < 3.4) {
    const inK = EOUT(clamp(nd / 0.7));
    const lean = nd < hit ? lerp(0, -30, clamp((nd - 1.0) / 0.35)) : lerp(-30, 110, EOUT(clamp((nd - hit) / 0.4)));
    const leave = EIO(clamp((nd - 2.4) / 0.9));
    noFriend = { x: lerp(1260, FX_RIGHT, inK) + lean + 380 * leave, y: FY - 30 - 200 * leave };
  }

  // ---- counters
  const yesCount = S.requests.filter((a) => t >= a + 0.45).length;
  const lastYes = [...S.requests].reverse().find((a) => t >= a + 0.45);
  const own = t >= S.ownGoalAt ? 1 : 0;
  const cardsOn = t < S.endLine.from;

  // ---- lens reflection: whoever is in front of the glasses
  const near = friends.length ? friends[friends.length - 1] : null;
  const lens = noFriend && nd < 2.4
    ? <circle cx={9} cy={5} r={7} fill={PALS.orange.body} opacity={0.75} />
    : near ? <circle cx={-9} cy={5} r={7} fill={PALS[near.pal].body} opacity={0.75} /> : null;

  const audio = `audio/${S.id}.wav`;
  const hasAudio = getStaticFiles().some((f) => f.name === audio);
  return (
    <AbsoluteFill>
      <NightSky />
      {cardsOn ? (
        <>
          <Card lang="ar" label="قلت أيوه" value={yesCount} x={CX + 175} y={290} punchAt={lastYes !== undefined ? lastYes + 0.45 : undefined} />
          <Card lang="ar" label="لنفسي" value={own} x={CX - 190} y={290} dim={own === 0} gold={own > 0}
            punchAt={own ? S.ownGoalAt : t >= 14.5 && t < 17 ? 14.5 : undefined} />
        </>
      ) : null}
      {friends.map((f) => (
        <React.Fragment key={f.i}>
          <BalloonAt track={[{ at: 0, state: 'nudge' }, { at: f.a + 0.45, state: 'idle' }]} cx={f.x} cy={f.y} size={FS} cam={ID_CAM} pal={f.pal} />
          <Bubble x={f.x + 70} y={f.y - 175} kind={f.d >= 0.45 ? 'ok' : '?'} k={f.d >= 0.45 ? (f.d - 0.45) * 5 : f.a === 0 ? 1 : f.d * 4} />
        </React.Fragment>
      ))}
      <BalloonAt track={S.track} cx={CX} cy={CY} size={SIZE} cam={cam} glints={S.glints} lens={lens} />
      {noFriend ? (
        <>
          <BalloonAt track={[{ at: 0, state: 'idle' }]} cx={noFriend.x} cy={noFriend.y} size={FS} cam={ID_CAM} pal="orange" />
          <Bubble x={noFriend.x - 40} y={noFriend.y - 175} kind="?" k={nd * 3} />
        </>
      ) : null}
      <Caption lang="ar" text={S.endLine.text} from={S.endLine.from} to={S.endLine.to} y={1240} size={92} />
      <EndCard from={S.endCardAt} />
      {hasAudio ? <Audio src={staticFile(audio)} /> : null}
      {guides ? <SafeGuides /> : null}
    </AbsoluteFill>
  );
};
