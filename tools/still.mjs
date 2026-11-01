// node tools/still.mjs <compositionId> <frame> <out.png>
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'node:path';
const [id, frame, out] = process.argv.slice(2);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const serveUrl = await bundle({ entryPoint: path.join(root, 'src/index.ts') });
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const composition = await selectComposition({ serveUrl, id, inputProps: {}, browserExecutable });
for (const f of String(frame).split(',')) {
  const o = out.replace('%f', f);
  await renderStill({ serveUrl, composition, frame: Number(f), output: o, browserExecutable, inputProps: {} });
  console.log(o);
}
