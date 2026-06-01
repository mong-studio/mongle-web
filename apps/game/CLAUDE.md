# CLAUDE.md

This file is for AI coding agents working on this project.

## Project Intent

Build and maintain a cozy pixel village focus/todo game MVP. The web app is a React/Vite shell that embeds a Godot Web export in an iframe.

Do not copy the reference screenshot's exact assets, characters, or layout. Treat `legacy/reference/reference-screenshot.png` as visual direction only.

## Commands

Use these before handing off changes:

```bash
npm run godot:export --prefix apps/game
npm run web:build
```

For local development:

```bash
npm run web:dev
```

## Important Files

- `src/main.tsx`: React iframe shell.
- `src/style.css`: full-viewport iframe styling.
- `godot/project.godot`: Godot project settings and main scene pointer.
- `godot/scenes/main.tscn`: main scene shell.
- `godot/scripts/village.gd`: map composition, game state, timer/todo interactions, and HUD.
- `godot/assets/`: runtime third-party asset files.
- `legacy/`: reference-only material. Do not import from here in app code.
- `docs/`: handoff, risks, QA, and reference notes.

## Engineering Rules

- Keep runtime code independent from `legacy/`.
- Preserve pixel crispness with nearest-neighbor texture filtering, pixel snapping, and whole-number sprite scaling.
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
- New art does not clash with the selected runtime asset folders.

## Current Risks

- Procedural sprites are useful for prototyping but can look homemade.
- More free asset packs may clash unless normalized to the same tile size, palette, and outline style.
- Godot Web export needs export templates and browser QA before sharing a web build.
- Todo persistence is local to Godot `user://` storage only.
