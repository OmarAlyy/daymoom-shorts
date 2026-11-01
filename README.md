# Daymoom Shorts

Vertical short videos (TikTok, Reels, Facebook Reels, YouTube Shorts) starring the
Daymoom Balloon. Everything is drawn and animated in code (Remotion), so the
character stays exactly on-model in every frame.

**Status:** first video rendered. The voice track is pending (the TTS engine
isn't chosen yet), so for now the captions carry the voice lines.

## Videos

| # | Title | Length | Hook |
|---|---|---|---|
| 01 | One percent a day ([script](scripts/01-one-percent.md)) | 49.5s | "This time will be different." |

## Layout

- `brand/`: `brand.json`, the owner's `style-prompts.md` and `flow-prompt-pack.txt`, and `reference/` (character, poses, background, style frame, wordmark — the visual source of truth). `character-bible.html` is early reference only.
- `src/rig/Balloon.tsx`: the character rig v2, built from the owner's style guide. The face and arms are pose parameters, and keys spring between poses: brows lead, the mouth follows 2 frames later, the arms 4 frames later.
- `src/compositions/`: one composition per video. `CharacterTest.tsx` holds the acting test and the expression sheet.
- `src/videos/*.json`: timing data per video, shared by the composition and the sound script.
- `src/components/Kit.tsx`: shared pieces (night sky, captions, cards, end card).
- `tools/render.mjs`: renders the sound, the MP4 (H.264 + AAC, 1080×1920, 30fps) and a cover.
- `tools/sound.py`: an original music bed plus SFX, mastered to −14 LUFS with a −1.5 dBTP peak ceiling.
- `tools/still.mjs`: renders single frames for checking.

## Re-render

```bash
npm install
node tools/render.mjs              # every video: sound → videos/<id>.mp4 → covers/<id>.jpg
node tools/render.mjs 00           # only ids starting with 00
node tools/render.mjs 00 --qa      # contact sheet with safe-zone guides → qa/
node tools/still.mjs sheet 0 qa/sheet.png   # expression sheet
```

Safe zone: nothing important in the top 250px, bottom 400px or right 150px.
Never commit files over 90MB; renders are about 4MB each.
