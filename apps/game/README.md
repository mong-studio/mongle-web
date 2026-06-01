# Mongle Village Web MVP

A React/Vite web shell that embeds a Godot Web export in an iframe. The Godot scene is a cozy top-down farming RPG style village with a focus timer, todo panel, clickable NPCs/buildings, and dialogue text.

This is an original prototype. The reference screenshot is stored under `legacy/reference/` for visual direction only; the code does not extract or copy assets from it.

## Quick Start

Requirements:

- Node.js 20+ recommended
- npm 10+ recommended
- Godot 4.x for editing/exporting the iframe content

Install and run the React web shell:

```bash
npm install
npm run dev
```

From the workspace root:

```bash
npm run web:dev
```

AI TODO integration from the workspace root:

```bash
npm run dev
```

This starts the Python API from `packages/ai` and the game screen. The TODO input's `AI 정리` button calls `http://127.0.0.1:8010/api/todos/split`.

Export the Godot screen for the iframe:

```bash
npm run godot:export
```

The export writes to `public/godot/index.html`, which the React app embeds at `/godot/index.html`.

## What Is Implemented

- React/Vite shell with a full-viewport iframe.
- Godot project with a single main village scene under `godot/`.
- Pixel village map with grass, paths, houses, trees, water, fences, flowers, props, NPCs, and clickable buildings.
- Focus timer with start, pause, and reset.
- Todo list with add, complete toggle, and Godot `user://` persistence.
- AI TODO splitting through the local `packages/ai` API.
- NPC/building selection card and bottom dialogue panel.
- Pixel-style HUD with nearest-neighbor rendering.

## Project Structure

```text
.
├── project.godot
├── export_presets.cfg
├── scenes/
│   └── main.tscn
├── scripts/
│   └── village.gd
├── godot/
│   ├── project.godot
│   ├── scenes/
│   ├── scripts/
│   └── assets/
├── public/godot/
├── src/
├── docs/
├── legacy/
└── ASSET_CREDITS.md
```

## Assets And References

Runtime assets:

- `godot/assets/grass_tileset/`
- `godot/assets/lpc-flowers-plants-fungi-wood/`
- `godot/assets/lpc-terrains/`
- `godot/assets/submission_daneeklu/`
- See `ASSET_CREDITS.md` and `docs/REFERENCES.md`

Archived reference material:

- `legacy/reference/reference-screenshot.png`
- `legacy/vendor/kenney/`
- `legacy/plans/original-plan.md`

## Known Limitations

- The visual style is still prototype-level and mixes atlas sprites with simple Godot-drawn houses/NPCs.
- There is no player movement yet; this MVP is a clickable focus/todo village screen.
- No server sync, account system, audio, mobile app packaging, or multiplayer.
- `user://` is used for todos inside the Godot iframe, so data stays local to that runtime/profile.

## Recommended Next Steps

- Replace generated sprites with a cohesive dedicated tile pack or custom pixel art.
- Add a player character and path/collision movement.
- Move map composition into a Godot TileMap/TileSet for easier level design.
- Add ambient animation: water shimmer, chimney smoke, NPC idle frames, flower sway.
- Add visual regression screenshots for desktop and mobile sizes.
