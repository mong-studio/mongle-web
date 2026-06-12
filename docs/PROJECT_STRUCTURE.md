# Project Structure

```text
mongle-web/
├── apps/
│   └── game/                      # React/Vite + Phaser web app
├── docs/                          # Workspace docs
├── package.json                   # Workspace npm scripts
└── README.md
```

## Web App

```text

├── public/
│   └── assets/
│       ├── map/                   # Tiled map, tilesets, tile images
│       └── mongle_chief.png
├── src/
│   ├── PhaserVillage.tsx          # Phaser map renderer
│   ├── main.tsx                   # React app shell and UI
│   ├── auth/
│   ├── calendar/
│   └── components/
├── docs/
├── package.json
└── vite.config.ts
```

## Runtime Flow

```text
src/main.tsx
  -> React HUD, panels, modals
  -> PhaserVillage
    -> public/assets/map/mongle.tmj
    -> public/assets/map/*.tsx
    -> public/assets/map/*.png
```

## Common Commands

```bash
npm install
npm run dev
npm run typecheck
npm run build
```
