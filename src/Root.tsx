import React from 'react';
import { Composition, staticFile, delayRender, continueRender } from 'remotion';
import { FPS, H, W } from './theme';
import { OnePercent } from './compositions/OnePercent';
import onePct from './videos/01-one-percent.json';
import { CharacterTest, ExpressionSheet } from './compositions/CharacterTest';
import ctest from './videos/00-character-test.json';

// One composition per video. Add new ones here (component + its JSON).
export const VIDEOS: { meta: { id: string; durationSec: number }; component: React.FC<{ guides?: boolean }> }[] = [
  { meta: ctest, component: CharacterTest },
  { meta: onePct, component: OnePercent },
];

// Fonts are self-hosted (OFL), loaded once before any frame renders.
const AR = 'U+0600-06FF, U+0750-077F, U+0870-08FF, U+200C-200E, U+FB50-FDFF, U+FE70-FEFC';
const LAT = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';
const FONTS: [string, string, string, string][] = [
  ['Plex Arabic', 'plex-arabic-600-arabic.woff2', '600', AR],
  ['Plex Arabic', 'plex-arabic-600-latin.woff2', '600', LAT],
  ['Plex Arabic', 'plex-arabic-700-arabic.woff2', '700', AR],
  ['Plex Arabic', 'plex-arabic-700-latin.woff2', '700', LAT],
  ['Baloo Bhaijaan 2', 'baloo-bhaijaan-2-arabic-800-normal.woff2', '800', AR],
  ['Baloo Bhaijaan 2', 'baloo-bhaijaan-2-latin-800-normal.woff2', '800', LAT],
  ['Bricolage Grotesque', 'bricolage-grotesque-latin-800-normal.woff2', '800', LAT],
  ['Manrope', 'manrope-latin-600-normal.woff2', '600', LAT],
  ['Manrope', 'manrope-latin-700-normal.woff2', '700', LAT],
  ['Manrope', 'manrope-latin-800-normal.woff2', '800', LAT],
  ['Young Serif', 'young-serif-400-latin.woff2', '400', LAT],
  ['Young Serif', 'young-serif-400-latin-ext.woff2', '400', 'U+0100-024F, U+1E00-1EFF'],
];
if (typeof document !== 'undefined') {
  const handle = delayRender('fonts');
  Promise.all(FONTS.map(([fam, file, weight, range]) => {
    const f = new FontFace(fam, `url(${staticFile('fonts/' + file)}) format('woff2')`, { weight, unicodeRange: range });
    document.fonts.add(f);
    return f.load();
  })).then(() => continueRender(handle)).catch((e) => { console.error(e); continueRender(handle); });
}

export const Root: React.FC = () => (
  <>
    {VIDEOS.map(({ meta, component }) => (
      <Composition key={meta.id} id={'v' + meta.id} component={component} durationInFrames={Math.round(meta.durationSec * FPS)}
        fps={FPS} width={W} height={H} defaultProps={{ guides: false }} />
    ))}
    <Composition id="sheet" component={ExpressionSheet} durationInFrames={1} fps={FPS} width={W} height={H} />
  </>
);
