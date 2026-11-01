import type { StateId } from './character/states';

export type Lang = 'ar' | 'en';
export type SfxType = 'pop' | 'tick' | 'ding' | 'whoosh' | 'thud' | 'deflate' | 'inflate' | 'bell' | 'chime' | 'squeak' | 'puff' | 'sparkle';

/**
 * The data half of a video. The JSON is read by both the composition (timing)
 * and tools/sound.py (music + SFX on the same beats). Times are in seconds.
 */
export type VideoMeta = {
  id: string; // "01-said-yes"
  title: string;
  lang: Lang;
  version: 'silent' | 'narrator';
  durationSec: number;
  endCardAt: number; // brand end card from here to the end (<= 1.5s)
  hook: string; // what holds frame 1, for the README
  music: { bpm: number; key: string; sections: { at: number; mood: 'major' | 'minor' }[] };
  track: { at: number; state: StateId }[];
  cam: { at: number; s: number; x?: number; y?: number }[];
  glints: number[];
  sfx: { at: number; type: SfxType }[];
};
