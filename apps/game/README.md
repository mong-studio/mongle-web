# Pixel Village Focus MVP

A small browser game prototype inspired by cozy top-down farming RPG layouts: a pixel village, focus timer, todo panel, clickable NPCs/buildings, and dialogue choices.

This is an original prototype. The reference screenshot is stored under `legacy/reference/` for visual direction only; the code does not extract or copy assets from it.

## Quick Start

Requirements:

- Node.js 20+ recommended
- npm 10+ recommended

Run locally:

```bash
npm install
npm run dev
```

Open the printed local URL, usually:

```text
http://127.0.0.1:5173/
```

AI TODO integration from the workspace root:

```bash
npm run dev
```

This starts the Python API from `packages/ai` and the game screen. The TODO input's `AI 정리` button calls `http://127.0.0.1:8010/api/todos/split`.

Production build:

```bash
npm run build
```

Preview a built version:

```bash
npm run preview
```

## What Is Implemented

- Phaser 3 + TypeScript + Vite app.
- Pixel village map with grass, paths, houses, trees, water, fences, flowers, props, NPCs, and clickable buildings.
- Focus timer with start, pause, and reset.
- Todo list with add, complete toggle, and `localStorage` persistence.
- AI TODO splitting through the local `packages/ai` API.
- NPC/building selection card and bottom dialogue panel.
- Pixel-style HUD with nearest-neighbor rendering.

## Project Structure

```text
.
├── index.html
├── src/
│   ├── main.ts
│   └── style.css
├── public/assets/kenney/
│   ├── License.txt
│   └── Spritesheet/
├── docs/
├── legacy/
└── ASSET_CREDITS.md
```

## Assets And References

Runtime asset:

- Kenney Roguelike/RPG Pack, CC0
- See `ASSET_CREDITS.md`

Archived reference material:

- `legacy/reference/reference-screenshot.png`
- `legacy/vendor/kenney/`
- `legacy/plans/original-plan.md`

## Known Limitations

- The visual style is improved but still not at a polished commercial farming RPG level.
- Houses, trees, props, and NPCs are generated procedurally in Phaser graphics, which keeps the project compact but limits art quality.
- There is no player movement yet; this MVP is a clickable focus/todo village screen.
- No server sync, account system, audio, mobile app packaging, or multiplayer.
- `localStorage` is used for todos, so data stays only in the browser/profile.

## Recommended Next Steps

- Replace generated sprites with a cohesive dedicated tile pack or custom pixel art.
- Add a player character and path/collision movement.
- Move map composition into Tiled JSON for easier level design.
- Add ambient animation: water shimmer, chimney smoke, NPC idle frames, flower sway.
- Add visual regression screenshots for desktop and mobile sizes.
