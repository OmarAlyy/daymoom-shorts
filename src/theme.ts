import brand from '../brand/brand.json';

export const W = 1080, H = 1920, FPS = 30;
const sz = brand.video.safe_zone;
/** Everything important lives inside this box (platform UI covers the rest). */
export const SAFE = { left: sz.left, top: sz.top, right: W - sz.right, bottom: H - sz.bottom };
export const SAFE_W = SAFE.right - SAFE.left;
export const SAFE_CX = (SAFE.left + SAFE.right) / 2;

// Style: brand/style-prompts.md + the owner's style guide (brand/style-guide.md).
// Night is the primary ground; arms and string are cream on it (bible dark rule).
export const PAL = 'blue' as const;
export const COL = {
  ground: '#080C24', // night
  glow: '#22337A', // radial sky glow, centre → edges
  moon: '#F4E7C2', crater: '#E2D2A3',
  card: '#121A3A', card2: '#1A2350',
  ink: brand.colors.ink,
  paper: brand.colors.paper, // cream text / stars
  white: '#FFFFFF',
  gold: '#F2BE4A', // streaks and achievements (UI)
  success: '#86D1B0',
  lightBlue: '#7FB7E6',
  body: brand.colors.body_palettes.blue.body,
  shade: brand.colors.body_palettes.blue.shade,
  // day ground (secondary)
  dayGround: '#F4EFE6', daySky: '#7FB7E6', daySkyLight: '#DCEBF8',
};
/** Friend balloons: same shape exactly, only the body colour changes. */
export const FRIENDS = ['coral', 'mint', 'sun', 'lilac', 'teal', 'orange'] as const;

export const FONT_TEXT = "'Plex Arabic', system-ui, sans-serif";
export const FONT_CAPTION = "'Baloo Bhaijaan 2', 'Plex Arabic', sans-serif"; // bold rounded sans
export const FONT_DISPLAY = "'Young Serif', serif";
