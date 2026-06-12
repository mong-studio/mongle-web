# Mongle Game Notes

Build and maintain a cozy pixel village focus/todo game MVP. The web app is a React/Vite application with a Phaser-rendered Tiled map background.

## Commands

```bash
npm run dev
npm run typecheck
npm run build
npm run test
```

## Main Files

- `src/main.tsx`: React app shell, HUD, feature modals, auth state, and API calls.
- `src/PhaserVillage.tsx`: Phaser scene that loads and renders `public/assets/map/mongle.tmj`.
- `src/style.css`: full-viewport layout and pixel UI styling.
- `public/assets/map/`: Tiled map, tileset definitions, and image assets.

## Notes

- Keep map assets in `public/assets/map/`.
- Keep `mongle.tmj` tileset `source` values aligned with actual `.tsx` filenames.
- Keep `.tsx` image `source` basenames aligned with actual `.png` filenames.
- React UI should remain layered above the Phaser canvas.
