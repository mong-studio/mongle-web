# Handoff Notes

## Current State

The app is a React/Vite web app with a Phaser-rendered Tiled map background.

Implemented systems:

- Phaser-rendered top-down village map from `public/assets/map/mongle.tmj`.
- Pixel-style React HUD panels.
- Focus timer.
- Todo and quest UI.
- Character creation UI.
- TODO generation/chat/commit requests to API endpoints with local fallback behavior where available.

## How To Evaluate It

1. Run `npm run web:install`.
2. Run `npm run web:dev`.
3. Open `http://127.0.0.1:5173/`.
4. Confirm the Phaser canvas renders a nonblank village map.
5. Confirm HUD panels remain readable.
6. Click the village marker and confirm the dialogue opens.
7. Run `npm run web:build`.

## Files To Edit First

- React app shell: `src/main.tsx`
- Phaser map renderer: `src/PhaserVillage.tsx`
- Visual styles: `src/style.css`
- Map assets: `public/assets/map/`
- Project docs: `README.md`, `docs/*.md`
