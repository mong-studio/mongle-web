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

- `src/main.tsx`: entry point (createRoot only).
- `src/app/App.tsx`: React app shell, HUD, feature modals, auth state, and API calls.
- `src/app/featureRegistry.ts`: feature modal definitions.
- `src/features/village/PhaserVillage.tsx`: Phaser scene that loads and renders `public/assets/map/mongle.tmj`.
- `src/app/global.css`: full-viewport layout and pixel UI styling.
- `src/features/`: domain features (auth, calendar, character, my-page, planner-chat, todo, village).
- `src/shared/`: cross-domain code (`api/` HTTP client, `ui/` reusable components).
- `public/assets/map/`: Tiled map, tileset definitions, and image assets.

## Notes

- Keep map assets in `public/assets/map/`.
- Keep `mongle.tmj` tileset `source` values aligned with actual `.tsx` filenames.
- Keep `.tsx` image `source` basenames aligned with actual `.png` filenames.
- React UI should remain layered above the Phaser canvas.
