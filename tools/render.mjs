// Render videos, covers and QA sheets.
//
//   node tools/render.mjs                 # every video: sound → mp4 → cover
//   node tools/render.mjs 01 03           # only ids starting with 01 / 03
//   node tools/render.mjs 01 --qa         # QA contact sheet (safe-zone guides on) into qa/
//
// Uses the pre-installed Chromium headless shell when present (set
// REMOTION_BROWSER to override).
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
process.chdir(root);
const args = process.argv.slice(2);
const qa = args.includes('--qa');
const only = args.filter((a) => !a.startsWith('--'));

const candidates = [
  process.env.REMOTION_BROWSER,
  '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',
].filter(Boolean);
const browserExecutable = candidates.find((p) => fs.existsSync(p)) || null;

const specs = fs.readdirSync('src/videos').filter((f) => f.endsWith('.json')).sort()
  .map((f) => JSON.parse(fs.readFileSync(path.join('src/videos', f), 'utf8')))
  .filter((s) => !only.length || only.some((o) => s.id.startsWith(o)));

if (!qa) for (const s of specs) execFileSync('python3', ['tools/sound.py', `src/videos/${s.id}.json`], { stdio: 'inherit' });

const serveUrl = await bundle({ entryPoint: path.join(root, 'src/index.ts') });
const common = { serveUrl, browserExecutable, chromiumOptions: { gl: 'swangle' } };

for (const spec of specs) {
  const inputProps = { guides: qa };
  const composition = await selectComposition({ ...common, id: 'v' + spec.id, inputProps });
  if (qa) {
    fs.mkdirSync(`qa/${spec.id}`, { recursive: true });
    const times = [0, 0.5, 1.0, 1.9];
    for (let t = 3.5; t < spec.durationSec; t += 1.5) times.push(+t.toFixed(2));
    times.push(spec.endCardAt + 0.6);
    for (const t of times) {
      const frame = Math.min(composition.durationInFrames - 1, Math.round(t * 30));
      await renderStill({ ...common, composition, inputProps, frame, output: `qa/${spec.id}/f${String(frame).padStart(4, '0')}.png`, imageFormat: 'png' });
    }
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-pattern_type', 'glob', '-i', `qa/${spec.id}/f*.png`,
      '-vf', 'scale=270:480,tile=8x4:padding=6:color=white', '-frames:v', '1', `qa/${spec.id}-sheet.png`]);
    console.log('qa sheet', `qa/${spec.id}-sheet.png`);
    continue;
  }
  const out = `videos/${spec.id}.mp4`;
  let last = -1;
  await renderMedia({
    ...common, composition, inputProps, codec: 'h264', audioCodec: 'aac', audioBitrate: '192k', crf: 20,
    pixelFormat: 'yuv420p', outputLocation: out, concurrency: 4,
    onProgress: ({ progress }) => { const p = Math.floor(progress * 10); if (p !== last) { last = p; process.stdout.write(`${spec.id} ${p * 10}%\n`); } },
  });
  // Cover: the hook frame (hook text + character), as a JPEG.
  await renderStill({ ...common, composition, inputProps, frame: 15, output: `covers/${spec.id}.jpg`, imageFormat: 'jpeg', jpegQuality: 90 });
  console.log('rendered', out);
}
