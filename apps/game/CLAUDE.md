# CLAUDE.md

This file is for AI coding agents working on this project.

## Project Intent

Build and maintain a cozy pixel village focus/todo game MVP. The target feeling is a dense, readable, warm top-down farming RPG scene with a focus timer and lightweight productivity UI.

Do not copy the reference screenshot's exact assets, characters, or layout. Treat `legacy/reference/reference-screenshot.png` as visual direction only.

## Commands

Use these before handing off changes:

```bash
npm run build
```

For local development:

```bash
npm install
npm run dev
```

## Important Files

- `src/main.ts`: Phaser scene, generated pixel textures, map layout, game state, timer/todo interactions.
- `src/style.css`: HUD, dialogue, todo panel, responsive CSS, pixel rendering rules.
- `public/assets/kenney/`: runtime third-party CC0 asset files.
- `legacy/`: reference-only material. Do not import from here in app code.
- `docs/`: handoff, risks, QA, and reference notes.

## Engineering Rules

- Keep runtime code independent from `legacy/`.
- Preserve pixel crispness:
  - Phaser `pixelArt: true`
  - `roundPixels: true`
  - CSS `image-rendering: pixelated`
  - avoid fractional canvas scaling when possible
- Keep the MVP small and shippable. Prefer visual polish over adding large new systems.
- Do not add copied Stardew Valley or screenshot-derived assets.
- If adding external assets, document license and source in `ASSET_CREDITS.md` and `docs/REFERENCES.md`.

## Visual Quality Bar

Before finalizing visual work, inspect:

- The map does not feel empty.
- Houses and trees share palette, scale, outline thickness, and shadow direction.
- HUD text is readable over the map.
- UI panels do not overlap awkwardly at laptop width.
- Pixel art is not blurry.
- New art does not clash with Kenney assets.

## Current Risks

- Procedural sprites are useful for prototyping but can look homemade.
- More free asset packs may clash unless normalized to the same tile size, palette, and outline style.
- Phaser's bundle is large; acceptable for this MVP, but production may need code splitting or a lighter build strategy.
- Todo persistence is browser-local only.
