// The 28 states, verbatim from the bible's `S` table, plus the art constants.
import type { BodyAnim } from './anim';

export const INK = '#1C1814', PAPER = '#F4EFE6', GOLD = '#CFAE52', SAGE = '#8DA877';

export const PALS = {
  blue: { body: '#4A86D4', shade: '#3469B0' },
  teal: { body: '#2FA59B', shade: '#1F8077' },
  orange: { body: '#D9431E', shade: '#B8381A' },
  sky: { body: '#7FB7E6', shade: '#5B96C9' },
  sun: { body: '#F2BE4A', shade: '#D29F2E' },
  lilac: { body: '#A98BD0', shade: '#8B6DB4' },
  coral: { body: '#F2867A', shade: '#D4675C' },
  mint: { body: '#86D1B0', shade: '#62B08F' },
} as const;
export type PalName = keyof typeof PALS;

export const P_FULL = 'M120 30C170 30 195 75 195 120C195 170 160 205 120 210C80 205 45 170 45 120C45 75 70 30 120 30Z';
export const P_DEFL = 'M120 88C160 88 180 120 176 152C172 182 150 204 120 208C90 204 68 182 64 152C60 120 80 88 120 88Z';
export const STRING_TAUT = 'M120 218C112 240 128 262 120 298';
export const STRING_SLACK = 'M120 218C96 236 146 262 108 298';

export const MOUTH: Record<string, ['p' | 'f' | 'o', string?]> = {
  smile: ['p', 'M108 150Q120 160 132 150'], smallsmile: ['p', 'M112 152Q120 157 128 152'],
  grin: ['f', 'M104 146Q120 172 136 146Z'], flat: ['p', 'M111 154L129 154'], frown: ['p', 'M109 159Q120 149 131 159'],
  o: ['o'], wavy: ['p', 'M105 155q3.75 -4 7.5 0t7.5 0t7.5 0t7.5 0'], smirk: ['p', 'M110 152Q124 160 134 148'], sleep: ['p', 'M115 155Q120 158 125 155'],
};
export const BROWS: Record<string, [string, string]> = {
  calm: ['M84 84Q95 80 106 83', 'M134 83Q145 80 156 84'], happy: ['M84 82Q95 73 106 80', 'M134 80Q145 73 156 82'],
  raised: ['M84 76Q95 67 106 73', 'M134 73Q145 67 156 76'], sad: ['M84 85Q96 83 106 74', 'M134 74Q144 83 156 85'],
  determined: ['M84 76Q96 78 106 86', 'M134 86Q144 78 156 76'], puzzled: ['M84 76Q95 67 106 73', 'M134 84L156 84'],
};

export type Hand = 'open' | 'palm' | 'thumb';
export type Prop = 'flame' | 'bell' | 'magnifier' | 'shield' | 'trophy';
export type Fx = 'zzz' | 'sweat' | 'stars' | 'q' | 'heart' | 'lines' | 'wifi' | 'burst';
export type StateDef = {
  mouth?: string; brows?: string; la?: number; ra?: number; lh?: Hand; rh?: Hand;
  lsw?: [number, number, number]; rsw?: [number, number, number]; poke?: boolean; prop?: Prop; fx?: Fx[];
  anim?: BodyAnim; body?: 'defl'; grot?: number; gdy?: number; tilt?: number; slack?: boolean; flex?: boolean; peek?: boolean; icon?: boolean;
};

export const S = {
  idle: { mouth: 'smile', brows: 'calm', anim: 'float' },
  thumbs_up: { mouth: 'smirk', brows: 'calm', ra: -140, rh: 'thumb', anim: 'float' },
  streak_fire: { mouth: 'grin', brows: 'happy', ra: -150, prop: 'flame', anim: 'float' },
  waving: { mouth: 'smile', brows: 'happy', rh: 'open', rsw: [-135, -172, 0.38] },
  waving_confident: { mouth: 'grin', brows: 'raised', la: 5, rh: 'open', rsw: [-145, -182, 0.28], anim: 'pulse' },
  pointing: { mouth: 'smile', brows: 'calm', ra: -100, rh: 'palm', anim: 'float' },
  nudge: { mouth: 'smirk', brows: 'raised', ra: -92, rh: 'palm', poke: true, fx: ['lines'], anim: 'float' },
  goodbye: { mouth: 'smallsmile', brows: 'calm', rh: 'open', rsw: [-140, -165, 0.55], anim: 'drift' },
  streak_broken: { body: 'defl', mouth: 'frown', brows: 'sad', la: 8, ra: -8, grot: 9, anim: 'sink', slack: true },
  worried: { mouth: 'wavy', brows: 'sad', la: -38, ra: 38, anim: 'float' },
  nervous: { mouth: 'wavy', brows: 'sad', grot: -6, fx: ['sweat'], anim: 'jitter' },
  supportive: { mouth: 'smile', brows: 'calm', ra: -32, rh: 'palm', anim: 'float' },
  comforting: { mouth: 'smallsmile', brows: 'sad', la: -58, ra: 58, fx: ['heart'], anim: 'breathe' },
  resting: { mouth: 'sleep', brows: 'none', la: 14, ra: -14, gdy: 7, tilt: -7, fx: ['zzz'], anim: 'breathe' },
  shrug: { mouth: 'flat', brows: 'raised', la: 112, ra: -112, lh: 'open', rh: 'open', anim: 'tilt' },
  offline: { mouth: 'flat', brows: 'raised', la: 112, ra: -112, lh: 'open', rh: 'open', fx: ['wifi'], anim: 'float' },
  thinking: { mouth: 'smirk', brows: 'puzzled', ra: 70, fx: ['q'], anim: 'tilt' },
  error: { mouth: 'o', brows: 'puzzled', la: 122, ra: -122, lh: 'open', rh: 'open', grot: 8, fx: ['q'], anim: 'jitter' },
  cheering: { mouth: 'grin', brows: 'happy', lsw: [150, 176, 0.24], rsw: [-150, -176, 0.24], anim: 'bounce' },
  celebrating: { mouth: 'grin', brows: 'happy', la: 145, ra: -145, lh: 'open', rh: 'open', fx: ['stars'], anim: 'bounce' },
  strong: { mouth: 'smirk', brows: 'determined', flex: true, anim: 'float' },
  high_five: { mouth: 'grin', brows: 'happy', ra: -170, rh: 'open', fx: ['burst'], anim: 'float' },
  trophy: { mouth: 'grin', brows: 'happy', ra: -150, prop: 'trophy', fx: ['stars'], anim: 'float' },
  searching: { mouth: 'o', brows: 'puzzled', ra: -115, prop: 'magnifier', anim: 'scan' },
  bell: { mouth: 'o', brows: 'raised', ra: -150, prop: 'bell', anim: 'float' },
  peeking: { mouth: 'smile', brows: 'calm', peek: true },
  shield: { mouth: 'smirk', brows: 'determined', ra: -105, prop: 'shield', anim: 'float' },
  app_icon: { icon: true },
} satisfies Record<string, StateDef>;
export type StateId = keyof typeof S;
