# Daymoom Shorts

Vertical short videos (TikTok, Reels, Facebook Reels, YouTube Shorts) starring the
Daymoom Balloon. Everything is drawn and animated in code (Remotion), so the
character stays exactly on-model in every frame.

**Status:** groundwork. The character rig v2 is built, and an acting test
(`00-character-test`) is waiting for the owner's review. No finished videos yet.

## Videos

| # | Title | Length | Hook |
|---|---|---|---|
| — | none published yet | | |

## Layout

- `brand/`: `brand.json` (colours, fonts, rules and the owner's decisions), the owner's `style-prompts.md`, and `character-bible.html`.
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
